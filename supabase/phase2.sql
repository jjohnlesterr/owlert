-- Owlert — Phase 2: profiles table, RLS, and auto-provisioning trigger
--
-- Run this in the Supabase Dashboard: Project > SQL Editor > New query > paste > Run.
-- Safe to re-run: every statement is idempotent (create-if-not-exists /
-- drop-then-create for policies, triggers, and functions).

-- 1. Table -------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  school text,
  city text,
  province text,
  education_level text,
  notification_preferences jsonb not null default '{"weather": true, "classes": true, "school": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_education_level_check check (
    education_level is null
    or education_level in ('elementary', 'junior_high', 'senior_high', 'college', 'other')
  )
);

comment on table public.profiles is
  'One row per authenticated user. id mirrors auth.users.id. No extra indexes beyond the primary key — table stays small for an MVP hackathon build.';

-- 2. Row Level Security --------------------------------------------------
-- RLS must remain enabled. Every user can only see/insert/update the one
-- row that matches their own auth.uid(). No delete policy is defined, so
-- deletes are blocked entirely for regular clients (least privilege).

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. updated_at trigger ---------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- 4. Auto-create a profile row when a user signs up -----------------------
-- SECURITY DEFINER is required: this runs as part of the auth.users insert,
-- before the new user has a session, so it must bypass RLS to write the
-- matching profiles row. full_name is seeded from the signup form's
-- `options.data.full_name` (see app/signup/actions.ts).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
