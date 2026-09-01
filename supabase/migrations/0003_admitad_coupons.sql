-- 0003_admitad_coupons: кэш-таблица под отфильтрованный Admitad-фид.
-- Зачем: фид ~65МБ (52k купонов) и Next.js не кэширует >2МБ, поэтому runtime
-- докачивает его всякий раз. Здесь хранится только отфильтрованный (РУ-релевантный)
-- список, который импорт пишет по расписанию, а runtime читает вместо 65МБ.
-- Запускать после 0001_init.sql и 0002_coupons_v2.sql.

create table if not exists public.admitad_coupons (
  id text primary key,
  code text,
  store text not null,
  store_slug text not null,
  discount text,
  category text,
  description text,
  expires date,
  affiliate_url text,
  is_active boolean not null default true,
  uses_count integer not null default 0,
  bonus_name text,
  terms text,
  affiliate_link text,
  ord_marker text,
  ord_text text,
  logo text,
  site text,
  category_slug text,
  about text,
  region text,
  is_hit boolean not null default false,
  is_first_order_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admitad_coupons enable row level security;

-- RLS: аноним читает только активные
drop policy if exists "admitad read active" on public.admitad_coupons;
create policy "admitad read active" on public.admitad_coupons
  for select to anon, authenticated using (is_active = true);

-- Индексы для фильтрации и дедупликации
create index if not exists admitad_coupons_store_slug_idx on public.admitad_coupons (store_slug) where is_active = true;
create index if not exists admitad_coupons_code_idx on public.admitad_coupons (code);
create index if not exists admitad_coupons_expires_idx on public.admitad_coupons (expires) where is_active = true;

-- updated_at
create or replace function public.handle_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists admitad_coupons_updated_at on public.admitad_coupons;
create trigger admitad_coupons_updated_at before update on public.admitad_coupons
  for each row execute function public.handle_updated_at();
