-- Tabel tenants (brand/tenant untuk multi-tenant katalog)
-- Jalankan di Supabase SQL Editor.
--
-- Hubungan ke produk: kolom `brand` harus SAMA PERSIS dengan nilai
-- `products.brand` supaya filter katalog jalan. `slug` dipakai di URL
-- (?tenant=janji-jiwa) dan sebagai key cart per-tenant.

create table if not exists public.tenants (
  slug        text        primary key,
  name        text        not null,
  brand       text        not null,
  logo_url    text,
  accent      text        not null default '#eea0fe',
  is_visible  boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists tenants_is_visible_idx on public.tenants (is_visible);
create index if not exists tenants_sort_order_idx on public.tenants (sort_order);

alter table public.tenants enable row level security;

drop policy if exists "Public can read tenants" on public.tenants;
drop policy if exists "Allow full access tenants" on public.tenants;
drop policy if exists "Authenticated can manage tenants" on public.tenants;

create policy "Public can read tenants"
  on public.tenants
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated can manage tenants"
  on public.tenants
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.tenants to service_role;
grant select, insert, update, delete on public.tenants to authenticated;
revoke insert, update, delete on public.tenants from anon;
grant select on public.tenants to anon;

-- ============================================================
-- Seed contoh. Sesuaikan `brand` dengan nilai `products.brand`
-- yang sudah ada di database kamu. `is_visible = false` = disembunyikan
-- dari landing page (kayak Kopi Kenangan & Fore yang kamu sebut).
-- ============================================================
insert into public.tenants (slug, name, brand, accent, is_visible, sort_order) values
  ('janji-jiwa',   'Janji Jiwa',    'Janji Jiwa',    '#eea0fe', true,  1),
  ('mcd',          'MCD',           'MCD',           '#eea0fe', true,  2),
  ('tomoro',       'Tomoro',        'Tomoro',        '#eea0fe', true,  3),
  ('kopi-kenangan','Kopi Kenangan', 'Kopi Kenangan', '#eea0fe', false, 4),
  ('fore',         'Fore',          'Fore',          '#eea0fe', false, 5)
on conflict (slug) do nothing;

-- Set logo tiap brand (letakkan file PNG di assets/brands/)
update public.tenants set logo_url = './assets/brands/janji-jiwa.png'   where slug = 'janji-jiwa';
update public.tenants set logo_url = './assets/brands/mcd.png'          where slug = 'mcd';
update public.tenants set logo_url = './assets/brands/tomoro.png'       where slug = 'tomoro';
update public.tenants set logo_url = './assets/brands/kopi-kenangan.png' where slug = 'kopi-kenangan';
update public.tenants set logo_url = './assets/brands/fore.png'         where slug = 'fore';
