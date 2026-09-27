-- Replace the legacy app_config JSON bucket with explicit, readable tables.
-- Existing configuration data is copied before either legacy table is dropped.

begin;

create table if not exists public.product_categories (
  id text primary key,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_vendors (
  name text primary key,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_brands (
  name text primary key,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.garment_types (
  id text primary key,
  key text not null unique,
  name_en text not null,
  name_fa text not null,
  name_ps text not null,
  description_en text,
  description_fa text,
  description_ps text,
  icon text,
  sort_order integer not null default 0,
  is_standard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ui_preferences (
  id text primary key default 'default' check (id = 'default'),
  fabric_low_stock_threshold integer not null default 15 check (fabric_low_stock_threshold > 0),
  product_low_stock_threshold integer not null default 3 check (product_low_stock_threshold > 0),
  updated_at timestamptz not null default now()
);

-- Convert the arrays stored in app_config into ordinary rows.
insert into public.product_categories (id, name, sort_order)
select
  case
    when jsonb_typeof(item) = 'object' and nullif(item->>'id', '') is not null then item->>'id'
    else 'cat_' || md5(case when jsonb_typeof(item) = 'string' then item #>> '{}' else item->>'name' end)
  end,
  case when jsonb_typeof(item) = 'string' then item #>> '{}' else item->>'name' end,
  ordinality::integer
from public.app_config c
cross join lateral jsonb_array_elements(c.data) with ordinality as values_list(item, ordinality)
where c.id = 'product_categories'
  and jsonb_typeof(c.data) = 'array'
  and nullif(case when jsonb_typeof(item) = 'string' then item #>> '{}' else item->>'name' end, '') is not null
on conflict (id) do update
set name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

insert into public.product_vendors (name, sort_order)
select item #>> '{}', ordinality::integer
from public.app_config c
cross join lateral jsonb_array_elements(c.data) with ordinality as values_list(item, ordinality)
where c.id = 'product_vendors' and jsonb_typeof(c.data) = 'array' and nullif(item #>> '{}', '') is not null
on conflict (name) do update set sort_order = excluded.sort_order, updated_at = now();

insert into public.product_brands (name, sort_order)
select item #>> '{}', ordinality::integer
from public.app_config c
cross join lateral jsonb_array_elements(c.data) with ordinality as values_list(item, ordinality)
where c.id = 'product_brands' and jsonb_typeof(c.data) = 'array' and nullif(item #>> '{}', '') is not null
on conflict (name) do update set sort_order = excluded.sort_order, updated_at = now();

insert into public.garment_types (
  id, key, name_en, name_fa, name_ps, description_en, description_fa,
  description_ps, icon, sort_order, is_standard
)
select
  item->>'id', item->>'key', item->>'nameEn', item->>'nameFa', item->>'namePs',
  item->>'descriptionEn', item->>'descriptionFa', item->>'descriptionPs', item->>'icon',
  coalesce((item->>'sortOrder')::integer, ordinality::integer),
  coalesce((item->>'isStandard')::boolean, false)
from public.app_config c
cross join lateral jsonb_array_elements(c.data) with ordinality as values_list(item, ordinality)
where c.id = 'garment_types'
  and jsonb_typeof(c.data) = 'array'
  and nullif(item->>'id', '') is not null
  and nullif(item->>'key', '') is not null
  and nullif(item->>'nameEn', '') is not null
  and nullif(item->>'nameFa', '') is not null
  and nullif(item->>'namePs', '') is not null
on conflict (id) do update set
  key = excluded.key, name_en = excluded.name_en, name_fa = excluded.name_fa,
  name_ps = excluded.name_ps, description_en = excluded.description_en,
  description_fa = excluded.description_fa, description_ps = excluded.description_ps,
  icon = excluded.icon, sort_order = excluded.sort_order,
  is_standard = excluded.is_standard, updated_at = now();

insert into public.ui_preferences (id, fabric_low_stock_threshold, product_low_stock_threshold)
select
  'default',
  greatest(1, coalesce((data->>'fabricLowStockThreshold')::integer, 15)),
  greatest(1, coalesce((data->>'productLowStockThreshold')::integer, 3))
from public.app_config
where id = 'ui_preferences' and jsonb_typeof(data) = 'object'
on conflict (id) do update set
  fabric_low_stock_threshold = excluded.fabric_low_stock_threshold,
  product_low_stock_threshold = excluded.product_low_stock_threshold,
  updated_at = now();

insert into public.ui_preferences (id) values ('default') on conflict (id) do nothing;

-- These settings are private shop-management data.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'product_categories', 'product_vendors', 'product_brands', 'garment_types', 'ui_preferences'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('drop policy if exists authenticated_manage on public.%I', table_name);
    execute format(
      'create policy authenticated_manage on public.%I for all to authenticated using (true) with check (true)',
      table_name
    );
  end loop;
end $$;

comment on table public.product_categories is 'Product categories shown in inventory forms.';
comment on table public.product_vendors is 'Suppliers/vendors available for inventory products.';
comment on table public.product_brands is 'Brand names available for inventory products.';
comment on table public.garment_types is 'Configurable garment types and their translated labels.';
comment on table public.ui_preferences is 'Shared application display and stock-warning preferences.';

-- app_users was replaced by Supabase Auth. app_config is now fully normalized above.
drop table if exists public.app_users;
drop table public.app_config;

commit;
