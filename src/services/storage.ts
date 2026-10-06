import {
  Customer,
  Order,
  DesignCategory,
  MeasurementField,
  ShopSettings,
  Fabric,
  Product,
  ProductCategory,
  ProductSale,
  GarmentTypeConfig,
  Expense,
} from "../types";
import {
  fromDatabaseRows,
  supabase,
  toDatabaseRows,
  isSupabaseConfigured,
} from "../lib/supabase";
import { textIncludes } from "../lib/search";

type UiPreferences = {
  fabricLowStockThreshold: number;
  productLowStockThreshold: number;
};
const state = {
  fabrics: [] as Fabric[],
  orders: [] as Order[],
  customers: [] as Customer[],
  products: [] as Product[],
  productCategories: [] as ProductCategory[],
  productVendors: [] as string[],
  productBrands: [] as string[],
  productSales: [] as ProductSale[],
  expenses: [] as Expense[],
  garmentTypes: [] as GarmentTypeConfig[],
  designCategories: [] as DesignCategory[],
  measurementFields: [] as MeasurementField[],
  shopSettings: null as ShopSettings | null,
  uiPreferences: {
    fabricLowStockThreshold: 15,
    productLowStockThreshold: 3,
  } as UiPreferences,
};
const EMPTY_SETTINGS: ShopSettings = {
  shopNameEn: "",
  shopNameFa: "",
  shopNamePs: "",
  phone1: "",
  whatsapp: "",
  addressEn: "",
  addressFa: "",
  addressPs: "",
  currencyEn: "",
  currencyFa: "",
  currencyPs: "",
};
let authUser: { email: string; name: string } | null = null;
let languagePreference: "en" | "fa" | "ps" = "fa";
try {
  const language = localStorage.getItem("tailor_app_lang_v1");
  if (language === "en" || language === "fa" || language === "ps")
    languagePreference = language;
} catch {}

function requireSupabase() {
  if (!isSupabaseConfigured)
    throw new Error(
      "Supabase is not configured. Add the Supabase URL and public key, then reload the application.",
    );
}
async function upsert(table: string, value: any) {
  requireSupabase();
  const payload =
    table === "shop_settings"
      ? { id: "default", data: value, updated_at: new Date().toISOString() }
      : toDatabaseRows(table, value);
  const { data, error } = await supabase.from(table).upsert(payload).select();
  if (error) throw error;
  const expected = Array.isArray(payload) ? payload.length : 1;
  if (!Array.isArray(data) || data.length < expected) {
    throw new Error(`Supabase did not confirm the ${table} save. Check authentication and row-level security policies.`);
  }
}
async function remove(table: string, id: string) {
  requireSupabase();
  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error(`The ${table} record was not deleted. It may no longer exist or your account may not have permission.`);
  }
}
async function replaceCollection(table: string, values: Array<{ id: string }>) {
  requireSupabase();
  if (values.length) await upsert(table, values);
  let query = supabase.from(table).delete();
  query = values.length
    ? query.not("id", "in", `(${values.map(row => `"${row.id.replace(/"/g, '')}"`).join(",")})`)
    : query.not("id", "is", null);
  const { error } = await query;
  if (error) throw error;
}
function replace<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((row) => row.id === item.id);
  if (index >= 0) items[index] = item;
  else items.unshift(item);
}

const normalizePhone = (value: unknown) => String(value || "").replace(/\D/g, "");

function assertUniqueCustomerPhone(customer: Pick<Customer, "id" | "phone">) {
  const phone = normalizePhone(customer.phone);
  if (!phone) return;
  const duplicate = state.customers.find(
    (row) => row.id !== customer.id && normalizePhone(row.phone) === phone,
  );
  if (duplicate) {
    throw new Error(`A customer with phone number ${customer.phone} already exists.`);
  }
}

