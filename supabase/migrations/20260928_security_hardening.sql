-- Production security hardening. Apply after the earlier migrations.
begin;

-- Business records are never directly available to anonymous visitors.
revoke all on table public.fabrics, public.customers, public.orders,
  public.measurement_fields, public.design_categories, public.products,
  public.product_sales, public.order_items, public.product_categories,
  public.product_vendors, public.product_brands, public.garment_types,
  public.ui_preferences, public.expenses from anon;

-- Remove the legacy anonymous expense policy.
drop policy if exists anon_manage_expenses on public.expenses;

-- Only permanent signed-in staff accounts may manage shop data. This also
-- blocks Supabase anonymous-auth users, which use the authenticated role.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'fabrics','customers','orders','measurement_fields','design_categories',
    'shop_settings','products','product_sales','order_items','product_categories',
    'product_vendors','product_brands','garment_types','ui_preferences','expenses'
  ] loop
    execute format('drop policy if exists authenticated_manage on public.%I', table_name);
    execute format('drop policy if exists authenticated_manage_expenses on public.%I', table_name);
    execute format(
      'create policy authenticated_manage on public.%I for all to authenticated using (coalesce((auth.jwt()->>''is_anonymous'')::boolean, false) = false) with check (coalesce((auth.jwt()->>''is_anonymous'')::boolean, false) = false)',
      table_name
    );
  end loop;
end $$;

-- Shop settings are the sole directly readable public table and only expose
-- the single branding/contact row used by the tracking page.
revoke all on table public.shop_settings from anon;
grant select on table public.shop_settings to anon;
drop policy if exists public_read_shop_settings on public.shop_settings;
create policy public_read_shop_settings on public.shop_settings
  for select to anon using (id = 'default');

-- Keep the public lookup narrow, exact, and free of customer identity fields.
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
  where length(trim(lookup_value)) between 4 and 64
    and (
      lower(o.order_number) = lower(trim(lookup_value))
      or regexp_replace(coalesce(o.order_number, ''), '\D', '', 'g') = regexp_replace(trim(lookup_value), '\D', '', 'g')
      or regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g') = regexp_replace(trim(lookup_value), '\D', '', 'g')
      or regexp_replace(coalesce(o.customer_whatsapp, ''), '\D', '', 'g') = regexp_replace(trim(lookup_value), '\D', '', 'g')
    )
  order by o.created_at desc
  limit 20;
$$;

revoke all on function public.lookup_public_orders(text) from public;
grant execute on function public.lookup_public_orders(text) to anon, authenticated;

commit;
