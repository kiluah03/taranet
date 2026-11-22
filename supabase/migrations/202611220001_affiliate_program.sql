-- Signup Affiliate Program schema, indexes, and least-privilege RLS policies.

create type public.affiliate_status as enum ('pending', 'active', 'suspended');
create type public.affiliate_commission_type as enum ('fixed', 'percentage');
create type public.affiliate_referral_status as enum ('pending', 'qualified', 'paid', 'voided');
create type public.affiliate_attribution_source as enum ('link', 'manual');

create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  status public.affiliate_status not null default 'pending',
  commission_type public.affiliate_commission_type not null default 'fixed',
  commission_value numeric(10,2) not null default 5.00 check (commission_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index affiliates_code_lower_unique
  on public.affiliates (lower(code));
create index affiliates_user_id_idx
  on public.affiliates (user_id);
create index affiliates_email_lower_idx
  on public.affiliates (lower(email));
create index affiliates_status_idx
  on public.affiliates (status);

create table public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  application_id uuid references public.applications(id) on delete set null,
  referred_user_id uuid references public.profiles(id) on delete set null,
  referred_email text not null,
  code_used text not null,
  status public.affiliate_referral_status not null default 'pending',
  commission_amount numeric(10,2) not null default 0 check (commission_amount >= 0),
  attribution_source public.affiliate_attribution_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index affiliate_referrals_affiliate_id_idx
  on public.affiliate_referrals (affiliate_id);
create unique index affiliate_referrals_application_id_unique
  on public.affiliate_referrals (application_id)
  where application_id is not null;
create unique index affiliate_referrals_referred_user_id_unique
  on public.affiliate_referrals (referred_user_id)
  where referred_user_id is not null;
create unique index affiliate_referrals_affiliate_email_unique
  on public.affiliate_referrals (affiliate_id, lower(referred_email));

alter table public.affiliates enable row level security;
alter table public.affiliate_referrals enable row level security;

-- Affiliates: authenticated partners read only their own row; staff manage all.
-- Public/anon clients have zero direct access; validation happens server-side.
create policy "affiliates self or staff select"
  on public.affiliates for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

create policy "affiliates staff insert"
  on public.affiliates for insert
  to authenticated
  with check (public.is_staff());

create policy "affiliates staff update"
  on public.affiliates for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "affiliates staff delete"
  on public.affiliates for delete
  to authenticated
  using (public.is_staff());

-- Affiliate referrals: authenticated partners read only referrals attributed to them; staff manage all.
create policy "affiliate referrals self or staff select"
  on public.affiliate_referrals for select
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.affiliates a
      where a.id = affiliate_id and a.user_id = (select auth.uid())
    )
  );

create policy "affiliate referrals staff insert"
  on public.affiliate_referrals for insert
  to authenticated
  with check (public.is_staff());

create policy "affiliate referrals staff update"
  on public.affiliate_referrals for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "affiliate referrals staff delete"
  on public.affiliate_referrals for delete
  to authenticated
  using (public.is_staff());
