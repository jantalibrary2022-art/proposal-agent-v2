-- ============================================================
-- PAYMENTS — link a purchase to the proposal it unlocked.
-- Run once in the Supabase SQL editor (after schema.sql / coupons.sql).
-- ============================================================

alter table public.purchases add column if not exists proposal_id uuid;
create index if not exists purchases_proposal_id_idx on public.purchases (proposal_id);