export const storageService = {
  getUiPreferences: () => state.uiPreferences,
  async saveUiPreferences(value: UiPreferences) {
    await upsert("ui_preferences", { id: "default", ...value });
    state.uiPreferences = value;
  },
  getFabrics: () => state.fabrics,
  getFabricById: (id: string) =>
    state.fabrics.find((row) => row.id === id || row.code === id),
  async saveFabric(value: Fabric) {
    const saved = {
      ...value,
      id: value.id || `fab_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    await upsert("fabrics", saved);
    replace(state.fabrics, saved);
    return saved;
  },
  async deleteFabric(id: string) {
    await remove("fabrics", id);
    state.fabrics = state.fabrics.filter((row) => row.id !== id);
  },
  async deductFabricStock(id: string, used: number) {
    const row = this.getFabricById(id);
    if (row)
      await this.saveFabric({
        ...row,
        stockMeters: Math.max(0, row.stockMeters - used),
      });
  },
  getProducts: () => state.products,
  getProductById: (id: string) => state.products.find((row) => row.id === id),
  async saveProduct(
    value: Partial<Product> & {
      name: string;
      category: string;
      purchasePrice: number;
      stockQuantity: number;
    },
  ) {
    const now = new Date().toISOString();
    const saved = {
      ...value,
      id: value.id || `prod_${Date.now()}`,
      createdAt: value.createdAt || now,
      updatedAt: now,
    } as Product;
    await upsert("products", saved);
    replace(state.products, saved);
    return saved;
  },
  async saveProductAsync(
    value: Partial<Product> & {
      name: string;
      category: string;
      purchasePrice: number;
      stockQuantity: number;
    },
  ) {
    return this.saveProduct(value);
  },
  async deleteProduct(id: string) {
    await remove("products", id);
    state.products = state.products.filter((row) => row.id !== id);
  },
  getProductCategories: () => state.productCategories,
  async saveProductCategory(name: string) {
    const saved = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      sortOrder: state.productCategories.length + 1,
    } as ProductCategory;
    await upsert("product_categories", saved);
    state.productCategories.push(saved);
    return saved;
  },
  async deleteProductCategory(id: string) {
    const row = state.productCategories.find(
      (item) => item.id === id || item.name === id,
    );
    if (row) await remove("product_categories", row.id);
    state.productCategories = state.productCategories.filter(
      (item) => item !== row,
    );
    return state.productCategories;
  },
  getProductVendors: () => state.productVendors,
  async saveProductVendor(name: string) {
    if (!state.productVendors.includes(name)) state.productVendors.push(name);
    await upsert("product_vendors", state.productVendors.map((value, sort_order) => ({ name: value, sort_order })));
    return state.productVendors;
  },
  async deleteProductVendor(name: string) {
    const { data, error } = await supabase.from("product_vendors").delete().eq("name", name).select("name");
    if (error) throw error;
    if (!data?.length) throw new Error("The product vendor was not deleted.");
    state.productVendors = state.productVendors.filter((row) => row !== name);
    return state.productVendors;
  },
  getProductBrands: () => state.productBrands,
  async saveProductBrand(name: string) {
    if (!state.productBrands.includes(name)) state.productBrands.push(name);
    await upsert("product_brands", state.productBrands.map((value, sort_order) => ({ name: value, sort_order })));
    return state.productBrands;
  },
  async deleteProductBrand(name: string) {
    const { data, error } = await supabase.from("product_brands").delete().eq("name", name).select("name");
    if (error) throw error;
    if (!data?.length) throw new Error("The product brand was not deleted.");
    state.productBrands = state.productBrands.filter((row) => row !== name);
    return state.productBrands;
  },
  getProductSales: () => state.productSales,
  async recordProductSale(value: any) {
    const product = state.products.find((row) => row.id === value.productId);
    const quantity = Math.max(1, Number(value.quantity) || 1);
    const sellingPrice = Number(value.sellingPrice) || 0;
    const purchasePrice =
      Number(value.purchasePrice ?? product?.purchasePrice) || 0;
    const totalAmount = Number(value.totalAmount) || sellingPrice * quantity;
    const paidAmount =
      value.paidAmount === undefined ? totalAmount : Number(value.paidAmount);
    const balanceAmount = Math.max(0, totalAmount - paidAmount);
    const saved = {
      ...value,
      id: value.id || `sale_${Date.now()}`,
      quantity,
      sellingPrice,
      purchasePrice,
      totalAmount,
      paidAmount,
      balanceAmount,
      paymentStatus:
        balanceAmount === 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
      profit: (sellingPrice - purchasePrice) * quantity,
      saleDate: value.saleDate || new Date().toISOString(),
    } as ProductSale;
    await upsert("product_sales", saved);
    if (product)
      await this.saveProduct({
        ...product,
        stockQuantity: Math.max(0, product.stockQuantity - quantity),
      });
    state.productSales.unshift(saved);
    return saved;
  },
  async saveProductSale(value: any) {
    return this.recordProductSale(value);
  },
  async saveProductSaleAsync(value: any) {
    return this.recordProductSale(value);
  },
  async deleteProductSale(id: string) {
    await remove("product_sales", id);
    state.productSales = state.productSales.filter((row) => row.id !== id);
  },
  getExpenses: () => state.expenses,
  getExpenseById: (id: string) => state.expenses.find((row) => row.id === id),
  async saveExpense(value: Expense) {
    const now = new Date().toISOString();
    const saved = {
      ...value,
      id: value.id || `exp_${Date.now()}`,
      createdAt: value.createdAt || now,
      updatedAt: now,
    };
    await upsert("expenses", saved);
    replace(state.expenses, saved);
    return saved;
  },
  async saveExpenseAsync(value: Expense) {
    return this.saveExpense(value);
  },
  async deleteExpense(id: string) {
    await remove("expenses", id);
    state.expenses = state.expenses.filter((row) => row.id !== id);
  },
  async deleteExpenseAsync(id: string) {
    await remove("expenses", id);
    state.expenses = state.expenses.filter((row) => row.id !== id);
    return true;
  },
  getOrders: () => state.orders,
  getOrderById: (id: string) =>
    state.orders.find((row) => row.id === id || row.orderNumber === id),
  async saveOrder(value: Order, sync = true) {
    let saved = value;
    if (sync) {
      // The orders.customer_id foreign key requires the customer row to exist
      // before the order is written. Use the canonical customer ID as a phone
      // match may resolve a newly generated ID to an existing customer.
      const customer = await this.syncCustomerFromOrder(value);
      saved = { ...value, customerId: customer.id };
      await upsert("orders", saved);
    }
    replace(state.orders, saved);
    return saved;
  },
  async saveOrderAsync(value: Order) {
    return this.saveOrder(value, true);
  },
  async saveOrderPaymentsAsync(values: Order[]) {
    if (!values.length) return [];
    await upsert("orders", values);
    values.forEach((value) => replace(state.orders, value));
    return values;
  },
  async deleteOrder(id: string) {
    await remove("orders", id);
    state.orders = state.orders.filter((row) => row.id !== id);
  },
  async syncCustomerFromOrder(order: Order) {
    const orderPhone = normalizePhone(order.customerPhone);
    const existing =
      (orderPhone
        ? state.customers.find((row) => normalizePhone(row.phone) === orderPhone)
        : undefined) ||
      state.customers.find((row) => row.id === order.customerId);
    const now = new Date().toISOString();
    const saved = {
      ...(existing || {}),
      id: existing?.id || order.customerId || `cust_${Date.now()}`,
      name: order.customerName,
      phone: order.customerPhone || "",
      whatsapp: order.customerWhatsApp || order.customerPhone || "",
      standardMeasurements: order.measurements || {},
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      totalOrdersCount: existing?.totalOrdersCount || 0,
      totalSpent: existing?.totalSpent || 0,
      totalBalance: existing?.totalBalance || 0,
    } as Customer;
    await upsert("customers", saved);
    replace(state.customers, saved);
    return saved;
  },
  async recalculateCustomerStats(id: string) {
    const customer = state.customers.find((row) => row.id === id);
    if (!customer) return;
    const records = [
      ...state.orders.filter((row) => row.customerId === id),
      ...state.productSales.filter((row) => row.customerId === id),
    ];
    customer.totalOrdersCount = state.orders.filter(
      (row) => row.customerId === id,
    ).length;
    customer.totalSpent = records.reduce(
      (sum, row) => sum + Number(row.totalAmount || 0),
      0,
    );
    customer.totalBalance = records.reduce(
      (sum, row) => sum + Number(row.balanceAmount || 0),
      0,
    );
    await upsert("customers", customer);
  },
  getCustomers: () => state.customers,
  getCustomerById: (id: string) => state.customers.find((row) => row.id === id),
  findCustomerByPhoneOrName(query: string) {
    return state.customers.filter(
      (row) => textIncludes(row.name, query) || textIncludes(row.phone, query),
    );
  },
  async saveCustomer(value: Customer) {
    const saved = {
      ...value,
      id: value.id || `cust_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    assertUniqueCustomerPhone(saved);
    await upsert("customers", saved);
    replace(state.customers, saved);
    return saved;
  },
  async saveCustomerAsync(value: Customer) {
    const saved = {
      ...value,
      id: value.id || `cust_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    assertUniqueCustomerPhone(saved);
    await upsert("customers", saved);
    replace(state.customers, saved);
    return saved;
  },
  async deleteCustomer(id: string) {
    await remove("customers", id);
    state.customers = state.customers.filter((row) => row.id !== id);
  },
  getGarmentTypes: () => state.garmentTypes,
  async saveGarmentTypes(value: GarmentTypeConfig[]) {
    await replaceCollection("garment_types", value);
    state.garmentTypes = value;
  },
  async saveGarmentType(value: GarmentTypeConfig) {
    await upsert("garment_types", value);
    replace(state.garmentTypes, value);
    return value;
  },
  async deleteGarmentType(id: string) {
    const row = state.garmentTypes.find(item => item.id === id || item.key === id);
    if (row) await remove("garment_types", row.id);
    state.garmentTypes = state.garmentTypes.filter(
      (row) => row.id !== id && row.key !== id,
    );
  },
  getDesignCategories(type?: string) {
    return !type || type === "all"
      ? state.designCategories
      : state.designCategories.filter(
          (row) =>
            row.garmentCategory === type || row.garmentCategory === "all",
        );
  },
  async saveDesignCategories(value: DesignCategory[]) {
    await replaceCollection("design_categories", value);
    state.designCategories = value;
  },
  async saveDesignCategory(value: DesignCategory) {
    await upsert("design_categories", value);
    replace(state.designCategories, value);
    return value;
  },
  async deleteDesignCategory(id: string) {
    await remove("design_categories", id);
    state.designCategories = state.designCategories.filter(
      (row) => row.id !== id,
    );
  },
  getMeasurementFields(type?: string) {
    return !type || type === "all"
      ? state.measurementFields
      : state.measurementFields.filter(
          (row) =>
            row.garmentCategory === type || row.garmentCategory === "all",
        );
  },
  async saveMeasurementFields(value: MeasurementField[]) {
    await replaceCollection("measurement_fields", value);
    state.measurementFields = value;
  },
  async saveMeasurementField(value: MeasurementField) {
    await upsert("measurement_fields", value);
    replace(state.measurementFields, value);
    return value;
  },
  async deleteMeasurementField(id: string) {
    await remove("measurement_fields", id);
    state.measurementFields = state.measurementFields.filter(
      (row) => row.id !== id,
    );
  },
  getShopSettings: () => state.shopSettings || EMPTY_SETTINGS,
  async saveShopSettings(value: ShopSettings) {
    await upsert("shop_settings", value);
    state.shopSettings = value;
  },
  getAuthUser: () => authUser,
  saveAuthUser(value: { email: string; name: string } | null) {
    authUser = value;
    try { localStorage.removeItem("tailor_app_auth_user_v1"); } catch {}
  },
  getAuthToken: () => null,
  saveAuthToken(_value: string | null) {},
  getLanguage: () => languagePreference,
  saveLanguage(value: "en" | "fa" | "ps") {
    languagePreference = value;
    try {
      localStorage.setItem("tailor_app_lang_v1", value);
    } catch {}
  },
  exportFullDatabase() {
    return JSON.stringify(
      { version: 3, exportedAt: new Date().toISOString(), ...state },
      null,
      2,
    );
  },
  importFullDatabase(_value: string) {
    throw new Error(
      "Local import is disabled. Import data directly into Supabase.",
    );
  },
  generateNextOrderNumber() {
    const numbers = state.orders
      .map((row) => /^MA-(\d+)$/i.exec(row.orderNumber || ""))
      .filter(Boolean)
      .map((match) => Number(match![1]));
    return `MA-${String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(4, "0")}`;
  },
  async syncFromDatabase() {
    requireSupabase();
    const tables = [
      "fabrics",
      "orders",
      "customers",
      "products",
      "product_sales",
      "measurement_fields",
      "design_categories",
      "shop_settings",
      "product_categories",
      "product_vendors",
      "product_brands",
      "garment_types",
      "ui_preferences",
      "expenses",
    ];
    const results = await Promise.all(
      tables.map(async (table) => {
        const result = await supabase.from(table).select("*");
        if (result.error) throw new Error(`${table}: ${result.error.message}`);
        return result.data || [];
      }),
    );
    const [
      fabrics,
      orders,
      customers,
      products,
      sales,
      fields,
      designs,
      settings,
      categories,
      vendors,
      brands,
      garmentTypes,
      preferences,
      expenses,
    ] = results;
    state.fabrics = fromDatabaseRows("fabrics", fabrics);
    state.orders = fromDatabaseRows("orders", orders);
    state.customers = fromDatabaseRows("customers", customers);
    state.products = fromDatabaseRows("products", products);
    state.productSales = fromDatabaseRows("product_sales", sales);
    state.expenses = fromDatabaseRows("expenses", expenses);
    state.measurementFields = fromDatabaseRows("measurement_fields", fields);
    state.designCategories = fromDatabaseRows("design_categories", designs);
    state.shopSettings = settings[0]?.data || null;
    state.productCategories = fromDatabaseRows(
      "product_categories",
      categories,
    ).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
    state.productVendors = vendors
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((row: any) => row.name);
    state.productBrands = brands
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((row: any) => row.name);
    state.garmentTypes = fromDatabaseRows("garment_types", garmentTypes).sort(
      (a: any, b: any) => a.sortOrder - b.sortOrder,
    );
    if (preferences[0])
      state.uiPreferences = fromDatabaseRows("ui_preferences", preferences)[0];
    return true;
  },
};
