create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create function private.create_vocarealm_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if TG_TABLE_SCHEMA <> 'auth' or TG_TABLE_NAME <> 'users' or TG_OP <> 'INSERT' then
   raise exception 'Invalid profile provisioning context';
 end if;
 if auth.uid() is not null and auth.uid() <> new.id then
   raise exception 'Invalid profile owner';
 end if;
 insert into public.profiles(id, username)
 values(new.id, lower(trim(new.raw_user_meta_data ->> 'username')));
 return new;
end;
$$;
revoke all on function private.create_vocarealm_profile() from public, anon, authenticated, service_role;
create trigger vocarealm_profile_after_signup after insert on auth.users
for each row execute function private.create_vocarealm_profile();
comment on function private.create_vocarealm_profile() is 'Internal signup trigger only. Definer privilege is required to provision an own-user profile before email confirmation. Username metadata is display data and is never used for authorization.';

