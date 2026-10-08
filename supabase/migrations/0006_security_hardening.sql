-- 0006_security_hardening.sql
-- Фиксация параметров безопасности и search_path функций БД (source-of-truth sync с production Supabase).
--
-- Устранение уязвимостей mutable search_path в триггерных функциях:
-- https://supabase.com/docs/guides/database/database-advisories?lint=0001_function_search_path_mutable

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
