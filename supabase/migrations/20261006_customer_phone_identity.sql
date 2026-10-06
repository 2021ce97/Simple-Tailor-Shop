-- Customers may share a name, but a non-empty phone number identifies one customer.
-- Remove a legacy UNIQUE constraint on customers.name, regardless of its generated name.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'customers'
      and c.contype = 'u'
      and (
        select array_agg(a.attname order by key_column.ordinality)
        from unnest(c.conkey) with ordinality as key_column(attnum, ordinality)
        join pg_attribute a on a.attrelid = t.oid and a.attnum = key_column.attnum
      ) = array['name']::name[]
  loop
    execute format('alter table public.customers drop constraint %I', constraint_name);
  end loop;
end $$;

-- Older installations may already contain multiple customer rows for the same
-- phone. Keep the oldest row, move every foreign-key reference to it, and then
-- remove the redundant rows. Order-level names and measurements remain intact.
create temporary table duplicate_customer_map on commit drop as
with ranked as (
  select
    id,
    first_value(id) over (
      partition by regexp_replace(phone, '\D', '', 'g')
      order by created_at nulls last, id
    ) as keeper_id,
    regexp_replace(phone, '\D', '', 'g') as phone_digits
  from public.customers
  where phone is not null and regexp_replace(phone, '\D', '', 'g') <> ''
)
select id as duplicate_id, keeper_id
from ranked
where id <> keeper_id;

do $$
declare
  foreign_key record;
begin
  for foreign_key in
    select
      child_namespace.nspname as schema_name,
      child_table.relname as table_name,
      child_column.attname as column_name
    from pg_constraint c
    join pg_class child_table on child_table.oid = c.conrelid
    join pg_namespace child_namespace on child_namespace.oid = child_table.relnamespace
    join pg_attribute child_column
      on child_column.attrelid = child_table.oid
      and child_column.attnum = c.conkey[1]
    where c.contype = 'f'
      and c.confrelid = 'public.customers'::regclass
      and array_length(c.conkey, 1) = 1
      and array_length(c.confkey, 1) = 1
  loop
    execute format(
      'update %I.%I as child set %I = duplicates.keeper_id from duplicate_customer_map as duplicates where child.%I = duplicates.duplicate_id',
      foreign_key.schema_name,
      foreign_key.table_name,
      foreign_key.column_name,
      foreign_key.column_name
    );
  end loop;
end $$;

delete from public.customers as customer
using duplicate_customer_map as duplicates
where customer.id = duplicates.duplicate_id;

-- Formatting characters do not make a phone number different. Empty phones are
-- excluded so more than one customer can be saved without a phone number.
create unique index if not exists customers_phone_digits_unique
  on public.customers ((regexp_replace(phone, '\D', '', 'g')))
  where phone is not null and regexp_replace(phone, '\D', '', 'g') <> '';
