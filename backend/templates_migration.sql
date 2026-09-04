-- Phase 2: uploaded-CV template detection/registration.
--
-- Two independent changes bundled in one file (both additive, both safe to
-- run together):
--
-- 1. `public.templates` — user-owned records for a document design that
--    was uploaded (via POST /api/resumes/upload) and did NOT match one of
--    the app's built-in rendering templates (classic/modern/minimal, which
--    remain plain frontend constants in templateMeta.js — they are not,
--    and do not need to become, rows in this table). Every row here is
--    implicitly category "Other"; there is no column for the built-in
--    category because built-ins never live in this table.
--
--    Ownership: user-owned (not global) — ownership/security matches
--    every other per-user table in this project (ats_checks,
--    ats_improvements): ownership is enforced by `user_id` + RLS, never a
--    client-supplied id. This is deliberate per-user scoping, not a
--    Supabase requirement — see backend/services/templateService.js for
--    the reasoning (mirrors the resume the template was detected from,
--    which is itself always private to its uploader).
--
--    Deduplication: `(user_id, fingerprint)` is UNIQUE — re-uploading a
--    document that produces the same fingerprint reuses the existing row
--    instead of creating a duplicate "Other" entry. See
--    backend/services/templateFingerprint.js for what the fingerprint is
--    built from (deliberately layout/structure signals only — never raw
--    resume content).
--
-- 2. `ats_checks.resume_id` becomes nullable. A CV uploaded directly to
--    the ATS Checker (never saved as a resume — see
--    controllers/atsController.js's temporaryResumeContent path) has no
--    resume to reference, but should still count toward a user's lifetime
--    ATS_CHECK_LIMIT the same way a saved-resume check does — the
--    project-wide daily Gemini quota already applies equally to both
--    paths, but the *lifetime* cap is enforced by counting rows in this
--    table, so a temporary check needs a row (with resume_id = null) to
--    be counted at all. Before this change, temporary checks were
--    silently exempt from the lifetime cap entirely.

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  source text not null default 'user_upload',
  fingerprint text not null,
  is_system_template boolean not null default false,
  is_imported boolean not null default true,
  preview_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.templates enable row level security;

create policy "Users can view their own imported templates"
  on public.templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own imported templates"
  on public.templates for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own imported templates"
  on public.templates for delete
  using (auth.uid() = user_id);

create unique index templates_user_fingerprint_idx on public.templates (user_id, fingerprint);
create index templates_user_id_idx on public.templates (user_id);

-- A saved resume MAY reference the "Other" template record it was
-- imported from, purely as provenance metadata — this does NOT change
-- which React component renders the resume (that's still governed by the
-- existing `resumes.template_id` text column, e.g. 'classic', because
-- only the 3 built-in components actually exist to render anything). Set
-- null (not cascaded to delete the resume) if the source template record
-- is ever removed, since the resume's own renderable content is
-- unaffected either way.
alter table public.resumes
  add column if not exists imported_template_id uuid references public.templates(id) on delete set null;

-- Lets a temporary (unsaved) ATS check be logged for lifetime-cap counting
-- purposes without a resume to reference — see point 2 above.
alter table public.ats_checks
  alter column resume_id drop not null;
