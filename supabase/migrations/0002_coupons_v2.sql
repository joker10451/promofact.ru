-- 0002_coupons_v2: расширенная схема под Coupon (Perfluence-совместимая), для автозалива через /admin и API
-- Запускать после 0001_init.sql

-- Расширяем таблицу coupons колонками под модель Coupon (обратная совместимость со старой схемой)
alter table public.coupons add column if not exists bonus_name text;
alter table public.coupons add column if not exists terms text;
alter table public.coupons add column if not exists affiliate_link text;
alter table public.coupons add column if not exists ord_marker text;
alter table public.coupons add column if not exists ord_text text;
alter table public.coupons add column if not exists logo text;
alter table public.coupons add column if not exists site text;
alter table public.coupons add column if not exists category_slug text;
alter table public.coupons add column if not exists about text;
alter table public.coupons add column if not exists is_hit boolean not null default false;
alter table public.coupons add column if not exists is_first_order_only boolean not null default false;
alter table public.coupons add column if not exists region text;
alter table public.coupons add column if not exists updated_at timestamptz not null default now();

-- Индексы для фильтрации
create index if not exists coupons_store_slug_idx on public.coupons (store_slug) where is_active = true;
create index if not exists coupons_expires_idx on public.coupons (expires) where is_active = true;
create index if not exists coupons_code_idx on public.coupons (code);

-- Функция обновления updated_at
create or replace function public.handle_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at before update on public.coupons for each row execute function public.handle_updated_at();

-- RLS: разрешаем anon чтение активных (уже есть политика, но на всякий)
drop policy if exists "public read active v2" on public.coupons;
create policy "public read active v2" on public.coupons
  for select to anon, authenticated using (is_active = true);

-- API-ключ для автозалива (альтернатива Supabase Auth): простая таблица ключей
create table if not exists public.api_keys (
  key text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.api_keys enable row level security;
drop policy if exists "admin api_keys" on public.api_keys;
create policy "admin api_keys" on public.api_keys
  for all to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.email()))
  with check (exists (select 1 from public.admins a where a.email = auth.email()));
