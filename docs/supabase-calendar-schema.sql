-- The Nest Supabase schema for assistant-readable calendar sync.
-- Run this in the Supabase SQL editor for the project that will back The Nest.
-- Replace 00000000-0000-0000-0000-000000000000 with Destynee's Supabase Auth user UUID
-- once Auth is configured.

create extension if not exists pgcrypto;

create table if not exists public.calendar_events (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null,
    title text not null check (length(trim(title)) > 0),
    event_date date not null,
    start_time time not null,
    end_time time not null,
    calendar text not null default 'other' check (calendar in (
        'class', 'dissertation', 'study', 'meeting', 'clinical', 'wellness', 'personal', 'other'
    )),
    repeat_rule text not null default 'none' check (repeat_rule in ('none', 'daily', 'weekly', 'monthly')),
    reminder text not null default 'none',
    location text not null default '',
    notes text not null default '',
    source text not null default 'nest_frontend',
    status text not null default 'planned' check (status in ('planned', 'confirmed', 'done', 'canceled', 'tentative')),
    is_deleted boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (end_time > start_time)
);

create index if not exists calendar_events_owner_date_idx
    on public.calendar_events (owner_id, event_date, start_time)
    where is_deleted = false;

create index if not exists calendar_events_updated_idx
    on public.calendar_events (owner_id, updated_at desc);

create table if not exists public.assistant_sync_log (
    id bigint generated always as identity primary key,
    owner_id uuid not null,
    actor text not null check (actor in ('nest_frontend', 'sonya', 'hermes_cron', 'manual_import', 'supabase')),
    action text not null,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists assistant_sync_log_owner_created_idx
    on public.assistant_sync_log (owner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_calendar_events_updated_at on public.calendar_events;
create trigger set_calendar_events_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

create or replace view public.assistant_calendar_events as
select
    id,
    owner_id,
    title,
    event_date,
    start_time,
    end_time,
    calendar,
    repeat_rule,
    reminder,
    location,
    notes,
    source,
    status,
    created_at,
    updated_at
from public.calendar_events
where is_deleted = false;

alter table public.calendar_events enable row level security;
alter table public.assistant_sync_log enable row level security;

-- Recommended browser policy: only the signed-in Supabase user can read/write their own events.
-- This keeps the frontend safe with the public anon key because Supabase Auth + RLS enforce ownership.
drop policy if exists "calendar_events_select_own" on public.calendar_events;
create policy "calendar_events_select_own"
on public.calendar_events for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "calendar_events_insert_own" on public.calendar_events;
create policy "calendar_events_insert_own"
on public.calendar_events for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "calendar_events_update_own" on public.calendar_events;
create policy "calendar_events_update_own"
on public.calendar_events for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "assistant_sync_log_insert_own" on public.assistant_sync_log;
create policy "assistant_sync_log_insert_own"
on public.assistant_sync_log for insert
to authenticated
with check (owner_id = auth.uid());

-- Server-side Sonya/Hermes scheduled jobs should use the service_role key from environment
-- variables. Service-role clients bypass RLS, so do not expose that key in frontend files.

-- Optional one-time smoke-test insert. Replace the owner_id with the real Auth user UUID first.
-- insert into public.calendar_events (owner_id, title, event_date, start_time, end_time, calendar, notes)
-- values ('00000000-0000-0000-0000-000000000000', 'Supabase smoke test', current_date, '09:00', '09:30', 'other', 'Created from SQL editor');
