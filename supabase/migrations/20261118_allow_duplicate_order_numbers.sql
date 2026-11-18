-- Bill numbers are searchable labels; orders.id remains the unique identity.
begin;

-- Older base schemas may define UNIQUE(order_number) with different names.
-- Remove only uniqueness on that single column, preserving the primary key
-- and all customer, payment, and order-item relationships.
do $$
declare
  order_number_column smallint;
  unique_constraint record;
  unique_index record;
begin
  select attnum into strict order_number_column
  from pg_attribute
  where attrelid = 'public.orders'::regclass
    and attname = 'order_number'
    and not attisdropped;

  for unique_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'u'
      and conkey = array[order_number_column]
  loop
    execute format('alter table public.orders drop constraint %I', unique_constraint.conname);
  end loop;

  for unique_index in
    select namespace.nspname, index_relation.relname
    from pg_index index_definition
    join pg_class index_relation on index_relation.oid = index_definition.indexrelid
    join pg_namespace namespace on namespace.oid = index_relation.relnamespace
    where index_definition.indrelid = 'public.orders'::regclass
      and index_definition.indisunique
      and not index_definition.indisprimary
      and index_definition.indnkeyatts = 1
      and index_definition.indkey[0] = order_number_column
  loop
    execute format('drop index %I.%I', unique_index.nspname, unique_index.relname);
  end loop;
end $$;

drop index if exists public.orders_order_number_normalized_unique;
create index if not exists orders_order_number_normalized_idx
  on public.orders (upper(btrim(order_number)));

-- Return every matching order, including repeated bill numbers. Keep the
-- existing public fields, exact-number matching, and execution permissions.
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
  order by o.created_at desc, o.id;
$$;

revoke all on function public.lookup_public_orders(text) from public;
grant execute on function public.lookup_public_orders(text) to anon, authenticated;

commit;
