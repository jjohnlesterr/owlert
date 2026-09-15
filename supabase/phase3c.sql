-- Owlert — Phase 3C: categorize detected updates for the Updates page filters
--
-- Run in Supabase Dashboard: Project > SQL Editor > New query > paste > Run.
-- Idempotent — safe to re-run.
--
-- Alters `source_updates` (created in supabase/phase4.sql). Adds a
-- `category` used by the Updates page's All/Weather/Classes/School filter
-- chips, plus optional `severity`/`location` for when a future extraction
-- step can populate them. category is assigned by simple keyword rules in
-- lib/sources/check-source.ts — no AI involved. Existing rows backfill to
-- 'weather' since that's what the current keyword filter exclusively
-- detected before this change.

alter table public.source_updates
  add column if not exists category text not null default 'weather'
    check (category in ('weather', 'classes', 'school')),
  add column if not exists severity text
    check (severity is null or severity in ('info', 'advisory', 'warning', 'critical')),
  add column if not exists location text;

create index if not exists source_updates_user_category_idx
  on public.source_updates (user_id, category);
