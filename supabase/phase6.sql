-- Owlert — Phase 6: allow users to delete their own sources + detections
--
-- Run in Supabase Dashboard: Project > SQL Editor > New query > paste > Run.
-- Idempotent — safe to re-run. Purely additive: no table is dropped or
-- rewritten, and no existing policy is removed.
--
-- `sources` already has a delete policy (sources_delete_own, from
-- supabase/phase4.sql). `source_updates` only ever had select/insert
-- policies — removing a source (Sources page "Remove" action) needs to
-- delete its related source_updates too, and RLS blocks that without an
-- explicit delete policy (even a cascade delete triggered by deleting the
-- parent `sources` row still runs the deleting user's RLS checks against
-- source_updates). This adds the matching delete policy, scoped to the
-- row's own owner exactly like every other policy on this table.

drop policy if exists source_updates_delete_own on public.source_updates;
create policy source_updates_delete_own on public.source_updates
  for delete using (auth.uid() = user_id);
