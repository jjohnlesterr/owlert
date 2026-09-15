-- Owlert — Phase 4: custom sources + detected weather updates
--
-- Run in Supabase Dashboard: Project > SQL Editor > New query > paste > Run.
-- Idempotent — safe to re-run.
--
-- Deliberately leaner than the schema sketched in PLAN.md (no separate
-- user_sources join table, no notifications table): each custom source in
-- this MVP has exactly one owner, so `sources.user_id` replaces the join,
-- and an unread/read notification model is deferred until real multi-user
-- sharing or push notifications are built.

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  name text not null,
  status text not null default 'unsupported'
    check (status in ('supported', 'limited', 'unsupported')),
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

comment on table public.sources is
  'Custom source URLs a user is monitoring for weather-related updates.';

create table if not exists public.source_updates (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_hash text not null,
  title text not null,
  summary text not null,
  original_url text not null,
  detected_at timestamptz not null default now(),
  unique (source_id, content_hash)
);

comment on table public.source_updates is
  'Weather-relevant content detected from a source, deduped by content_hash.';

create index if not exists source_updates_user_detected_idx
  on public.source_updates (user_id, detected_at desc);

-- RLS ----------------------------------------------------------------------

alter table public.sources enable row level security;
alter table public.source_updates enable row level security;

drop policy if exists sources_select_own on public.sources;
create policy sources_select_own on public.sources
  for select using (auth.uid() = user_id);

drop policy if exists sources_insert_own on public.sources;
create policy sources_insert_own on public.sources
  for insert with check (auth.uid() = user_id);

drop policy if exists sources_update_own on public.sources;
create policy sources_update_own on public.sources
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists sources_delete_own on public.sources;
create policy sources_delete_own on public.sources
  for delete using (auth.uid() = user_id);

drop policy if exists source_updates_select_own on public.source_updates;
create policy source_updates_select_own on public.source_updates
  for select using (auth.uid() = user_id);

drop policy if exists source_updates_insert_own on public.source_updates;
create policy source_updates_insert_own on public.source_updates
  for insert with check (auth.uid() = user_id);
