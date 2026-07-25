alter table public.service_zones enable row level security;

create policy "public view active service zones"
  on public.service_zones for select
  using (active or public.is_staff());

create policy "staff create service zones"
  on public.service_zones for insert
  with check (public.is_staff());

create policy "staff update service zones"
  on public.service_zones for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "staff delete service zones"
  on public.service_zones for delete
  using (public.is_staff());

create policy "staff create invoice items"
  on public.invoice_items for insert
  with check (
    public.is_staff()
    and exists (select 1 from public.invoices i where i.id = invoice_id)
  );
