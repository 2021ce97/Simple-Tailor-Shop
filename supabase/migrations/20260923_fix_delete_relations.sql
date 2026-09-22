-- Allow inventory/customer deletion while preserving historical orders and sales.

alter table public.orders drop constraint if exists orders_customer_fk;
alter table public.orders
  add constraint orders_customer_fk foreign key (customer_id)
  references public.customers(id) on delete set null;

alter table public.orders drop constraint if exists orders_fabric_fk;
alter table public.orders
  add constraint orders_fabric_fk foreign key (fabric_id)
  references public.fabrics(id) on delete set null;

alter table public.product_sales drop constraint if exists product_sales_product_fk;
alter table public.product_sales alter column product_id drop not null;
alter table public.product_sales
  add constraint product_sales_product_fk foreign key (product_id)
  references public.products(id) on delete set null;

alter table public.order_items drop constraint if exists order_items_order_fk;
alter table public.order_items
  add constraint order_items_order_fk foreign key (order_id)
  references public.orders(id) on delete cascade;

notify pgrst, 'reload schema';
