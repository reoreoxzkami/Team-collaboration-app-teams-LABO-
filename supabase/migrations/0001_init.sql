-- teams LABO — initial schema
-- Run this once in your Supabase project (Dashboard → SQL Editor → New query → paste → Run).
--
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles: 1:1 with auth.users
-- ============================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  avatar_emoji    text not null default '🙂',
  color           text not null default 'from-violet-400 to-fuchsia-500',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create profile row on new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- teams + invite codes
-- ============================================================
create table if not exists public.teams (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  invite_code     text not null unique,
  created_by      uuid not null references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Short random invite code generator (8 chars, uppercase A-Z0-9 without ambiguous chars).
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code     text := '';
  i int;
begin
  for i in 1..8 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end;
$$;

-- ============================================================
-- team_members: membership + per-team status/mood
-- ============================================================
create type public.team_role as enum ('owner', 'admin', 'member');
create type public.member_status as enum ('online', 'focus', 'away', 'offline');

create table if not exists public.team_members (
  id                   uuid primary key default gen_random_uuid(),
  team_id              uuid not null references public.teams(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  role                 public.team_role not null default 'member',
  status               public.member_status not null default 'online',
  current_mood_emoji   text not null default '✨',
  current_mood_note    text not null default '',
  mood_updated_at      timestamptz not null default now(),
  joined_at            timestamptz not null default now(),
  unique (team_id, user_id)
);

create index if not exists team_members_team_idx on public.team_members(team_id);
create index if not exists team_members_user_idx on public.team_members(user_id);

-- Helper: is the caller a member of a given team?
create or replace function public.is_team_member(p_team uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where team_id = p_team and user_id = auth.uid()
  );
$$;

-- ============================================================
-- Content tables (team-scoped)
-- ============================================================
create type public.task_status as enum ('todo', 'doing', 'review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  title       text not null,
  description text not null default '',
  status      public.task_status not null default 'todo',
  priority    public.task_priority not null default 'medium',
  assignee_id uuid references auth.users(id) on delete set null,
  due_date    timestamptz,
  created_by  uuid not null references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tasks_team_idx on public.tasks(team_id);

create table if not exists public.kudos (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  from_id    uuid not null references auth.users(id) on delete set null,
  to_id      uuid not null references auth.users(id) on delete set null,
  message    text not null,
  emoji      text not null default '🎉',
  color      text not null default 'from-violet-500 to-fuchsia-500',
  reactions  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists kudos_team_idx on public.kudos(team_id);

create table if not exists public.polls (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  question    text not null,
  options     jsonb not null default '[]'::jsonb,
  closed      boolean not null default false,
  created_by  uuid not null references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists polls_team_idx on public.polls(team_id);

create table if not exists public.poll_votes (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references public.polls(id) on delete cascade,
  option_id  text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);
create index if not exists poll_votes_poll_idx on public.poll_votes(poll_id);

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  title      text not null,
  content    text not null default '',
  color      text not null default 'from-pink-100 to-rose-200',
  pinned     boolean not null default false,
  author_id  uuid not null references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_team_idx on public.notes(team_id);

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.teams          enable row level security;
alter table public.team_members   enable row level security;
alter table public.tasks          enable row level security;
alter table public.kudos          enable row level security;
alter table public.polls          enable row level security;
alter table public.poll_votes     enable row level security;
alter table public.notes          enable row level security;

-- profiles: read anyone's profile (for display), write only own.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);
drop policy if exists profiles_upsert on public.profiles;
create policy profiles_upsert on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- teams: members can see; creation/update handled via RPC (security definer).
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select using (public.is_team_member(id));

-- team_members: visible to team members only; insert only via RPC.
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members
  for select using (public.is_team_member(team_id));
drop policy if exists team_members_update_self on public.team_members;
create policy team_members_update_self on public.team_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists team_members_delete_self on public.team_members;
create policy team_members_delete_self on public.team_members
  for delete using (user_id = auth.uid());

-- tasks / kudos / polls / notes: members-only CRUD.
do $$
declare t text;
begin
  for t in select unnest(array['tasks', 'kudos', 'polls', 'notes']) loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);

    execute format(
      'create policy %I_select on public.%I for select using (public.is_team_member(team_id))',
      t, t
    );
    execute format(
      'create policy %I_insert on public.%I for insert with check (public.is_team_member(team_id))',
      t, t
    );
    execute format(
      'create policy %I_update on public.%I for update using (public.is_team_member(team_id)) with check (public.is_team_member(team_id))',
      t, t
    );
    execute format(
      'create policy %I_delete on public.%I for delete using (public.is_team_member(team_id))',
      t, t
    );
  end loop;
end
$$;

-- poll_votes: scoped by poll's team membership.
drop policy if exists poll_votes_select on public.poll_votes;
create policy poll_votes_select on public.poll_votes
  for select using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_team_member(p.team_id)
    )
  );
drop policy if exists poll_votes_insert on public.poll_votes;
create policy poll_votes_insert on public.poll_votes
  for insert with check (
    user_id = auth.uid() and exists (
      select 1 from public.polls p
      where p.id = poll_id and public.is_team_member(p.team_id)
    )
  );
drop policy if exists poll_votes_delete on public.poll_votes;
create policy poll_votes_delete on public.poll_votes
  for delete using (user_id = auth.uid());

-- ============================================================
-- RPCs (security definer for privileged actions)
-- ============================================================
create or replace function public.create_team(p_name text)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row  public.teams;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'team name required';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      insert into public.teams(name, invite_code, created_by)
        values (trim(p_name), v_code, auth.uid())
        returning * into v_row;
      exit;
    exception when unique_violation then
      -- retry
    end;
  end loop;

  insert into public.team_members(team_id, user_id, role)
    values (v_row.id, auth.uid(), 'owner');

  return v_row;
end;
$$;

create or replace function public.join_team_by_code(p_code text)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams;
begin
  select * into v_team from public.teams where invite_code = upper(trim(p_code));
  if not found then
    raise exception 'invalid invite code';
  end if;

  insert into public.team_members(team_id, user_id, role)
    values (v_team.id, auth.uid(), 'member')
    on conflict (team_id, user_id) do nothing;

  return v_team;
end;
$$;

grant execute on function public.create_team(text) to authenticated;
grant execute on function public.join_team_by_code(text) to authenticated;
