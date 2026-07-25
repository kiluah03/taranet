alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

insert into public.profiles (id, email, full_name, mobile, referral_code)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(u.email, ''), '@', 1)),
  nullif(trim(u.raw_user_meta_data ->> 'mobile'), ''),
  upper(substr(replace(u.id::text, '-', ''), 1, 8))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

update public.profiles
set role = 'admin', username = 'admin_kiluah03', updated_at = now()
where lower(email) = 'kiluah03@gmail.com';

create policy "staff update profiles"
  on public.profiles for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "staff update applications"
  on public.applications for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "staff create services"
  on public.customer_services for insert
  with check (public.is_staff());

create policy "staff update services"
  on public.customer_services for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "staff create invoices"
  on public.invoices for insert
  with check (public.is_staff());

create policy "staff update invoices"
  on public.invoices for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "staff update tickets"
  on public.tickets for update
  using (public.is_staff())
  with check (public.is_staff());

alter table public.audit_events enable row level security;
create policy "staff view audit events"
  on public.audit_events for select
  using (public.is_staff());
create policy "staff create audit events"
  on public.audit_events for insert
  with check (public.is_staff() and actor_id = auth.uid());
