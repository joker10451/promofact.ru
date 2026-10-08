-- 0007_admitad_safeupdate_fix.sql: Исправление требования pg-safeupdate (DELETE requires a WHERE clause).
-- Замена безусловного DELETE FROM public.admitad_coupons на DELETE WHERE id is not null.
-- Защитные привилегии EXECUTE строго ограничены ролью service_role.

create or replace function public.publish_admitad_snapshot(
  p_sync_run_id text,
  p_expected_total_count integer default null,
  p_min_threshold_ratio numeric default 0.35
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staging_total_count integer := 0;
  v_staging_publishable_count integer := 0;
  v_prev_publishable_count integer := 0;
  v_result jsonb;
begin
  -- Шаг 1: Подсчет total_count и publishable_count в staging для данного sync_run_id
  select
    count(*),
    count(*) filter (where is_active = true)
  into
    v_staging_total_count,
    v_staging_publishable_count
  from public.admitad_coupons_staging
  where sync_run_id = p_sync_run_id;

  if v_staging_total_count = 0 then
    raise exception 'STAGING_EMPTY: No rows found in staging for sync_run_id %', p_sync_run_id;
  end if;

  -- Точная проверка общего числа строк поколения
  if p_expected_total_count is not null and v_staging_total_count != p_expected_total_count then
    raise exception 'STAGING_COUNT_MISMATCH: Expected exactly % rows, found % for %',
      p_expected_total_count, v_staging_total_count, p_sync_run_id;
  end if;

  -- Шаг 2: Проверка катастрофического падения объема (Catastrophic Drop Gate)
  -- Сравнивает publishable (действующие активные купоны), а не total
  select coalesce(last_success_count, 0) into v_prev_publishable_count
  from public.admitad_sync_meta
  where id = 'admitad_main';

  if v_prev_publishable_count > 0 and v_staging_publishable_count < (v_prev_publishable_count * p_min_threshold_ratio) then
    raise exception 'CATASTROPHIC_DROP: Staging publishable count (%) dropped below threshold ratio (%) of previous (%)',
      v_staging_publishable_count, p_min_threshold_ratio, v_prev_publishable_count;
  end if;

  -- Шаг 3: Атомарное замещение боевой таблицы admitad_coupons
  -- Требование pg-safeupdate: явный WHERE предикат по первичному ключу id.
  delete from public.admitad_coupons
  where id is not null;

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

  -- Шаг 4: Обновление метаданных успеха (Authoritative Last Success)
  insert into public.admitad_sync_meta (
    id, last_attempt_at, last_success_at, last_success_count,
    last_success_total_count, last_success_sync_run_id, last_status,
    last_error_code, updated_at
  )
  values (
    'admitad_main', now(), now(), v_staging_publishable_count,
    v_staging_total_count, p_sync_run_id, 'SUCCESS',
    null, now()
  )
  on conflict (id) do update set
    last_attempt_at = now(),
    last_success_at = now(),
    last_success_count = v_staging_publishable_count,
    last_success_total_count = v_staging_total_count,
    last_success_sync_run_id = p_sync_run_id,
    last_status = 'SUCCESS',
    last_error_code = null,
    updated_at = now();

  -- Шаг 5: Очистка устаревших staging поколений (по реальной дате создания)
  delete from public.admitad_coupons_staging
  where sync_run_id not in (
    select s.sync_run_id
    from public.admitad_coupons_staging s
    group by s.sync_run_id
    order by max(s.created_at) desc
    limit 3
  );

  v_result := jsonb_build_object(
    'success', true,
    'published_count', v_staging_publishable_count,
    'total_count', v_staging_total_count,
    'sync_run_id', p_sync_run_id
  );

  return v_result;
end;
$$;

-- Блокировка вызова RPC публичными ролями
revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from PUBLIC;
revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from anon;
revoke all on function public.publish_admitad_snapshot(text, integer, numeric) from authenticated;
grant execute on function public.publish_admitad_snapshot(text, integer, numeric) to service_role;
