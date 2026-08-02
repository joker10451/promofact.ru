-- ПРОМО·ДРОМ: таблица купонов + админы
-- Выполнить в SQL Editor Supabase.

create table if not exists public.coupons (
  id text primary key,
  code text not null,
  store text not null,
  store_slug text not null,
  discount text not null,
  category text not null,
  description text,
  expires date,
  affiliate_url text,
  badge text,
  is_active boolean not null default true,
  uses_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  email text primary key
);

alter table public.coupons enable row level security;
alter table public.admins enable row level security;

drop policy if exists "public read active" on public.coupons;
create policy "public read active" on public.coupons
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "admin select" on public.coupons;
create policy "admin select" on public.coupons
  for select to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.email()));

drop policy if exists "admin write" on public.coupons;
create policy "admin write" on public.coupons
  for all to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.email()))
  with check (exists (select 1 from public.admins a where a.email = auth.email()));

drop policy if exists "admin read" on public.admins;
create policy "admin read" on public.admins
  for select to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.email()));

-- Счётчик копирований вызывается анонимом с публичного сайта
create or replace function public.increment_uses(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
  set uses_count = uses_count + 1
  where id = p_id and is_active;
end;
$$;

revoke all on function public.increment_uses(text) from public;
grant execute on function public.increment_uses(text) to anon, authenticated;

-- Админ: замени me@example.com на свой email и выполни
-- insert into public.admins (email) values ('me@example.com');
