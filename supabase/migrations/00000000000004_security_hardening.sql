-- =============================================================================
-- Security hardening
-- 1. Users may only update their own display fields. Any other column (e.g. the
--    hybrid wallet columns) is written by the server with the service role.
-- 2. handle_new_user runs with a fixed search_path (security definer best practice).
-- 3. full_name rule aligned with the app (min 2 chars, as in updateProfileSchema).
-- Hybrid-only hardening (wallets, user_files) lives in 00000000000005.
-- =============================================================================

-- 1. Column-level privileges on profiles --------------------------------------
revoke insert, update on table public.profiles from anon, authenticated;
grant insert (id, email, full_name, avatar_url) on table public.profiles to authenticated;
grant update (full_name, avatar_url, updated_at) on table public.profiles to authenticated;

-- Updates must keep the row owned by the same user
drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile." on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Fixed search_path for the signup trigger ---------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$;

-- 3. Name length consistent with the app ---------------------------------------
alter table public.profiles drop constraint if exists full_name_length;
alter table public.profiles
  add constraint full_name_length check (full_name is null or char_length(full_name) >= 2);
