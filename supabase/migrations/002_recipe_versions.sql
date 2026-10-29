begin;
create table if not exists public.vantagallu_recipe_versions (
  id text not null, version integer not null check(version>0), data jsonb not null,
  created_at timestamptz not null default now(), primary key(id,version)
);
alter table public.vantagallu_recipe_versions enable row level security;
revoke all on public.vantagallu_recipe_versions from anon,authenticated;
grant select on public.vantagallu_recipe_versions to authenticated;
grant all on public.vantagallu_recipe_versions to service_role;
drop policy if exists vantagallu_recipe_versions_read on public.vantagallu_recipe_versions;
create policy vantagallu_recipe_versions_read on public.vantagallu_recipe_versions for select to authenticated using(true);
insert into public.vantagallu_recipe_versions(id,version,data) select id,version,data from public.vantagallu_recipes on conflict(id,version) do nothing;
create or replace function public.vantagallu_archive_recipe_version()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare previous jsonb;
begin
  select data into previous from public.vantagallu_recipe_versions where id=new.id and version=new.version;
  if found and previous<>new.data then raise exception 'Recipe versions are immutable; increment the recipe version before changing its source method'; end if;
  insert into public.vantagallu_recipe_versions(id,version,data) values(new.id,new.version,new.data) on conflict(id,version) do nothing;
  return new;
end; $$;
drop trigger if exists vantagallu_archive_recipe_version on public.vantagallu_recipes;
create trigger vantagallu_archive_recipe_version before insert or update on public.vantagallu_recipes for each row execute function public.vantagallu_archive_recipe_version();
revoke all on function public.vantagallu_archive_recipe_version() from public,anon,authenticated;
grant execute on function public.vantagallu_archive_recipe_version() to service_role;
commit;
