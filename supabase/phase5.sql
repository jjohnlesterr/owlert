-- Owlert — Phase 5: trusted source verification + region-based filtering
--
-- Run in Supabase Dashboard: Project > SQL Editor > New query > paste > Run.
-- Idempotent — safe to re-run. Purely additive: no table is dropped or
-- rewritten, existing RLS policies are untouched, and every new column
-- either allows null or has a safe default so existing rows keep working.

-- 1. profiles.preferred_region ------------------------------------------
-- null = "All Regions" (the default — no migration needed for existing rows).

alter table public.profiles
  add column if not exists preferred_region text
    check (
      preferred_region is null
      or preferred_region in (
        'NCR', 'CAR', 'REGION_I', 'REGION_II', 'REGION_III', 'REGION_IV_A',
        'REGION_IV_B', 'REGION_V', 'REGION_VI', 'REGION_VII', 'REGION_VIII',
        'REGION_IX', 'REGION_X', 'REGION_XI', 'REGION_XII', 'REGION_XIII',
        'BARMM', 'NIR'
      )
    );

-- 2. sources.trust_level / trust_reason -----------------------------------
-- Backfills existing rows to 'unverified' — the honest "we haven't
-- classified this yet" default, never "fake". Re-running Check Now on an
-- existing source will assign its real trust_level.

alter table public.sources
  add column if not exists trust_level text not null default 'unverified'
    check (
      trust_level in (
        'official', 'trusted_news', 'verified_organization',
        'unverified', 'limited', 'unsupported'
      )
    ),
  add column if not exists trust_reason text;

-- 3. source_updates.affected_regions / detected_locations -----------------
-- Empty arrays for existing rows — "no reliable location determined" for
-- content detected before this migration, matching the "do not guess" rule.

alter table public.source_updates
  add column if not exists affected_regions text[] not null default '{}',
  add column if not exists detected_locations text[] not null default '{}';

create index if not exists source_updates_affected_regions_idx
  on public.source_updates using gin (affected_regions);
