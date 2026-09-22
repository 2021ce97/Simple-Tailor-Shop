const LEGACY_DATA_KEYS = [
  'tailor_orders_v1', 'tailor_customers_v1', 'tailor_fabrics_v1', 'tailor_products_v1',
  'tailor_product_categories_v1', 'tailor_product_vendors_v1', 'tailor_product_brands_v1',
  'tailor_product_sales_v1', 'tailor_design_categories_v1', 'tailor_measurement_fields_v1',
  'tailor_garment_types_v1', 'tailor_shop_settings_v1', 'tailor_app_lang_v1',
  'tailor_app_auth_user_v1', 'tailor_app_auth_token_v1', 'tailor_supabase_migration_complete_v1',
  'fabrics_low_stock_threshold', 'products_low_stock_threshold',
];

export function clearLegacyBrowserData() {
  for (const key of LEGACY_DATA_KEYS) localStorage.removeItem(key);
}
