-- ============================================================
-- Account self-delete support (run once in Supabase → SQL Editor)
-- Keeps invoices (purchases) when a user deletes their account:
-- the link to the user is cleared, and the buyer's name and email
-- are kept on the purchase row as part of the financial record.
-- Safe to run more than once.
-- ============================================================

alter table public.purchases add column if not exists buyer_email text;
alter table public.purchases add column if not exists buyer_name  text;

alter table public.purchases alter column user_id drop not null;

do $$
declare c text;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'purchases' and con.contype = 'f'
      and pg_get_constraintdef(con.oid) like '%auth.users%'
  loop
    execute format('alter table public.purchases drop constraint %I', c);
  end loop;
end $$;

alter table public.purchases
  add constraint purchases_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;
