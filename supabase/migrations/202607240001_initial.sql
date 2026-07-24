create extension if not exists pgcrypto;
create type public.app_role as enum ('customer','support','admin');
create type public.application_status as enum ('pending_review','approved','rejected','activated');
create type public.ticket_status as enum ('open','in_progress','waiting_customer','resolved','closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, full_name text not null, mobile text,
  role public.app_role not null default 'customer', referral_code text unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.service_zones (
  id uuid primary key default gen_random_uuid(), name text not null,
  region text not null, postcodes text[] not null default '{}', active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.plans (
  id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
  segment text not null check (segment in ('residential','business')),
  download_mbps integer not null, upload_mbps integer not null,
  monthly_price_nzd numeric(10,2) not null, featured boolean not null default false, active boolean not null default true
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), reference text unique not null,
  user_id uuid references public.profiles(id), status public.application_status not null default 'pending_review',
  first_name text not null, last_name text not null, email text not null, mobile text not null,
  service_address text not null, address_place_id text, service_zone_id uuid references public.service_zones(id),
  qualification text not null default 'manual_review', plan_code text not null,
  router_addon boolean not null default false, reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz, created_at timestamptz not null default now()
);
create table public.customer_services (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  plan_id uuid not null references public.plans(id), application_id uuid references public.applications(id),
  status text not null default 'provisioning', service_address text not null,
  router_model text, router_status text, static_ip inet, vlan integer,
  next_bill_date date, activated_at timestamptz, created_at timestamptz not null default now()
);
create table public.invoices (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  invoice_number text unique not null, status text not null default 'unpaid',
  issued_on date not null, due_on date not null, subtotal numeric(10,2) not null,
  gst numeric(10,2) not null, credits numeric(10,2) not null default 0,
  total numeric(10,2) generated always as (subtotal + gst - credits) stored, pdf_path text
);
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null, quantity numeric(10,2) not null default 1, unit_price numeric(10,2) not null
);
create table public.referrals (
  id uuid primary key default gen_random_uuid(), referrer_id uuid not null references public.profiles(id),
  referred_user_id uuid references public.profiles(id), code text not null, status text not null default 'invited',
  activated_at timestamptz, created_at timestamptz not null default now()
);
create table public.credits (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  referral_id uuid references public.referrals(id), amount numeric(10,2) not null default 7,
  billing_month date not null, status text not null default 'pending', created_at timestamptz not null default now()
);
create table public.tickets (
  id uuid primary key default gen_random_uuid(), reference text unique not null,
  user_id uuid not null references public.profiles(id), assigned_to uuid references public.profiles(id),
  subject text not null, priority text not null default 'normal', status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id), body text not null, attachment_path text,
  created_at timestamptz not null default now()
);
create table public.audit_events (
  id bigint generated always as identity primary key, actor_id uuid references public.profiles(id),
  action text not null, entity_type text not null, entity_id text not null, detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.customer_services enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.referrals enable row level security;
alter table public.credits enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

create function public.is_staff() returns boolean language sql stable security definer
set search_path = public as $$ select exists(select 1 from profiles where id=auth.uid() and role in ('support','admin')) $$;
create policy "profile self or staff" on public.profiles for select using (id=auth.uid() or public.is_staff());
create policy "applications self or staff" on public.applications for select using (user_id=auth.uid() or public.is_staff());
create policy "services self or staff" on public.customer_services for select using (user_id=auth.uid() or public.is_staff());
create policy "invoices self or staff" on public.invoices for select using (user_id=auth.uid() or public.is_staff());
create policy "invoice items through invoice" on public.invoice_items for select using (exists(select 1 from public.invoices i where i.id=invoice_id and (i.user_id=auth.uid() or public.is_staff())));
create policy "referrals self or staff" on public.referrals for select using (referrer_id=auth.uid() or referred_user_id=auth.uid() or public.is_staff());
create policy "credits self or staff" on public.credits for select using (user_id=auth.uid() or public.is_staff());
create policy "tickets self or staff" on public.tickets for select using (user_id=auth.uid() or public.is_staff());
create policy "ticket messages through ticket" on public.ticket_messages for select using (exists(select 1 from public.tickets t where t.id=ticket_id and (t.user_id=auth.uid() or public.is_staff())));

insert into public.plans(code,name,segment,download_mbps,upload_mbps,monthly_price_nzd,featured) values
('fibre-500','Fibre 500','residential',500,100,85,false),
('fibre-max','Fibre Max 1G','residential',950,500,99,true),
('business-500','Bayanihan Business','business',500,500,129,false),
('business-max','Business Max','business',950,500,169,true);
