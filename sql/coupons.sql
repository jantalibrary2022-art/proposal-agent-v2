-- ============================================================
-- COUPONS / ACCESS TOKENS for Prastav
-- Run once in the Supabase SQL editor (after schema.sql).
--
-- Covers two needs on one mechanism:
--   1. Discount codes at checkout (percent / fixed amount off).
--   2. Free access tokens for live testing (kind = 'free', single-use):
--      issue a batch, hand one to each tester, each good for one proposal.
--
-- Both tables are read and written ONLY through the service-role key
-- (server routes). Users never query coupons directly.
-- ============================================================

create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,                 -- stored uppercase
  kind            text not null default 'free' check (kind in ('free','percent','fixed')),
  value           numeric not null default 0,           -- percent: 0-100; fixed: amount; free: ignored
  currency        text not null default 'INR',
  max_uses        integer,                              -- null = unlimited total redemptions
  per_user_limit  integer not null default 1,           -- 0 = unlimited per user
  used_count      integer not null default 0,
  email_allowlist text[],                               -- null/empty = anyone may redeem
  batch           text,                                 -- label grouping a minted batch
  note            text,
  active          boolean not null default true,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);
create unique index if not exists coupons_code_lower_idx on public.coupons (lower(code));
create index if not exists coupons_batch_idx on public.coupons (batch, created_at desc);

create table if not exists public.coupon_redemptions (
  id          uuid primary key default gen_random_uuid(),
  coupon_id   uuid not null references public.coupons (id) on delete cascade,
  code        text not null,
  user_id     uuid not null references auth.users (id) on delete cascade,
  proposal_id uuid,                                      -- soft link (no FK: proposals may predate this file)
  kind        text not null,
  discount    numeric not null default 0,                -- amount discounted (percent/fixed); 0 for free
  created_at  timestamptz not null default now()
);
create index if not exists coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id, created_at desc);
create index if not exists coupon_redemptions_user_idx on public.coupon_redemptions (user_id, created_at desc);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

-- coupons: no policy => unreachable by anon/authenticated; service role bypasses RLS.
-- coupon_redemptions: a user may read their own redemption history; writes go through the function below.
drop policy if exists coupon_redemptions_select_own on public.coupon_redemptions;
create policy coupon_redemptions_select_own on public.coupon_redemptions
  for select to authenticated using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Atomic redemption. Locks the coupon row, enforces every limit,
-- records the redemption and bumps used_count in one transaction,
-- so a code cannot be double-spent under concurrency.
-- Returns jsonb: { ok, reason?, kind?, value?, currency? }
-- ------------------------------------------------------------
create or replace function public.redeem_coupon(
  p_code text,
  p_user uuid,
  p_email text,
  p_proposal uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.coupons%rowtype;
  v_user_count int;
begin
  select * into c from public.coupons where lower(code) = lower(trim(p_code)) for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if not c.active then return jsonb_build_object('ok', false, 'reason', 'inactive'); end if;
  if c.expires_at is not null and c.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'exhausted');
  end if;
  if c.email_allowlist is not null and array_length(c.email_allowlist, 1) is not null then
    if p_email is null or lower(p_email) <> all (select lower(x) from unnest(c.email_allowlist) x) then
      return jsonb_build_object('ok', false, 'reason', 'not_allowed');
    end if;
  end if;
  if c.per_user_limit > 0 then
    select count(*) into v_user_count
      from public.coupon_redemptions
      where coupon_id = c.id and user_id = p_user;
    if v_user_count >= c.per_user_limit then
      return jsonb_build_object('ok', false, 'reason', 'already_used');
    end if;
  end if;

  insert into public.coupon_redemptions (coupon_id, code, user_id, proposal_id, kind, discount)
    values (c.id, c.code, p_user, p_proposal, c.kind, 0);
  update public.coupons set used_count = used_count + 1 where id = c.id;

  return jsonb_build_object('ok', true, 'kind', c.kind, 'value', c.value, 'currency', c.currency);
end;
$$;

revoke all on function public.redeem_coupon(text, uuid, text, uuid) from public, anon, authenticated;
