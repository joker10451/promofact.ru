-- Telegram bot user attribution and per-store repeat-code alert subscriptions.
-- Locked down to service_role only (accessed via server-side Telegram webhook and scripts).
create table if not exists public.tg_bot_users (
  telegram_user_id bigint primary key,
  username text,
  first_name text,
  source text,
  is_channel_member boolean not null default false,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_tg_bot_users_source on public.tg_bot_users (source);

alter table public.tg_bot_users enable row level security;
revoke all on public.tg_bot_users from public, anon, authenticated;
grant select, insert, update, delete on public.tg_bot_users to service_role;

create table if not exists public.tg_store_subscriptions (
  id bigserial primary key,
  telegram_user_id bigint not null references public.tg_bot_users(telegram_user_id) on delete cascade,
  store_slug text not null,
  notify_mode text not null default 'repeat' check (notify_mode in ('repeat', 'all')),
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (telegram_user_id, store_slug)
);

create index if not exists idx_tg_store_subscriptions_slug on public.tg_store_subscriptions (store_slug);

alter table public.tg_store_subscriptions enable row level security;
revoke all on public.tg_store_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on public.tg_store_subscriptions to service_role;
