-- OAuth providers may omit email. Preserve identity by auth.users.id, never a fake email.
alter table public.profiles alter column email drop not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, mobile, referral_code)
  values (
    new.id, nullif(lower(trim(new.email)), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
             nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
             nullif(split_part(new.email, '@', 1), ''), 'Customer'),
    nullif(trim(new.raw_user_meta_data ->> 'mobile'), ''),
    upper(replace(new.id::text, '-', ''))
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    mobile = coalesce(excluded.mobile, public.profiles.mobile),
    updated_at = now();

  -- Do not grant access to applications until Auth has verified email ownership.
  if new.email_confirmed_at is not null and nullif(trim(new.email), '') is not null then
    update public.applications set user_id = new.id
      where user_id is null and lower(trim(email)) = lower(trim(new.email));
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, email_confirmed_at, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill missing profiles and run verified linking for existing identities.
-- Existing referral codes are preserved by the conflict handler.
update auth.users set raw_user_meta_data = raw_user_meta_data;
