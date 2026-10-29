-- Vantagallu-only objects. This migration does not change other applications or auth settings.
begin;

create table if not exists public.vantagallu_recipes (
  id text primary key, version integer not null check (version > 0),
  data jsonb not null check (jsonb_typeof(data) = 'object'), updated_at timestamptz not null default now()
);
create table if not exists public.vantagallu_sessions (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object'), revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id, user_id)
);
create index if not exists vantagallu_sessions_owner_updated on public.vantagallu_sessions(user_id, updated_at desc);
create table if not exists public.vantagallu_events (
  id bigint generated always as identity primary key, user_id uuid not null, session_id uuid not null,
  command_id text not null check (length(command_id) between 1 and 120), command jsonb not null,
  result_revision integer not null, created_at timestamptz not null default now(),
  foreign key(session_id, user_id) references public.vantagallu_sessions(id, user_id) on delete cascade,
  unique(user_id, session_id, command_id)
);
create table if not exists public.vantagallu_messages (
  id text not null, user_id uuid not null, session_id uuid not null, payload jsonb not null,
  created_at timestamptz not null, primary key(session_id, id),
  foreign key(session_id, user_id) references public.vantagallu_sessions(id, user_id) on delete cascade
);
create index if not exists vantagallu_messages_owner_session on public.vantagallu_messages(user_id, session_id, created_at);
create table if not exists public.vantagallu_timers (
  id text not null, user_id uuid not null, session_id uuid not null, payload jsonb not null,
  due_at timestamptz, status text not null check (status in ('running','paused','cancelled')),
  primary key(session_id, id),
  foreign key(session_id, user_id) references public.vantagallu_sessions(id, user_id) on delete cascade
);
create table if not exists public.vantagallu_voice_leases (
  session_id uuid primary key, user_id uuid not null, lease_id uuid not null, device_id text not null,
  epoch bigint not null default 1, expires_at timestamptz not null,
  foreign key(session_id, user_id) references public.vantagallu_sessions(id, user_id) on delete cascade
);
create table if not exists public.vantagallu_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade, day date not null,
  chat_count integer not null default 0, voice_seconds integer not null default 0, primary key(user_id, day)
);
create table if not exists public.vantagallu_usage_requests (
  user_id uuid not null references auth.users(id) on delete cascade, request_id text not null,
  session_id uuid not null, kind text not null check (kind in ('chat','voice')), amount integer not null check (amount > 0),
  created_at timestamptz not null default now(), primary key(user_id, request_id),
  foreign key(session_id, user_id) references public.vantagallu_sessions(id, user_id) on delete cascade
);
create index if not exists vantagallu_usage_session on public.vantagallu_usage_requests(user_id, session_id, kind);

alter table public.vantagallu_recipes enable row level security;
alter table public.vantagallu_sessions enable row level security;
alter table public.vantagallu_events enable row level security;
alter table public.vantagallu_messages enable row level security;
alter table public.vantagallu_timers enable row level security;
alter table public.vantagallu_voice_leases enable row level security;
alter table public.vantagallu_usage_daily enable row level security;
alter table public.vantagallu_usage_requests enable row level security;

drop policy if exists vantagallu_recipes_read on public.vantagallu_recipes;
create policy vantagallu_recipes_read on public.vantagallu_recipes for select to authenticated using (true);
-- Browsers may read their own records, but all writes go through the validated API.
drop policy if exists vantagallu_sessions_owner_read on public.vantagallu_sessions;
create policy vantagallu_sessions_owner_read on public.vantagallu_sessions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists vantagallu_events_owner_read on public.vantagallu_events;
create policy vantagallu_events_owner_read on public.vantagallu_events for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists vantagallu_messages_owner_read on public.vantagallu_messages;
create policy vantagallu_messages_owner_read on public.vantagallu_messages for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists vantagallu_timers_owner_read on public.vantagallu_timers;
create policy vantagallu_timers_owner_read on public.vantagallu_timers for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.vantagallu_recipes, public.vantagallu_sessions, public.vantagallu_events, public.vantagallu_messages, public.vantagallu_timers, public.vantagallu_voice_leases, public.vantagallu_usage_daily, public.vantagallu_usage_requests from anon, authenticated;
grant select on public.vantagallu_recipes, public.vantagallu_sessions, public.vantagallu_events, public.vantagallu_messages, public.vantagallu_timers to authenticated;
grant all on public.vantagallu_recipes, public.vantagallu_sessions, public.vantagallu_events, public.vantagallu_messages, public.vantagallu_timers, public.vantagallu_voice_leases, public.vantagallu_usage_daily, public.vantagallu_usage_requests to service_role;

