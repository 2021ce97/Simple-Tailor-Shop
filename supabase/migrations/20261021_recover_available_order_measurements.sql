-- Recover historical measurements from matching orders.
--
-- The first three rows are verified by customer identity, garment type, and
-- saved customer profile. The remaining rows are user-approved possible
-- matches with the same recorded customer name and garment type.
--
-- This migration is deliberately idempotent: it only fills an empty target
-- measurement object and never replaces measurements that already exist.

begin;

with recovery(target_order_id, source_order_id, match_type) as (
  values
    ('ord_1790497089071'::text, 'ord_1790432182081'::text, 'verified'), -- MA-0068 <- MA-0044
    ('ord_1790497169081'::text, 'ord_1790432182081'::text, 'verified'), -- MA-0069 <- MA-0044
    ('ord_1790497612570'::text, 'ord_1790413580600'::text, 'verified'), -- MA-0071 <- MA-0015
    ('ord_1791008236732'::text, 'ord_1790413384582'::text, 'possible'), -- MA-0139 <- MA-0014
    ('ord_1791007952367'::text, 'ord_1790428359854'::text, 'possible'), -- MA-0134 <- MA-0032
    ('ord_1790518901221'::text, 'ord_1791005966053'::text, 'possible'), -- MA-0093 <- MA-0107
    ('ord_1790496851988'::text, 'ord_1790413384582'::text, 'possible'), -- MA-0063 <- MA-0014
    ('ord_1791268707173'::text, 'ord_1791039156731'::text, 'possible'), -- MA-0189 <- MA-0160
    ('ord_1791724013535'::text, 'ord_1790420773211'::text, 'possible'), -- MA-0220 <- MA-0022
    ('ord_1790496992825'::text, 'ord_1791039156731'::text, 'possible'), -- MA-0066 <- MA-0160
    ('ord_1791008201011'::text, 'ord_1790412695375'::text, 'possible')  -- MA-0138 <- MA-0012
)
update public.orders as target
set measurements = source.measurements
from recovery
join public.orders as source on source.id = recovery.source_order_id
where target.id = recovery.target_order_id
  and target.garment_type = source.garment_type
  and (
    (recovery.match_type = 'verified' and target.customer_id = source.customer_id)
    or
    (
      recovery.match_type = 'possible'
      and lower(trim(target.customer_name)) = lower(trim(source.customer_name))
    )
  )
  and coalesce(target.measurements, '{}'::jsonb) = '{}'::jsonb
  and coalesce(source.measurements, '{}'::jsonb) <> '{}'::jsonb;

commit;

-- Supabase SQL Editor verification: recovered should be true and measurements
-- should contain the copied values for every listed order.
select
  order_number,
  coalesce(measurements, '{}'::jsonb) <> '{}'::jsonb as recovered,
  measurements
from public.orders
where order_number in (
  'MA-0063', 'MA-0066', 'MA-0068', 'MA-0069', 'MA-0071', 'MA-0093',
  'MA-0134', 'MA-0138', 'MA-0139', 'MA-0189', 'MA-0220'
)
order by order_number;
