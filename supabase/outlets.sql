-- Tabel outlets (cabang McDonald's, Kopi Kenangan, Tomoro, dll)
-- Jalankan di Supabase SQL Editor.

create table if not exists public.outlets (
  id          bigint generated always as identity primary key,
  brand       text        not null,
  name        text        not null,
  address     text,
  lat         double precision,
  lng         double precision,
  phone       text,
  hours       text,
  facilities  jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists outlets_brand_idx on public.outlets (brand);
create index if not exists outlets_name_idx on public.outlets (name);

-- Unique agar upsert on_conflict(brand, name) bisa jalan (hindari duplikat).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'outlets_brand_name_unique'
  ) then
    alter table public.outlets
      add constraint outlets_brand_name_unique unique (brand, name);
  end if;
end $$;

-- Row Level Security: izinkan siapa saja (anon key di frontend) membaca.
alter table public.outlets enable row level security;

drop policy if exists "Public can read outlets" on public.outlets;
create policy "Public can read outlets"
  on public.outlets
  for select
  using (true);

-- Hak akses: service_role (seed/script) dan anon (frontend read).
grant select, insert, update, delete on public.outlets to service_role;
grant usage on sequence outlets_id_seq to service_role;
grant select on public.outlets to anon;