create or replace function public.vantagallu_sync_children(p_owner_id uuid, p_session_id uuid, p_state jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.vantagallu_messages(id,user_id,session_id,payload,created_at)
    select value->>'id',p_owner_id,p_session_id,value,(value->>'createdAt')::timestamptz
    from jsonb_array_elements(coalesce(p_state->'messages','[]'::jsonb))
    on conflict(session_id,id) do nothing;
  delete from public.vantagallu_timers t where t.session_id=p_session_id and t.user_id=p_owner_id
    and not exists(select 1 from jsonb_array_elements(coalesce(p_state->'timers','[]'::jsonb)) v where v->>'id'=t.id);
  insert into public.vantagallu_timers(id,user_id,session_id,payload,due_at,status)
    select value->>'id',p_owner_id,p_session_id,value,(value->>'endAt')::timestamptz,value->>'status'
    from jsonb_array_elements(coalesce(p_state->'timers','[]'::jsonb))
    on conflict(session_id,id) do update set payload=excluded.payload,due_at=excluded.due_at,status=excluded.status;
end; $$;

create or replace function public.vantagallu_create_session(p_owner_id uuid,p_state jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare result public.vantagallu_sessions%rowtype; session_id uuid; clean jsonb;
begin
  session_id := (p_state->>'id')::uuid;
  clean := jsonb_set(jsonb_set(jsonb_set(p_state,'{ownerId}',to_jsonb(p_owner_id::text)),'{revision}','0'::jsonb),'{updatedAt}',to_jsonb(clock_timestamp()));
  insert into public.vantagallu_sessions(id,user_id,state,revision) values(session_id,p_owner_id,clean,0) on conflict(id) do nothing;
  select * into result from public.vantagallu_sessions where id=session_id and user_id=p_owner_id for update;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  if result.state->>'recipeId' <> clean->>'recipeId' then return jsonb_build_object('ok',false,'code','command_id_reused'); end if;
  perform public.vantagallu_sync_children(p_owner_id,session_id,result.state);
  return jsonb_build_object('ok',true,'session',result.state);
end; $$;

create or replace function public.vantagallu_commit_command(p_owner_id uuid,p_session_id uuid,p_command_id text,p_expected_revision integer,p_command jsonb,p_state jsonb,p_voice_lease_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare current_session public.vantagallu_sessions%rowtype; previous public.vantagallu_events%rowtype; clean jsonb;
begin
  select * into current_session from public.vantagallu_sessions where id=p_session_id and user_id=p_owner_id for update;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  select * into previous from public.vantagallu_events where user_id=p_owner_id and session_id=p_session_id and command_id=p_command_id;
  if found then
    if previous.command <> p_command then return jsonb_build_object('ok',false,'code','command_id_reused'); end if;
    return jsonb_build_object('ok',true,'session',current_session.state,'replayed',true,'commandRevision',previous.result_revision);
  end if;
  if p_voice_lease_id is not null and not exists(select 1 from public.vantagallu_voice_leases where session_id=p_session_id and user_id=p_owner_id and lease_id=p_voice_lease_id and expires_at>now()) then
    return jsonb_build_object('ok',false,'code','lease_expired');
  end if;
  if current_session.revision <> p_expected_revision then return jsonb_build_object('ok',false,'code','revision_conflict','session',current_session.state); end if;
  if (p_state->>'revision')::integer <> p_expected_revision+1 or (p_state->>'id')::uuid <> p_session_id
    or p_state->>'recipeId' <> current_session.state->>'recipeId'
    or p_state->>'recipeVersion' <> current_session.state->>'recipeVersion' then raise exception 'Invalid canonical state'; end if;
  clean := jsonb_set(jsonb_set(p_state,'{ownerId}',to_jsonb(p_owner_id::text)),'{updatedAt}',to_jsonb(clock_timestamp()));
  update public.vantagallu_sessions set state=clean,revision=p_expected_revision+1,updated_at=now() where id=p_session_id;
  insert into public.vantagallu_events(user_id,session_id,command_id,command,result_revision) values(p_owner_id,p_session_id,p_command_id,p_command,p_expected_revision+1);
  perform public.vantagallu_sync_children(p_owner_id,p_session_id,clean);
  return jsonb_build_object('ok',true,'session',clean,'replayed',false,'commandRevision',p_expected_revision+1);
end; $$;

create or replace function public.vantagallu_voice_lease(p_owner_id uuid,p_session_id uuid,p_device_id text,p_action text,p_lease_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare current_lease public.vantagallu_voice_leases%rowtype;
begin
  perform 1 from public.vantagallu_sessions where id=p_session_id and user_id=p_owner_id for update;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  select * into current_lease from public.vantagallu_voice_leases where session_id=p_session_id and user_id=p_owner_id;
  if p_action='release' then
    if current_lease.lease_id is distinct from p_lease_id or current_lease.device_id is distinct from p_device_id then return jsonb_build_object('ok',false,'code','lease_expired'); end if;
    delete from public.vantagallu_voice_leases where session_id=p_session_id;
    return jsonb_build_object('ok',true,'lease',null);
  elsif p_action='renew' then
    if current_lease.lease_id is distinct from p_lease_id or current_lease.device_id is distinct from p_device_id or current_lease.expires_at<=now() then return jsonb_build_object('ok',false,'code','lease_expired'); end if;
    update public.vantagallu_voice_leases set expires_at=now()+interval '60 seconds' where session_id=p_session_id returning * into current_lease;
  elsif p_action in ('acquire','takeover') then
    if p_action='acquire' and current_lease.expires_at>now() then
      return jsonb_build_object('ok',false,'code','lease_conflict','lease',jsonb_build_object('expiresAt',current_lease.expires_at));
    end if;
    insert into public.vantagallu_voice_leases(session_id,user_id,lease_id,device_id,epoch,expires_at)
      values(p_session_id,p_owner_id,gen_random_uuid(),p_device_id,coalesce(current_lease.epoch,0)+1,now()+interval '60 seconds')
      on conflict(session_id) do update set lease_id=excluded.lease_id,device_id=excluded.device_id,epoch=excluded.epoch,expires_at=excluded.expires_at
      returning * into current_lease;
  else return jsonb_build_object('ok',false,'code','invalid_action'); end if;
  return jsonb_build_object('ok',true,'lease',jsonb_build_object('id',current_lease.lease_id,'deviceId',current_lease.device_id,'expiresAt',current_lease.expires_at,'epoch',current_lease.epoch));
end; $$;

create or replace function public.vantagallu_reserve_usage(p_owner_id uuid,p_session_id uuid,p_request_id text,p_kind text,p_amount integer,p_daily_chat_limit integer,p_session_chat_limit integer,p_daily_voice_seconds integer,p_session_voice_seconds integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare today date := (now() at time zone 'UTC')::date; usage public.vantagallu_usage_daily%rowtype; previous public.vantagallu_usage_requests%rowtype; session_amount bigint;
begin
  if p_kind not in ('chat','voice') or p_amount<=0 then raise exception 'Invalid usage reservation'; end if;
  perform 1 from public.vantagallu_sessions where id=p_session_id and user_id=p_owner_id;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  insert into public.vantagallu_usage_daily(user_id,day) values(p_owner_id,today) on conflict(user_id,day) do nothing;
  select * into usage from public.vantagallu_usage_daily where user_id=p_owner_id and day=today for update;
  select * into previous from public.vantagallu_usage_requests where user_id=p_owner_id and request_id=p_request_id;
  if found then
    if previous.session_id<>p_session_id or previous.kind<>p_kind then return jsonb_build_object('ok',false,'code','command_id_reused'); end if;
    return jsonb_build_object('ok',true,'reserved',false);
  end if;
  select coalesce(sum(amount),0) into session_amount from public.vantagallu_usage_requests where user_id=p_owner_id and session_id=p_session_id and kind=p_kind;
  if (p_kind='chat' and (usage.chat_count+p_amount>p_daily_chat_limit or session_amount+p_amount>p_session_chat_limit))
    or (p_kind='voice' and (usage.voice_seconds+p_amount>p_daily_voice_seconds or session_amount+p_amount>p_session_voice_seconds)) then
      return jsonb_build_object('ok',false,'code','quota_exceeded');
  end if;
  insert into public.vantagallu_usage_requests(user_id,request_id,session_id,kind,amount) values(p_owner_id,p_request_id,p_session_id,p_kind,p_amount);
  update public.vantagallu_usage_daily set chat_count=chat_count+case when p_kind='chat' then p_amount else 0 end,voice_seconds=voice_seconds+case when p_kind='voice' then p_amount else 0 end where user_id=p_owner_id and day=today;
  return jsonb_build_object('ok',true,'reserved',true);
end; $$;

revoke all on function public.vantagallu_sync_children(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.vantagallu_create_session(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.vantagallu_commit_command(uuid,uuid,text,integer,jsonb,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.vantagallu_voice_lease(uuid,uuid,text,text,uuid) from public,anon,authenticated;
revoke all on function public.vantagallu_reserve_usage(uuid,uuid,text,text,integer,integer,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.vantagallu_sync_children(uuid,uuid,jsonb) to service_role;
grant execute on function public.vantagallu_create_session(uuid,jsonb) to service_role;
grant execute on function public.vantagallu_commit_command(uuid,uuid,text,integer,jsonb,jsonb,uuid) to service_role;
grant execute on function public.vantagallu_voice_lease(uuid,uuid,text,text,uuid) to service_role;
grant execute on function public.vantagallu_reserve_usage(uuid,uuid,text,text,integer,integer,integer,integer,integer) to service_role;

commit;
