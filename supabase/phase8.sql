-- Owlert — Phase 8: real published_at for freshness/history correctness
--
-- Run in Supabase Dashboard: Project > SQL Editor > New query > paste > Run.
-- Idempotent — safe to re-run. Purely additive: one nullable column, no
-- existing data touched, no table dropped/rewritten.
--
-- Until now, source_updates only stored detected_at (when Owlert's own
-- check ran) — never the source's own real publish/issued time. That made
-- it impossible to tell "published 20 hours ago" from "we happened to
-- check it just now," which freshness/active-alert logic needs. The
-- adapter pipeline already computes this (RSS pubDate, PAGASA's "Issued
-- at," article:published_time) — it just wasn't being persisted.
--
-- Nullable and NOT backfilled for existing rows: we only store a real
-- published_at when a source genuinely provides one, never a guess. Existing
-- rows fall back to detected_at at read time (see lib/updates/freshness.ts)
-- rather than being backfilled with a fabricated value here.

alter table public.source_updates
  add column if not exists published_at timestamptz;

create index if not exists source_updates_user_published_idx
  on public.source_updates (user_id, published_at desc);
