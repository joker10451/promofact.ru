-- Delivery reservations survive cold starts. Pending/uncertain sends are never
-- retried automatically: a provider timeout may mean the message was delivered.
create table public.posting_deliveries (
  delivery_key text primary key,
  channel text not null check (channel in ('telegram', 'vk')),
  store_slug text not null,
  reserved_at timestamptz not null default now(),
  sent_at timestamptz,
  message_id bigint,
  status text not null default 'pending' check (status in ('pending', 'sent'))
);
alter table public.posting_deliveries enable row level security;
revoke all on public.posting_deliveries from public, anon, authenticated;
grant select, insert, update on public.posting_deliveries to service_role;

create function public.reserve_posting_delivery(p_key text, p_channel text, p_store text)
returns boolean language sql security invoker set search_path = '' as $$
  with reserved as (
    insert into public.posting_deliveries(delivery_key, channel, store_slug)
    values (p_key, p_channel, p_store)
    on conflict (delivery_key) do update
      set status = 'pending', reserved_at = now(), sent_at = null, message_id = null
      where posting_deliveries.status = 'sent'
        and posting_deliveries.sent_at < now() - interval '14 days'
    returning delivery_key
  ) select exists(select 1 from reserved);
$$;
revoke all on function public.reserve_posting_delivery(text, text, text) from public, anon, authenticated;
grant execute on function public.reserve_posting_delivery(text, text, text) to service_role;
