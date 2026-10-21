-- Recover the only historical measurements that can be matched confidently.
--
-- The backup confirms that each target and source order belongs to the same
-- customer and garment type. The source order measurements also exactly match
-- that customer's saved standard measurement profile.
--
-- This migration is deliberately idempotent: it only fills an empty target
-- measurement object and never replaces measurements that already exist.

begin;

with recovery(target_order_id, source_order_id) as (
  values
    ('ord_1790497089071'::text, 'ord_1790432182081'::text), -- MA-0068 <- MA-0044
    ('ord_1790497169081'::text, 'ord_1790432182081'::text), -- MA-0069 <- MA-0044
    ('ord_1790497612570'::text, 'ord_1790413580600'::text)  -- MA-0071 <- MA-0015
)
update public.orders as target
set measurements = source.measurements
from recovery
join public.orders as source on source.id = recovery.source_order_id
where target.id = recovery.target_order_id
  and target.customer_id = source.customer_id
  and target.garment_type = source.garment_type
  and coalesce(target.measurements, '{}'::jsonb) = '{}'::jsonb
  and coalesce(source.measurements, '{}'::jsonb) <> '{}'::jsonb;

commit;
