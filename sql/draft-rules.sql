-- ============================================================
-- Unpaid-draft rules (run once in Supabase → SQL Editor). Safe to re-run.
--  * draft_ledger: one row per draft generated while the paywall is on.
--    Holds only ids, flags and dates (no proposal content), so a deleted
--    draft still counts toward the unpaid-draft limit.
--  * purchases.prepaid: marks a payment made BEFORE generation (a credit
--    that attaches to the next proposal the user generates).
-- ============================================================

create table if not exists public.draft_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  proposal_id uuid not null unique,
  failed      boolean not null default false,   -- generation failed: never counts
  deleted     boolean not null default false,   -- user deleted it before it expired
  free        boolean not null default false,   -- a code made it free: never counts
  purged      boolean not null default false,   -- purge check done for this row
  created_at  timestamptz not null default now()
);
alter table public.draft_ledger add column if not exists deleted boolean not null default false;
alter table public.draft_ledger add column if not exists free    boolean not null default false;
alter table public.draft_ledger add column if not exists purged  boolean not null default false;
create index if not exists draft_ledger_user_idx  on public.draft_ledger (user_id, created_at desc);
create index if not exists draft_ledger_purge_idx on public.draft_ledger (created_at) where purged = false;
alter table public.draft_ledger enable row level security;
-- No policies: only the server (service role) reads or writes it.

alter table public.purchases add column if not exists prepaid boolean not null default false;

-- Any upfront payment stored before this column existed.
update public.purchases set prepaid = true
  where proposal_id is null and payment_ref is not null and description like '%paid in advance%';

-- One purchase per Razorpay payment (stops a payment being recorded twice when
-- the checkout callback and the webhook arrive together). If old duplicates
-- exist, this step is skipped with a notice and everything above still applies.
do $$
begin
  create unique index if not exists purchases_payment_ref_uq
    on public.purchases (payment_ref) where payment_ref is not null;
exception when unique_violation then
  raise notice 'Duplicate payment_ref values exist in purchases; unique index not created. Ask Claude to help clean them up.';
end $$;
