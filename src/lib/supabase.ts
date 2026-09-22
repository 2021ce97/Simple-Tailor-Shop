import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !key) console.error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');

export const supabase = createClient(url || 'https://invalid.supabase.co', key || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const clean = (row: Record<string, any>) => Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));

export function toDatabaseRow(table: string, row: any): any {
  if (!row || typeof row !== 'object') return row;
  const commonDates = { created_at: row.createdAt, updated_at: row.updatedAt };
  const mappings: Record<string, Record<string, any>> = {
    orders: {
      id: row.id, order_number: row.orderNumber, customer_id: row.customerId || null,
      customer_name: row.customerName, customer_phone: row.customerPhone || null,
      customer_whatsapp: row.customerWhatsApp || null, garment_type: row.garmentType || null,
      quantity: row.quantity, fabric_id: row.fabricId || null, fabric_name: row.fabricName || null,
      fabric_color: row.fabricColor || null, fabric_meters: row.fabricMeters ?? 0,
      is_customer_fabric: row.isCustomerFabric ?? false, measurements: row.measurements || {},
      design_selections: row.designSelections || {}, special_instructions: row.specialInstructions || null,
      cabinet_slot: row.cabinetSlot || null, items: row.items || [], total_amount: row.totalAmount ?? 0,
      paid_amount: row.paidAmount ?? 0, balance_amount: row.balanceAmount ?? 0,
      payment_status: row.paymentStatus || 'unpaid', status: row.status || 'pending',
      order_date: row.orderDate || null, delivery_date: row.deliveryDate || null,
      completed_date: row.completedDate || null, delivered_date: row.deliveredDate || null, ...commonDates,
    },
    customers: {
      id: row.id, name: row.name, phone: row.phone || null, whatsapp: row.whatsapp || null,
      address: row.address || null, notes: row.notes || null,
      standard_measurements: row.standardMeasurements || {}, preferred_garment_type: row.preferredGarmentType || null,
      total_orders_count: row.totalOrdersCount ?? 0, total_spent: row.totalSpent ?? 0,
      total_balance: row.totalBalance ?? 0, ...commonDates,
    },
    fabrics: {
      id: row.id, name: row.name, code: row.code || null, color: row.color || null, type: row.type || null,
      price_per_meter: row.pricePerMeter ?? 0, stock_meters: row.stockMeters ?? 0, supplier: row.supplier || null,
      image_url: row.imageUrl || null, notes: row.notes || null, ...commonDates,
    },
    products: {
      id: row.id, name: row.name, category: row.category, vendor: row.vendor || null, brand: row.brand || null,
      sku: row.sku || null, image_url: row.imageUrl || null, purchase_price: row.purchasePrice ?? 0,
      stock_quantity: row.stockQuantity ?? 0, low_stock_threshold: row.lowStockThreshold ?? 5,
      description: row.description || null, ...commonDates,
    },
    product_sales: {
      id: row.id, product_id: row.productId, product_name: row.productName, category: row.category,
      quantity: row.quantity, purchase_price: row.purchasePrice ?? 0, selling_price: row.sellingPrice ?? 0,
      total_amount: row.totalAmount ?? 0, paid_amount: row.paidAmount ?? 0,
      balance_amount: row.balanceAmount ?? 0, payment_status: row.paymentStatus || 'paid', profit: row.profit ?? 0,
      customer_id: row.customerId || null, customer_name: row.customerName || null,
      customer_phone: row.customerPhone || null, sale_date: row.saleDate,
      payment_method: row.paymentMethod || null, notes: row.notes || null, created_at: row.createdAt,
    },
    measurement_fields: {
      id: row.id, key: row.key, label_en: row.labelEn, label_fa: row.labelFa, label_ps: row.labelPs,
      unit: row.unit || 'in', default_value: row.defaultValue == null ? null : String(row.defaultValue),
      is_standard: row.isStandard ?? true, sort_order: row.sortOrder ?? 0,
      garment_category: row.garmentCategory || 'perahan_tunban', step: row.step || null, required: row.required ?? false,
    },
    design_categories: {
      id: row.id, key: row.key, title_en: row.titleEn, title_fa: row.titleFa, title_ps: row.titlePs,
      options: row.options || [], garment_category: row.garmentCategory || 'perahan_tunban',
      allow_custom_input: row.allowCustomInput ?? false, sort_order: row.sortOrder ?? 0,
    },
  };
  return clean(mappings[table] || row);
}

export const toDatabaseRows = (table: string, value: any): any =>
  Array.isArray(value) ? value.map(row => toDatabaseRow(table, row)) : toDatabaseRow(table, value);

export function fromDatabaseRow(table: string, row: any): any {
  if (!row || typeof row !== 'object') return row;
  const result: any = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    result[camelKey] = value;
  }
  if (table === 'orders') {
    result.customerWhatsApp = row.customer_whatsapp;
    delete result.customerWhatsapp;
  }
  return result;
}

export const fromDatabaseRows = (table: string, rows: any[]) => rows.map(row => fromDatabaseRow(table, row));
