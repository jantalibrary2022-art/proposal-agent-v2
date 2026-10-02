-- Prastav — platform tables (feedback, visit analytics, error alerts, purchases, contact)
-- Safe to run more than once. Paste the whole file into the Supabase SQL editor and Run.

-- ============================================================
-- 1. PAGE VIEWS  (visit analytics; written by the server, read by admin)
-- ============================================================
create table if not exists public.page_views (
  id         uuid primary key default gen_random_uuid(),
  path       text not null default '/',
  visitor    text,
  created_at timestamptz not null default now()
);
create index if not exists page_views_created_at_idx on public.page_views (created_at);
alter table public.page_views enable row level security;
-- No public policy needed: inserts and reads both go through the service-role key, which bypasses RLS.

-- ============================================================
-- 2. FEEDBACK  (written by the logged-in user, read by admin)
-- ============================================================
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  proposal_id uuid,
  process     int,
  ease        int,
  quality     int,
  website     int,
  comment     text,
  created_at  timestamptz not null default now()
);
create index if not exists feedback_created_at_idx on public.feedback (created_at);
alter table public.feedback enable row level security;
drop policy if exists feedback_insert_own on public.feedback;
create policy feedback_insert_own on public.feedback
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists feedback_select_own on public.feedback;
create policy feedback_select_own on public.feedback
  for select to authenticated using (user_id = auth.uid());

-- ============================================================
-- 3. ERROR ALERTS  (written by the server on a build failure, read by admin)
-- ============================================================
create table if not exists public.error_alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  proposal_id uuid,
  mode        text,
  message     text,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists error_alerts_created_at_idx on public.error_alerts (created_at);
alter table public.error_alerts enable row level security;
-- Written and read through the service-role key only.

-- ============================================================
-- 4. PURCHASES  (billing history; read by the user, written by the payment webhook)
-- ============================================================
create table if not exists public.purchases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  description text,
  amount      numeric not null default 0,
  currency    text not null default 'INR',
  status      text not null default 'paid',
  invoice_no  text,
  payment_ref text,
  gateway     text,
  created_at  timestamptz not null default now()
);
create index if not exists purchases_user_id_idx on public.purchases (user_id, created_at desc);
alter table public.purchases enable row level security;
drop policy if exists purchases_select_own on public.purchases;
create policy purchases_select_own on public.purchases
  for select to authenticated using (user_id = auth.uid());

-- ============================================================
-- 5. CONTACT MESSAGES  (written by the Contact form, read by admin)
-- ============================================================
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  subject    text,
  message    text not null,
  user_id    uuid,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at);
alter table public.contact_messages enable row level security;
-- Written and read through the service-role key only.
