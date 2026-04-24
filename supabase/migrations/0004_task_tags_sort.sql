-- teams LABO — Task tags + explicit sort order
-- Run this AFTER 0003_activity_comments_notifications.sql.
-- Safe to re-run: uses IF NOT EXISTS / guarded DO blocks.

-- ============================================================
-- Columns: tags (free-form labels) + sort_order (column-local ordering)
-- ============================================================
alter table public.tasks
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.tasks
  add column if not exists sort_order double precision not null default 0;

-- Backfill sort_order for existing rows: spread evenly within each (team, status)
-- bucket, newest first so recently created tasks appear at the top of columns.
do $$
declare
  has_zero_sort boolean;
begin
  select exists (
    select 1 from public.tasks where sort_order = 0
  ) into has_zero_sort;
  if has_zero_sort then
    update public.tasks t
       set sort_order = sub.rn * 1024.0
      from (
        select id,
               row_number() over (
                 partition by team_id, status
                 order by created_at desc
               ) as rn
          from public.tasks
      ) sub
     where t.id = sub.id;
  end if;
end $$;

create index if not exists tasks_team_status_sort_idx
  on public.tasks (team_id, status, sort_order desc);

-- ============================================================
-- RPC: reorder_task
-- Atomically updates (status, sort_order) in one round trip so clients can
-- drop a card between two existing cards without a read/modify/write race.
-- ============================================================
create or replace function public.reorder_task(
  p_task_id     uuid,
  p_status      public.task_status,
  p_sort_order  double precision
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id from public.tasks where id = p_task_id;
  if v_team_id is null then
    raise exception 'task not found' using errcode = '42704';
  end if;
  if not public.is_team_member(v_team_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.tasks
     set status     = p_status,
         sort_order = p_sort_order,
         updated_at = now()
   where id = p_task_id;
end;
$$;

grant execute on function public.reorder_task(uuid, public.task_status, double precision)
  to authenticated;
