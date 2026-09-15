-- Owlert — Phase 7: built-in trusted sources
--
-- Run in Supabase Dashboard: Project > SQL Editor > New query > paste > Run.
-- Idempotent — safe to re-run. Purely additive: one new column, existing
-- data untouched, no table dropped/rewritten.
--
-- Built-in sources (PAGASA, GMA News, ABS-CBN News — see
-- lib/sources/built-in.ts) are just regular `sources` rows flagged
-- is_builtin = true, auto-provisioned per user the first time they open
-- the Sources page. This lets them reuse the exact same check/trust/
-- region pipeline as user-added sources with zero new tables.

alter table public.sources
  add column if not exists is_builtin boolean not null default false;

-- Built-in sources must never be deletable by normal users — enforce it in
-- RLS itself (in addition to the app-level check in removeSource), not just
-- by hiding the Remove button.
drop policy if exists sources_delete_own on public.sources;
create policy sources_delete_own on public.sources
  for delete using (auth.uid() = user_id and is_builtin = false);
