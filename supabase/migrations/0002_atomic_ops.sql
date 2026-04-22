-- teams LABO — atomic server-side ops
-- Run after 0001_init.sql. Safe to re-run (create or replace).
--
-- Provides atomic toggles that avoid read-modify-write races when multiple
-- clients mutate the same row concurrently.

-- ============================================================
-- toggle_kudos_reaction: atomically add or remove caller's user_id from the
-- reactions[emoji] array of a kudos row.
-- ============================================================
create or replace function public.toggle_kudos_reaction(
  p_kudos_id uuid,
  p_emoji    text
)
returns public.kudos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user       uuid := auth.uid();
  v_team       uuid;
  v_existing   jsonb;
  v_arr        jsonb;
  v_user_json  jsonb;
  v_new_arr    jsonb;
  v_reactions  jsonb;
  v_row        public.kudos;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  select team_id, reactions into v_team, v_existing
  from public.kudos
  where id = p_kudos_id
  for update;

  if v_team is null then
    raise exception 'kudos not found';
  end if;

  if not public.is_team_member(v_team) then
    raise exception 'not a team member';
  end if;

  v_arr := coalesce(v_existing -> p_emoji, '[]'::jsonb);
  v_user_json := to_jsonb(v_user::text);

  if v_arr @> jsonb_build_array(v_user_json) then
    -- Remove user from array.
    select coalesce(jsonb_agg(elem), '[]'::jsonb)
      into v_new_arr
      from jsonb_array_elements(v_arr) elem
      where elem <> v_user_json;
  else
    v_new_arr := v_arr || jsonb_build_array(v_user_json);
  end if;

  if jsonb_array_length(v_new_arr) = 0 then
    v_reactions := v_existing - p_emoji;
  else
    v_reactions := jsonb_set(v_existing, array[p_emoji], v_new_arr, true);
  end if;

  update public.kudos
    set reactions = v_reactions
    where id = p_kudos_id
    returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.toggle_kudos_reaction(uuid, text) to authenticated;
