-- Profiles are required before predictions (predictions.user_id -> profiles.id).
-- Google ID-token sign-in may not run on_auth_user_created for existing auth users.

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- Backfill profiles for any auth user missing one
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(u.email, '@', 1),
    'Player'
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- Safer trigger: upsert profile on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1),
      'Player'
    )
  )
  on conflict (id) do update
  set display_name = excluded.display_name;
  return new;
end;
$$;
