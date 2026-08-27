create table public.ats_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_description text not null,
  overall_score integer not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.ats_checks enable row level security;

create policy "Users can view their own ATS checks"
  on public.ats_checks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own ATS checks"
  on public.ats_checks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own ATS checks"
  on public.ats_checks for delete
  using (auth.uid() = user_id);

create index ats_checks_user_id_created_at_idx on public.ats_checks (user_id, created_at desc);
