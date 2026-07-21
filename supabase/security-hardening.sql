-- Jalankan sekali melalui Supabase SQL Editor untuk mengamankan database live.
-- Pengunjung tetap dapat membaca data katalog. Semua perubahan data admin
-- memerlukan sesi Supabase Auth dengan role authenticated.

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'products',
        'tenants',
        'vouchers',
        'brand_banners',
        'news_ticker',
        'settings'
      ])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end
$$;

alter table public.products enable row level security;
alter table public.tenants enable row level security;
alter table public.vouchers enable row level security;
alter table public.brand_banners enable row level security;
alter table public.news_ticker enable row level security;
alter table public.settings enable row level security;

create policy "Public can read products"
  on public.products for select to anon, authenticated using (true);
create policy "Authenticated can manage products"
  on public.products for all to authenticated using (true) with check (true);

create policy "Public can read tenants"
  on public.tenants for select to anon, authenticated using (true);
create policy "Authenticated can manage tenants"
  on public.tenants for all to authenticated using (true) with check (true);

create policy "Authenticated can manage vouchers"
  on public.vouchers for all to authenticated using (true) with check (true);

-- Pengunjung memvalidasi satu kode melalui RPC tanpa dapat melihat daftar voucher.
create or replace function public.validate_voucher(voucher_code text)
returns table (code text, discount_percent integer)
language sql
stable
security definer
set search_path = public
as $$
  select v.code, v.discount_percent
  from public.vouchers v
  where upper(v.code) = upper(trim(voucher_code))
    and v.is_active = true
  limit 1;
$$;

revoke all on function public.validate_voucher(text) from public;
grant execute on function public.validate_voucher(text) to anon, authenticated;

create policy "Public can read brand banners"
  on public.brand_banners for select to anon, authenticated using (true);
create policy "Authenticated can manage brand banners"
  on public.brand_banners for all to authenticated using (true) with check (true);

create policy "Public can read news ticker"
  on public.news_ticker for select to anon, authenticated using (true);
create policy "Authenticated can manage news ticker"
  on public.news_ticker for all to authenticated using (true) with check (true);

create policy "Public can read settings"
  on public.settings for select to anon, authenticated using (true);
create policy "Authenticated can manage settings"
  on public.settings for all to authenticated using (true) with check (true);

revoke insert, update, delete on
  public.products,
  public.tenants,
  public.vouchers,
  public.brand_banners,
  public.news_ticker,
  public.settings
from anon;

revoke all on public.vouchers from anon;

grant select on
  public.products,
  public.tenants,
  public.brand_banners,
  public.news_ticker,
  public.settings
to anon;

grant select, insert, update, delete on
  public.products,
  public.tenants,
  public.vouchers,
  public.brand_banners,
  public.news_ticker,
  public.settings
to authenticated;
