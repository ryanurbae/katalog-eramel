-- Produk dapat dibaca publik, tetapi perubahan data hanya boleh dilakukan
-- oleh pengguna Supabase yang sudah terautentikasi.
--
-- Jalankan di Supabase SQL Editor (seperti tenants.sql).

alter table public.products enable row level security;

drop policy if exists "Allow full access products" on public.products;
drop policy if exists "Public can read products" on public.products;
drop policy if exists "Authenticated can manage products" on public.products;

create policy "Public can read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated can manage products"
  on public.products
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.products to service_role;
grant select, insert, update, delete on public.products to authenticated;
revoke insert, update, delete on public.products from anon;
grant select on public.products to anon;
