-- Support user-entered numeric order numbers without changing legacy MA-* orders.
begin;

-- Exact normalized uniqueness allows both MA-0223 and 0223, but rejects a
-- second 0223 (including whitespace/case variants).
create unique index if not exists orders_order_number_normalized_unique
  on public.orders (upper(btrim(order_number)));

-- Public tracking must not strip the MA prefix: numeric 0223 and legacy
-- MA-0223 are intentionally different order numbers.
create or replace function public.lookup_public_orders(lookup_value text)
returns table (
  order_number text, garment_type text, quantity integer, status text,
  order_date text, delivery_date text, completed_date text, delivered_date text
)
language sql
security definer
set search_path = public
set statement_timeout = '3s'
as $$
  select o.order_number, o.garment_type, o.quantity, o.status,
         o.order_date, o.delivery_date, o.completed_date, o.delivered_date
  from public.orders o
  where length(trim(lookup_value)) between 1 and 64
    and (
      upper(btrim(o.order_number)) = upper(btrim(lookup_value))
      or (
        regexp_replace(trim(lookup_value), '\D', '', 'g') <> ''
        and regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g') = regexp_replace(trim(lookup_value), '\D', '', 'g')
      )
      or (
        regexp_replace(trim(lookup_value), '\D', '', 'g') <> ''
        and regexp_replace(coalesce(o.customer_whatsapp, ''), '\D', '', 'g') = regexp_replace(trim(lookup_value), '\D', '', 'g')
      )
    )
  order by o.created_at desc
  limit 20;
$$;

revoke all on function public.lookup_public_orders(text) from public;
grant execute on function public.lookup_public_orders(text) to anon, authenticated;

commit;
