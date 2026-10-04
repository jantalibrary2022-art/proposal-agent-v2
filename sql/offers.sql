-- ============================================================
-- Automatic offers (run once in Supabase → SQL Editor). Safe to re-run.
-- The first offer is "Founding member": half the fee on a user's first paid
-- proposal, for the first 20 paying users. Switch it on/off from Admin → Offers.
-- ============================================================

create table if not exists public.offers (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  kind        text not null default 'percent' check (kind in ('percent','fixed')),
  value       numeric not null,                 -- percent 0-100, or rupees for fixed
  audience    text not null default 'first_purchase',
  max_total   integer,                          -- null = unlimited
  starts_at   timestamptz,
  ends_at     timestamptz,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.offers enable row level security;
-- No policies: only the server (service role) reads or writes it.

insert into public.offers (code, name, kind, value, audience, max_total, active)
values ('founding', 'Founding member', 'percent', 50, 'first_purchase', 20, true)
on conflict (code) do nothing;

-- Which offer a payment used, and the list price at the time (for the invoice).
alter table public.purchases add column if not exists offer_code  text;
alter table public.purchases add column if not exists list_amount numeric;
