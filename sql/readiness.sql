-- ============================================================
-- ACCREDITATION READINESS self-check — cohort responses
-- Privacy boundary: ratings only, no PII, no 90-day commitment.
-- Raw rows are never readable by anon; only the security-definer
-- aggregate RPC returns counts. Do not weaken this.
-- Run once in Supabase -> SQL Editor.
-- ============================================================
create table if not exists public.readiness_responses (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session    text not null,
  lang       text,
  answers    jsonb not null   -- { a:{...}, b:{...}, c:{...} } ratings only
);
create index if not exists readiness_responses_session_idx on public.readiness_responses (session);
alter table public.readiness_responses enable row level security;

-- Participants may INSERT their own response; nobody may SELECT raw rows.
drop policy if exists "anon can insert" on public.readiness_responses;
create policy "anon can insert" on public.readiness_responses
  for insert to anon with check (true);
-- (intentionally NO select policy for anon)

-- Aggregated counts only. Raw answers never leave the DB.
-- Returns { respondents, tally } where tally keys are "<part>.<itemId>" -> { counts: { val: n } }.
create or replace function public.readiness_aggregate(p_session text)
returns jsonb language sql security definer set search_path = public as $$
  with r as (select answers from public.readiness_responses where session = p_session),
  flat as (
    select part.key as part, item.key as item, (item.value #>> '{}') as val
    from r, lateral jsonb_each(r.answers) part, lateral jsonb_each(part.value) item
  ),
  tally as (
    select part, item, jsonb_object_agg(val, c) as counts
    from (select part, item, val, count(*) c from flat group by part, item, val) s
    group by part, item
  )
  select jsonb_build_object(
    'respondents', (select count(*) from r),
    'tally', coalesce(
      (select jsonb_object_agg(part||'.'||item, jsonb_build_object('counts', counts)) from tally),
      '{}'::jsonb)
  );
$$;
grant execute on function public.readiness_aggregate(text) to anon;
