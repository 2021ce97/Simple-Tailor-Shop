-- READ-ONLY MEASUREMENT RECOVERY AUDIT
-- Run this file in Supabase Dashboard > SQL Editor.
-- It does not update or delete any business data.

-- 1. Summary: shows where measurement-shaped data still exists.
select
  (select count(*) from public.orders) as total_orders,
  (select count(*)
     from public.orders o
    where coalesce(o.measurements, '{}'::jsonb) <> '{}'::jsonb) as orders_with_top_level_measurements,
  (select count(*)
     from public.orders o
    where coalesce(o.items, '[]'::jsonb) <> '[]'::jsonb) as orders_with_embedded_items,
  (select count(*) from public.order_items) as separate_order_item_rows,
  (select count(*)
     from public.customers c
    where coalesce(c.standard_measurements, '{}'::jsonb) <> '{}'::jsonb) as customers_with_saved_measurements;

-- 2. Recovery export for every order whose top-level measurements are blank.
-- The separate_order_items column preserves every column from order_items as
-- JSON, so it works even if an older app version used a different item schema.
select
  o.id as order_id,
  o.order_number,
  o.customer_id,
  o.customer_name,
  o.customer_phone,
  o.garment_type,
  o.order_date,
  o.measurements as current_order_measurements,
  o.items as embedded_order_items,
  coalesce(c.standard_measurements, '{}'::jsonb) as customer_saved_measurements,
  coalesce(
    (
      select jsonb_agg(to_jsonb(oi) order by oi.id)
      from public.order_items oi
      where oi.order_id = o.id
    ),
    '[]'::jsonb
  ) as separate_order_items
from public.orders o
left join public.customers c on c.id = o.customer_id
where coalesce(o.measurements, '{}'::jsonb) = '{}'::jsonb
order by o.order_number;

-- 3. Schema inventory: helps identify any other JSON columns used by an older
-- deployment to store measurements or garment snapshots.
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and data_type in ('json', 'jsonb')
order by table_name, ordinal_position;
