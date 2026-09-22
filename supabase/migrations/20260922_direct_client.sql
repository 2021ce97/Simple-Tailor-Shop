-- Direct React -> Supabase migration. Run after the supplied base schema.
-- Existing data is preserved.

alter table public.fabrics add column if not exists supplier text;
alter table public.product_sales add column if not exists paid_amount numeric default 0;
alter table public.product_sales add column if not exists balance_amount numeric default 0;
alter table public.product_sales add column if not exists payment_status text default 'paid';
alter table public.measurement_fields add column if not exists garment_category text default 'perahan_tunban';
alter table public.measurement_fields add column if not exists step text;
alter table public.measurement_fields add column if not exists required boolean default false;
alter table public.design_categories add column if not exists garment_category text default 'perahan_tunban';
alter table public.design_categories add column if not exists allow_custom_input boolean default false;
alter table public.design_categories add column if not exists sort_order integer default 0;

create table if not exists public.app_config (
  id text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- The legacy custom-password table is no longer used; keep it inaccessible so
-- existing rows are not exposed while accounts move to Supabase Authentication.
alter table public.app_users enable row level security;
revoke all on public.app_users from anon, authenticated;

-- Native Supabase Auth users can manage shop data directly.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'fabrics','customers','orders','measurement_fields','design_categories',
    'shop_settings','products','product_sales','order_items','app_config'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('drop policy if exists authenticated_manage on public.%I', table_name);
    execute format('create policy authenticated_manage on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;

-- The public tracking page receives only non-sensitive production status fields.
create or replace function public.lookup_public_orders(lookup_value text)
returns table (
  order_number text, garment_type text, quantity integer, status text,
  order_date text, delivery_date text, completed_date text, delivered_date text
)
language sql
security definer
set search_path = public
as $$
  select o.order_number, o.garment_type, o.quantity, o.status,
         o.order_date, o.delivery_date, o.completed_date, o.delivered_date
  from public.orders o
  where o.order_number = lookup_value
     or regexp_replace(coalesce(o.order_number, ''), '\D', '', 'g') = regexp_replace(lookup_value, '\D', '', 'g')
     or regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g') = regexp_replace(lookup_value, '\D', '', 'g')
     or regexp_replace(coalesce(o.customer_whatsapp, ''), '\D', '', 'g') = regexp_replace(lookup_value, '\D', '', 'g')
  order by o.created_at desc;
$$;

revoke all on function public.lookup_public_orders(text) from public;
grant execute on function public.lookup_public_orders(text) to anon, authenticated;

-- Branding/contact settings are displayed on the public tracking page.
grant select on public.shop_settings to anon;
drop policy if exists public_read_shop_settings on public.shop_settings;
create policy public_read_shop_settings on public.shop_settings for select to anon using (id = 'default');
