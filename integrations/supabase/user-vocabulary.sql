create table public.user_vocabulary (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 term text not null check(char_length(btrim(term)) between 1 and 120),
 meaning text not null check(char_length(btrim(meaning)) between 1 and 250),
 example text not null default '' check(char_length(example)<=500),
 example_translation text not null default '' check(char_length(example_translation)<=500),
 realm text not null default 'life' check(realm ~ '^[a-z_]{2,40}$'),
 level text check(level in ('A1','A2','B1','B2','C1','C2')),
 encounter text not null default '' check(char_length(encounter)<=500),
 created_at timestamptz not null default now()
);
create unique index user_vocabulary_owner_term_realm on public.user_vocabulary(user_id, lower(btrim(term)), realm);
alter table public.user_vocabulary enable row level security;
revoke all on public.user_vocabulary from anon, authenticated;
grant select,insert,delete on public.user_vocabulary to authenticated;
grant update(term,meaning,example,example_translation,realm,level,encounter) on public.user_vocabulary to authenticated;
create policy own_words_read on public.user_vocabulary for select to authenticated using ((select auth.uid())=user_id);
create policy own_words_add on public.user_vocabulary for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_words_edit on public.user_vocabulary for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_words_delete on public.user_vocabulary for delete to authenticated using ((select auth.uid())=user_id);

