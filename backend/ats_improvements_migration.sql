-- "Improve This Resume" usage log — one row per completed Improve run
-- (not per internal iteration; a run can do 1-3 iterations internally but
-- produces exactly one row here once it finishes). Deliberately separate
-- from ats_checks: it is NOT surfaced in ATS history / Dashboard Recent
-- Activity, and exists purely so improveResumeHandler can enforce a
-- per-user lifetime cap on this feature independently of ATS_CHECK_LIMIT.
create table public.ats_improvements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_description text not null,
  initial_score integer not null,
  final_score integer not null,
  iterations integer not null,
  created_at timestamptz not null default now()
);

alter table public.ats_improvements enable row level security;

create policy "Users can view their own ATS improvements"
  on public.ats_improvements for select
  using (auth.uid() = user_id);

create policy "Users can insert their own ATS improvements"
  on public.ats_improvements for insert
  with check (auth.uid() = user_id);

create index ats_improvements_user_id_idx on public.ats_improvements (user_id);
