-- ════════════════════════════════════════════════════════════
--  LEVIATHAN — Supabase Schema  (Free Tier Optimised)
--  Free tier: 500MB database, 2GB bandwidth
--  Auto-cleanup keeps DB small forever.
--  Run this in: Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- BUILDS TABLE
-- ─────────────────────────────────────────────────────────────
create table if not exists public.builds (
  id              uuid        primary key default gen_random_uuid(),
  session_id      text        not null,
  project_type    text        not null,
  output_format   text        not null default 'apk',
  build_flavor    text        not null default 'debug',
  status          text        not null default 'pending',
  app_config      jsonb       not null default '{}',
  github_run_id   text,
  github_repo     text,
  github_owner    text,
  artifact_url    text,
  artifact_size   bigint,
  logs            text,
  error_message   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists builds_session_idx    on public.builds (session_id);
create index if not exists builds_status_idx     on public.builds (status);
create index if not exists builds_created_at_idx on public.builds (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- PROJECTS TABLE
-- ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid        primary key default gen_random_uuid(),
  session_id  text        not null,
  name        text        not null default 'Untitled',
  type        text        not null,
  config      jsonb       not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_session_idx on public.projects (session_id);

-- ─────────────────────────────────────────────────────────────
-- AUTO updated_at TRIGGER
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists builds_updated_at  on public.builds;
drop trigger if exists projects_updated_at on public.projects;

create trigger builds_updated_at
  before update on public.builds
  for each row execute function public.set_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- AUTO-CLEANUP  ← Keeps DB under 500MB free tier forever
--
-- Deletes:
--   • Completed/failed builds older than 24 hours
--   • Pending/stuck builds older than 2 hours
--   • Old projects older than 7 days
--
-- HOW TO ENABLE:
--   Supabase Dashboard → Extensions → search "pg_cron" → Enable
--   Then uncomment the cron.schedule block below and run it.
-- ─────────────────────────────────────────────────────────────
create or replace function public.cleanup_old_data()
returns void language plpgsql as $$
begin
  -- Delete terminal builds > 24h
  delete from public.builds
  where status in ('success', 'failed', 'cancelled', 'timeout')
    and created_at < now() - interval '24 hours';

  -- Delete stuck pending/queued builds > 2h
  delete from public.builds
  where status in ('pending', 'queued', 'running')
    and created_at < now() - interval '2 hours';

  -- Delete old projects > 7 days
  delete from public.projects
  where created_at < now() - interval '7 days';
end;
$$;

-- ── Enable pg_cron first, then uncomment: ───────────────────
-- select cron.schedule(
--   'leviathan-cleanup',
--   '0 * * * *',        -- every hour
--   $$ select public.cleanup_old_data(); $$
-- );
--
-- To verify cron is scheduled:
-- select * from cron.job;
--
-- To remove cron job:
-- select cron.unschedule('leviathan-cleanup');

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table public.builds   enable row level security;
alter table public.projects enable row level security;

-- Allow all (session filtering handled in application layer)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='builds' and policyname='allow_all_builds') then
    create policy "allow_all_builds" on public.builds for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='allow_all_projects') then
    create policy "allow_all_projects" on public.projects for all using (true) with check (true);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- REALTIME (for live build status in browser — free feature)
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.builds;
