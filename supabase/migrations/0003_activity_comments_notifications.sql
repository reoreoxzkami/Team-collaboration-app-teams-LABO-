-- teams LABO — Activity Feed, Task Comments with @mentions, Notifications
-- Run this AFTER 0001_init.sql and 0002_atomic_ops.sql.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.

-- ============================================================
-- Enums
-- ============================================================
do $$ begin
  create type public.activity_kind as enum (
    'task.created',
    'task.status_changed',
    'task.assignee_changed',
    'task.deleted',
    'comment.created',
    'kudos.created',
    'poll.created',
    'poll.closed',
    'note.created',
    'member.joined',
    'member.mood_updated'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_kind as enum (
    'comment.mention',
    'comment.on_assigned_task',
    'task.assigned',
    'kudos.received',
    'poll.created'
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- task_comments
-- ============================================================
create table if not exists public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  -- user_ids parsed from @mentions at write time (see insert_task_comment RPC).
  mentions    uuid[] not null default '{}'::uuid[],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists task_comments_team_idx on public.task_comments(team_id, created_at desc);
create index if not exists task_comments_task_idx on public.task_comments(task_id, created_at asc);

-- ============================================================
-- activity_events: team-scoped timeline
-- ============================================================
create table if not exists public.activity_events (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  actor_id      uuid references auth.users(id) on delete set null,
  kind          public.activity_kind not null,
  entity_type   text not null,
  entity_id     uuid,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists activity_events_team_created_idx
  on public.activity_events(team_id, created_at desc);

-- ============================================================
-- notifications: per-user inbox
-- ============================================================
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  actor_id      uuid references auth.users(id) on delete set null,
  kind          public.notification_kind not null,
  entity_type   text not null,
  entity_id     uuid,
  payload       jsonb not null default '{}'::jsonb,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id) where read_at is null;

-- ============================================================
-- Row-Level Security
-- ============================================================
alter table public.task_comments    enable row level security;
alter table public.activity_events  enable row level security;
alter table public.notifications    enable row level security;

-- task_comments: members can read; author can insert / edit / delete own.
drop policy if exists task_comments_select on public.task_comments;
create policy task_comments_select on public.task_comments
  for select using (public.is_team_member(team_id));

drop policy if exists task_comments_insert on public.task_comments;
create policy task_comments_insert on public.task_comments
  for insert with check (
    public.is_team_member(team_id) and author_id = auth.uid()
  );

drop policy if exists task_comments_update on public.task_comments;
create policy task_comments_update on public.task_comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists task_comments_delete on public.task_comments;
create policy task_comments_delete on public.task_comments
  for delete using (author_id = auth.uid());

-- activity_events: read-only for team members; writes happen via triggers (SECURITY DEFINER).
drop policy if exists activity_events_select on public.activity_events;
create policy activity_events_select on public.activity_events
  for select using (public.is_team_member(team_id));

-- notifications: each user sees + updates only their own row.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications
  for delete using (user_id = auth.uid());

-- ============================================================
-- Helpers
-- ============================================================
create or replace function public.enqueue_activity(
  p_team_id uuid,
  p_actor_id uuid,
  p_kind public.activity_kind,
  p_entity_type text,
  p_entity_id uuid,
  p_payload jsonb
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.activity_events(team_id, actor_id, kind, entity_type, entity_id, payload)
    values (p_team_id, p_actor_id, p_kind, p_entity_type, p_entity_id, coalesce(p_payload, '{}'::jsonb));
$$;

create or replace function public.enqueue_notification(
  p_team_id uuid,
  p_user_id uuid,
  p_actor_id uuid,
  p_kind public.notification_kind,
  p_entity_type text,
  p_entity_id uuid,
  p_payload jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Don't notify yourself.
  if p_user_id is null or p_user_id = p_actor_id then
    return;
  end if;
  -- Recipient must still be a member of the team.
  if not exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_user_id
  ) then
    return;
  end if;
  insert into public.notifications(team_id, user_id, actor_id, kind, entity_type, entity_id, payload)
    values (p_team_id, p_user_id, p_actor_id, p_kind, p_entity_type, p_entity_id, coalesce(p_payload, '{}'::jsonb));
end;
$$;

-- ============================================================
-- Task triggers
-- ============================================================
create or replace function public.tg_tasks_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_activity(
    new.team_id, new.created_by, 'task.created', 'task', new.id,
    jsonb_build_object('title', new.title, 'assignee_id', new.assignee_id)
  );
  if new.assignee_id is not null and new.assignee_id <> new.created_by then
    perform public.enqueue_notification(
      new.team_id, new.assignee_id, new.created_by,
      'task.assigned', 'task', new.id,
      jsonb_build_object('title', new.title)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_after_insert on public.tasks;
create trigger tasks_after_insert
  after insert on public.tasks
  for each row execute function public.tg_tasks_after_insert();

create or replace function public.tg_tasks_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if new.status is distinct from old.status then
    perform public.enqueue_activity(
      new.team_id, v_actor, 'task.status_changed', 'task', new.id,
      jsonb_build_object('title', new.title, 'from', old.status, 'to', new.status)
    );
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    perform public.enqueue_activity(
      new.team_id, v_actor, 'task.assignee_changed', 'task', new.id,
      jsonb_build_object('title', new.title, 'from', old.assignee_id, 'to', new.assignee_id)
    );
    if new.assignee_id is not null then
      perform public.enqueue_notification(
        new.team_id, new.assignee_id, v_actor,
        'task.assigned', 'task', new.id,
        jsonb_build_object('title', new.title)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_after_update on public.tasks;
create trigger tasks_after_update
  after update on public.tasks
  for each row execute function public.tg_tasks_after_update();

-- ============================================================
-- Kudos trigger
-- ============================================================
create or replace function public.tg_kudos_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_activity(
    new.team_id, new.from_id, 'kudos.created', 'kudos', new.id,
    jsonb_build_object('to_id', new.to_id, 'emoji', new.emoji, 'message', new.message)
  );
  perform public.enqueue_notification(
    new.team_id, new.to_id, new.from_id,
    'kudos.received', 'kudos', new.id,
    jsonb_build_object('emoji', new.emoji, 'message', new.message)
  );
  return new;
end;
$$;

drop trigger if exists kudos_after_insert on public.kudos;
create trigger kudos_after_insert
  after insert on public.kudos
  for each row execute function public.tg_kudos_after_insert();

-- ============================================================
-- Polls trigger
-- ============================================================
create or replace function public.tg_polls_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  perform public.enqueue_activity(
    new.team_id, new.created_by, 'poll.created', 'poll', new.id,
    jsonb_build_object('question', new.question)
  );
  -- Notify all teammates (except the creator) so they can vote.
  for r in
    select user_id from public.team_members where team_id = new.team_id
  loop
    perform public.enqueue_notification(
      new.team_id, r.user_id, new.created_by,
      'poll.created', 'poll', new.id,
      jsonb_build_object('question', new.question)
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists polls_after_insert on public.polls;
create trigger polls_after_insert
  after insert on public.polls
  for each row execute function public.tg_polls_after_insert();

create or replace function public.tg_polls_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.closed is distinct from old.closed and new.closed = true then
    perform public.enqueue_activity(
      new.team_id, auth.uid(), 'poll.closed', 'poll', new.id,
      jsonb_build_object('question', new.question)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists polls_after_update on public.polls;
create trigger polls_after_update
  after update on public.polls
  for each row execute function public.tg_polls_after_update();

-- ============================================================
-- Notes trigger
-- ============================================================
create or replace function public.tg_notes_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_activity(
    new.team_id, new.author_id, 'note.created', 'note', new.id,
    jsonb_build_object('title', new.title)
  );
  return new;
end;
$$;

drop trigger if exists notes_after_insert on public.notes;
create trigger notes_after_insert
  after insert on public.notes
  for each row execute function public.tg_notes_after_insert();

-- ============================================================
-- team_members trigger: joined + mood updates
-- ============================================================
create or replace function public.tg_team_members_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_activity(
    new.team_id, new.user_id, 'member.joined', 'member', new.user_id,
    jsonb_build_object()
  );
  return new;
end;
$$;

drop trigger if exists team_members_after_insert on public.team_members;
create trigger team_members_after_insert
  after insert on public.team_members
  for each row execute function public.tg_team_members_after_insert();

create or replace function public.tg_team_members_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if
    new.current_mood_emoji is distinct from old.current_mood_emoji
    or new.current_mood_note is distinct from old.current_mood_note
  then
    perform public.enqueue_activity(
      new.team_id, new.user_id, 'member.mood_updated', 'member', new.user_id,
      jsonb_build_object(
        'emoji', new.current_mood_emoji,
        'note', new.current_mood_note
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists team_members_after_update on public.team_members;
create trigger team_members_after_update
  after update on public.team_members
  for each row execute function public.tg_team_members_after_update();

-- ============================================================
-- RPC: insert_task_comment (parses @mentions, enqueues activity + notifications)
-- ============================================================
create or replace function public.insert_task_comment(
  p_task_id uuid,
  p_body text,
  p_mentions uuid[]
) returns public.task_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task    public.tasks;
  v_row     public.task_comments;
  v_actor   uuid := auth.uid();
  v_clean   uuid[];
  v_uid     uuid;
begin
  if v_actor is null then
    raise exception 'not authenticated';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'comment body required';
  end if;

  select * into v_task from public.tasks where id = p_task_id;
  if not found then
    raise exception 'task not found';
  end if;
  if not public.is_team_member(v_task.team_id) then
    raise exception 'not a team member';
  end if;

  -- Keep only mentions that are actual teammates (and not the author).
  v_clean := array(
    select distinct m.user_id
    from public.team_members m
    where m.team_id = v_task.team_id
      and m.user_id = any(coalesce(p_mentions, '{}'::uuid[]))
      and m.user_id <> v_actor
  );

  insert into public.task_comments(team_id, task_id, author_id, body, mentions)
    values (v_task.team_id, v_task.id, v_actor, trim(p_body), v_clean)
    returning * into v_row;

  perform public.enqueue_activity(
    v_task.team_id, v_actor, 'comment.created', 'task', v_task.id,
    jsonb_build_object(
      'comment_id', v_row.id,
      'title', v_task.title,
      'preview', left(v_row.body, 140),
      'mentions_count', coalesce(array_length(v_clean, 1), 0)
    )
  );

  -- Notify assignee (if not author and not already in mentions).
  if v_task.assignee_id is not null and v_task.assignee_id <> v_actor
     and not (v_task.assignee_id = any(v_clean)) then
    perform public.enqueue_notification(
      v_task.team_id, v_task.assignee_id, v_actor,
      'comment.on_assigned_task', 'task', v_task.id,
      jsonb_build_object(
        'comment_id', v_row.id,
        'title', v_task.title,
        'preview', left(v_row.body, 140)
      )
    );
  end if;

  -- Notify everyone mentioned (dedup + self-skip already applied).
  foreach v_uid in array v_clean loop
    perform public.enqueue_notification(
      v_task.team_id, v_uid, v_actor,
      'comment.mention', 'task', v_task.id,
      jsonb_build_object(
        'comment_id', v_row.id,
        'title', v_task.title,
        'preview', left(v_row.body, 140)
      )
    );
  end loop;

  return v_row;
end;
$$;

grant execute on function public.insert_task_comment(uuid, text, uuid[]) to authenticated;

-- ============================================================
-- RPC: mark notifications as read (bulk or single)
-- ============================================================
create or replace function public.mark_notifications_read(p_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
     set read_at = now()
   where user_id = auth.uid()
     and read_at is null
     and id = any(coalesce(p_ids, '{}'::uuid[]));
$$;

grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- Drop an older 0-arg version that may have been created by prior runs of this
-- migration; the new signature takes an optional team scope.
drop function if exists public.mark_all_notifications_read();

create or replace function public.mark_all_notifications_read(
  p_team_id uuid default null
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
     set read_at = now()
   where user_id = auth.uid()
     and read_at is null
     and (p_team_id is null or team_id = p_team_id);
$$;

grant execute on function public.mark_all_notifications_read(uuid) to authenticated;
