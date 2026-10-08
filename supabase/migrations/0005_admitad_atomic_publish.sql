-- 0005_admitad_atomic_publish.sql
-- Истинный атомарный снимок Admitad (ADMITAD-2.3 True Atomic Snapshot).
--
-- Архитектура staging + transactional promotion:
-- 1. Синк пишет данные исключительно в изолированную таблицу admitad_coupons_staging.
-- 2. Внешний runtime (anon) не имеет доступа к staging (RLS включен, политик чтения нет).
-- 3. Публикация нового снимка в боевую admitad_coupons выполняется в единой ACID-транзакции
--    через RPC-функцию publish_admitad_snapshot().
-- 4. При любом сбое до или во время RPC происходит полный откат, читатели продолжают
--    видеть предыдущий валидный снимок без смешивания поколений (Zero mixed state).

-- 1. Добавление полей генерации в admitad_sync_meta
alter table if exists public.admitad_sync_meta
  add column if not exists last_success_sync_run_id text,
  add column if not exists last_success_total_count integer default 0;

-- 2. Создание изолированной staging-таблицы
create table if not exists public.admitad_coupons_staging (
  id text not null,
  sync_run_id text not null,
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
  source_campaign_id text,
  source_coupon_id text,
  last_seen_at timestamptz default now(),
  sync_status text default 'active',
  mapping_strategy text,
  legal_status text,
  erid_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admitad_coupons_staging_pkey primary key (sync_run_id, id)
);

-- Индексы staging для быстрой выборки и очистки поколений
create index if not exists admitad_coupons_staging_sync_run_idx on public.admitad_coupons_staging (sync_run_id);
create index if not exists admitad_coupons_staging_source_coupon_idx on public.admitad_coupons_staging (source_coupon_id);

-- RLS: закрываем staging от anon и authenticated.
-- Только service_role (sync worker) имеет право записи и чтения.
alter table public.admitad_coupons_staging enable row level security;
revoke all on public.admitad_coupons_staging from anon, authenticated;

-- 3. Транзакционный RPC метод публикации снимка (Atomic Promotion RPC)
create or replace function public.publish_admitad_snapshot(
  p_sync_run_id text,
  p_expected_count integer default null,
  p_min_threshold_ratio numeric default 0.35
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staging_count integer;
  v_prev_count integer := 0;
  v_result jsonb;
begin
  -- Шаг 1: Проверка наличия строк в staging для данного sync_run_id
  select count(*) into v_staging_count
  from public.admitad_coupons_staging
  where sync_run_id = p_sync_run_id;

  if v_staging_count = 0 then
    raise exception 'STAGING_EMPTY: No rows found in staging for sync_run_id %', p_sync_run_id;
  end if;

  if p_expected_count is not null and v_staging_count < p_expected_count then
    raise exception 'STAGING_COUNT_MISMATCH: Expected at least % rows, found % for %',
      p_expected_count, v_staging_count, p_sync_run_id;
  end if;

  -- Шаг 2: Проверка катастрофического падения объема (Catastrophic Drop Gate)
  select coalesce(last_success_count, 0) into v_prev_count
  from public.admitad_sync_meta
  where id = 'admitad_main';

  if v_prev_count > 0 and v_staging_count < (v_prev_count * p_min_threshold_ratio) then
    raise exception 'CATASTROPHIC_DROP: Staging count (%) dropped below threshold ratio (%) of previous (%)',
      v_staging_count, p_min_threshold_ratio, v_prev_count;
  end if;

  -- Шаг 3: Атомарное замещение боевой таблицы admitad_coupons
  -- Внутри транзакции читатели увидят данные только в момент завершения (COMMIT).
  delete from public.admitad_coupons;

  insert into public.admitad_coupons (
    id, code, store, store_slug, discount, category, description, expires,
    affiliate_url, is_active, uses_count, bonus_name, terms, affiliate_link,
    ord_marker, ord_text, logo, site, category_slug, about, region,
    is_hit, is_first_order_only, source_campaign_id, source_coupon_id,
    last_seen_at, sync_run_id, sync_status, mapping_strategy,
    legal_status, erid_status, created_at, updated_at
  )
  select
    id, code, store, store_slug, discount, category, description, expires,
    affiliate_url, is_active, uses_count, bonus_name, terms, affiliate_link,
    ord_marker, ord_text, logo, site, category_slug, about, region,
    is_hit, is_first_order_only, source_campaign_id, source_coupon_id,
    last_seen_at, sync_run_id, sync_status, mapping_strategy,
    legal_status, erid_status, created_at, now()
  from public.admitad_coupons_staging
  where sync_run_id = p_sync_run_id;

  -- Шаг 4: Обновление метаданных успеха
  insert into public.admitad_sync_meta (
    id, last_attempt_at, last_success_at, last_success_count,
    last_success_sync_run_id, last_status, last_error_code, updated_at
  )
  values (
    'admitad_main', now(), now(), v_staging_count,
    p_sync_run_id, 'SUCCESS', null, now()
  )
  on conflict (id) do update set
    last_attempt_at = now(),
    last_success_at = now(),
    last_success_count = v_staging_count,
    last_success_sync_run_id = p_sync_run_id,
    last_status = 'SUCCESS',
    last_error_code = null,
    updated_at = now();

  -- Шаг 5: Очистка устаревших staging поколений (сохраняем не более 3 последних запусков)
  delete from public.admitad_coupons_staging
  where sync_run_id not in (
    select distinct s.sync_run_id
    from public.admitad_coupons_staging s
    order by s.sync_run_id desc
    limit 3
  );

  v_result := jsonb_build_object(
    'success', true,
    'published_count', v_staging_count,
    'sync_run_id', p_sync_run_id
  );

  return v_result;
end;
$$;
