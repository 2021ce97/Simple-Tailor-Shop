import { supabase, toDatabaseRows } from '../lib/supabase';

const keys = {
  tailor_fabrics_v1: 'fabrics', tailor_orders_v1: 'orders', tailor_customers_v1: 'customers',
  tailor_products_v1: 'products', tailor_product_sales_v1: 'product_sales',
  tailor_measurement_fields_v1: 'measurement_fields', tailor_design_categories_v1: 'design_categories',
} as const;

const configKeys = {
  tailor_product_categories_v1: 'product_categories', tailor_product_vendors_v1: 'product_vendors',
  tailor_product_brands_v1: 'product_brands', tailor_garment_types_v1: 'garment_types',
} as const;

export async function migrateLegacyLocalData(): Promise<number> {
  let imported = 0;
  for (const [key, table] of Object.entries(keys)) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const rows = JSON.parse(raw);
    if (Array.isArray(rows) && rows.length) {
      const { error } = await supabase.from(table).upsert(toDatabaseRows(table, rows));
      if (error) throw error;
      imported += rows.length;
    }
  }
  const settingsRaw = localStorage.getItem('tailor_shop_settings_v1');
  if (settingsRaw) {
    const { error } = await supabase.from('shop_settings').upsert({ id: 'default', data: JSON.parse(settingsRaw) });
    if (error) throw error;
    imported++;
  }
  for (const [key, id] of Object.entries(configKeys)) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const { error } = await supabase.from('app_config').upsert({ id, data: JSON.parse(raw) });
    if (error) throw error;
    imported++;
  }
  const uiPreferences = {
    fabricLowStockThreshold: Math.max(1, Number(localStorage.getItem('fabrics_low_stock_threshold')) || 15),
    productLowStockThreshold: Math.max(1, Number(localStorage.getItem('products_low_stock_threshold')) || 3),
  };
  const { error: preferencesError } = await supabase.from('app_config').upsert({ id: 'ui_preferences', data: uiPreferences });
  if (preferencesError) throw preferencesError;
  for (const key of [...Object.keys(keys), ...Object.keys(configKeys), 'tailor_shop_settings_v1', 'tailor_app_auth_user_v1', 'tailor_app_auth_token_v1']) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem('fabrics_low_stock_threshold');
  localStorage.removeItem('products_low_stock_threshold');
  return imported;
}
