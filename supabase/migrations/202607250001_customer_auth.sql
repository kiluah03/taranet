create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_code text;
begin
  generated_code := upper(substr(replace(new.id::text, '-', ''), 1, 8));

  insert into public.profiles (id, email, full_name, mobile, referral_code)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'mobile'), ''),
    generated_code
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    mobile = coalesce(excluded.mobile, public.profiles.mobile),
    updated_at = now();

  update public.applications
  set user_id = new.id
  where user_id is null and lower(email) = lower(coalesce(new.email, ''));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_user();

create policy "profile update self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');

create policy "tickets create self"
  on public.tickets for insert
  with check (user_id = auth.uid());

create policy "ticket messages create self"
  on public.ticket_messages for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );

create policy "referrals create self"
  on public.referrals for insert
  with check (referrer_id = auth.uid());
