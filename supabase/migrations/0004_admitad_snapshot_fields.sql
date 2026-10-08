-- 0004_admitad_snapshot_fields.sql: технические поля для snapshot-based sync автопилота Admitad
-- Позволяет безопасно хранить технический статус сопоставления, маркировки ОРД,
-- идентификаторы прогона синка (sync_run_id) и производить stale deactivation
-- без риска случайного удаления или повреждения активных записей.

alter table public.admitad_coupons
  add column if not exists source_campaign_id text,
  add column if not exists source_coupon_id text,
  add column if not exists last_seen_at timestamptz default now(),
  add column if not exists sync_run_id text,
  add column if not exists sync_status text default 'active',
  add column if not exists mapping_strategy text,
  add column if not exists legal_status text,
  add column if not exists erid_status text;

create index if not exists admitad_coupons_sync_run_idx on public.admitad_coupons (sync_run_id);
create index if not exists admitad_coupons_source_coupon_idx on public.admitad_coupons (source_coupon_id);

-- Таблица метаданных синхронизации Admitad (Health / Observability)
create table if not exists public.admitad_sync_meta (
  id text primary key default 'admitad_main',
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_success_count integer default 0,
  last_status text not null default 'SUCCESS',
  last_error_code text,
  duration_ms integer default 0,
  details jsonb,
  updated_at timestamptz default now()
);
