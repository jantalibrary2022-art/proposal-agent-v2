-- ============================================================
-- SEQUENTIAL INVOICE NUMBERS: PRS/<year>/0001, 0002, ...
-- Run once in the Supabase SQL editor. Atomic, so two payments at the same
-- moment can never get the same number.
-- ============================================================

create table if not exists public.invoice_counters (
  year int primary key,
  last int not null default 0
);
alter table public.invoice_counters enable row level security;
-- No policies: only the service role (server) touches this table.

-- Start the counter after any PRS/<year>/NNNN invoices that already exist,
-- so no number is ever reused.
insert into public.invoice_counters (year, last)
select extract(year from (now() at time zone 'Asia/Kolkata'))::int,
       coalesce(max(nullif(split_part(invoice_no, '/', 3), '')::int), 0)
from public.purchases
where invoice_no ~ ('^PRS/' || extract(year from (now() at time zone 'Asia/Kolkata'))::int || '/[0-9]+$')
on conflict (year) do nothing;

create or replace function public.next_invoice_no()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from (now() at time zone 'Asia/Kolkata'))::int;
  n int;
begin
  insert into public.invoice_counters (year, last) values (y, 1)
  on conflict (year) do update set last = public.invoice_counters.last + 1
  returning last into n;
  return 'PRS/' || y || '/' || lpad(n::text, 4, '0');
end;
$$;

revoke all on function public.next_invoice_no() from public, anon, authenticated;
