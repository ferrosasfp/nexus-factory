-- =============================================================================
-- Hybrid hardening (removed by create-nexus in web2 mode)
-- 1. Wallet addresses are stored lowercase so the unique indexes are case-insensitive.
--    They are written only by the server after verifying a wallet signature.
-- 2. user_files: tracks which user pinned which CID, so only the owner can delete it.
-- =============================================================================

-- 1. Normalize existing addresses ------------------------------------------------
update public.profiles
  set wallet_address = lower(wallet_address),
      smart_account_address = lower(smart_account_address)
  where wallet_address is not null or smart_account_address is not null;

-- 2. CID ownership --------------------------------------------------------------
create table if not exists public.user_files (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  cid text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  primary key (user_id, cid)
);

create index if not exists idx_user_files_cid on public.user_files (cid);

alter table public.user_files enable row level security;

create policy "Users can view their own files" on public.user_files
  for select to authenticated using (auth.uid() = user_id);

create policy "Users can register their own files" on public.user_files
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can delete their own files" on public.user_files
  for delete to authenticated using (auth.uid() = user_id);

-- Same content = same CID: unpin only when no other user still references it.
-- security definer so it can count rows hidden by RLS; returns only a boolean.
create or replace function public.cid_has_other_owners(p_cid text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_files
    where cid = p_cid and user_id <> auth.uid()
  );
$$;

revoke all on function public.cid_has_other_owners(text) from public, anon;
grant execute on function public.cid_has_other_owners(text) to authenticated;
