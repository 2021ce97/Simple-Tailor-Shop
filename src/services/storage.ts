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
  const user = localStorage.getItem("tailor_app_auth_user_v1");
  authUser = user ? JSON.parse(user) : null;
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
  const { error } = await supabase.from(table).upsert(payload);
  if (error) throw error;
}
async function remove(table: string, id: string) {
  requireSupabase();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
function report(promise: Promise<unknown>) {
  promise.catch((error) =>
    window.dispatchEvent(
      new CustomEvent("supabase-error", {
        detail: error instanceof Error ? error.message : String(error),
      }),
    ),
  );
}
function replace<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((row) => row.id === item.id);
  if (index >= 0) items[index] = item;
  else items.unshift(item);
}

export const storageService = {
  getUiPreferences: () => state.uiPreferences,
  saveUiPreferences(value: UiPreferences) {
    state.uiPreferences = value;
    report(upsert("ui_preferences", { id: "default", ...value }));
  },
  getFabrics: () => state.fabrics,
  getFabricById: (id: string) =>
    state.fabrics.find((row) => row.id === id || row.code === id),
  saveFabric(value: Fabric) {
    const saved = {
      ...value,
      id: value.id || `fab_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    replace(state.fabrics, saved);
    report(upsert("fabrics", saved));
    return saved;
  },
  deleteFabric(id: string) {
    state.fabrics = state.fabrics.filter((row) => row.id !== id);
    report(remove("fabrics", id));
  },
  deductFabricStock(id: string, used: number) {
    const row = this.getFabricById(id);
    if (row)
      this.saveFabric({
        ...row,
        stockMeters: Math.max(0, row.stockMeters - used),
      });
  },
  getProducts: () => state.products,
  getProductById: (id: string) => state.products.find((row) => row.id === id),
  saveProduct(
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
    replace(state.products, saved);
    report(upsert("products", saved));
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
    const saved = this.saveProduct(value);
    await upsert("products", saved);
    return saved;
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
  deleteProductCategory(id: string) {
    const row = state.productCategories.find(
      (item) => item.id === id || item.name === id,
    );
    if (row) report(remove("product_categories", row.id));
    state.productCategories = state.productCategories.filter(
      (item) => item !== row,
    );
    return state.productCategories;
  },
  getProductVendors: () => state.productVendors,
  saveProductVendor(name: string) {
    if (!state.productVendors.includes(name)) state.productVendors.push(name);
    return state.productVendors;
  },
  deleteProductVendor(name: string) {
    state.productVendors = state.productVendors.filter((row) => row !== name);
    return state.productVendors;
  },
  getProductBrands: () => state.productBrands,
  saveProductBrand(name: string) {
    if (!state.productBrands.includes(name)) state.productBrands.push(name);
    return state.productBrands;
  },
  deleteProductBrand(name: string) {
    state.productBrands = state.productBrands.filter((row) => row !== name);
    return state.productBrands;
  },
  getProductSales: () => state.productSales,
  recordProductSale(value: any) {
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
    state.productSales.unshift(saved);
    report(upsert("product_sales", saved));
    if (product)
      this.saveProduct({
        ...product,
        stockQuantity: Math.max(0, product.stockQuantity - quantity),
      });
    return saved;
  },
  saveProductSale(value: any) {
    return this.recordProductSale(value);
  },
  async saveProductSaleAsync(value: any) {
    const saved = this.recordProductSale(value);
    await upsert("product_sales", saved);
    return saved;
  },
  deleteProductSale(id: string) {
    state.productSales = state.productSales.filter((row) => row.id !== id);
    report(remove("product_sales", id));
  },
  getExpenses: () => state.expenses,
  getExpenseById: (id: string) => state.expenses.find((row) => row.id === id),
  saveExpense(value: Expense) {
    const now = new Date().toISOString();
    const saved = {
      ...value,
      id: value.id || `exp_${Date.now()}`,
      createdAt: value.createdAt || now,
      updatedAt: now,
    };
    replace(state.expenses, saved);
    report(upsert("expenses", saved));
    return saved;
  },
  async saveExpenseAsync(value: Expense) {
    const saved = this.saveExpense(value);
    await upsert("expenses", saved);
    return saved;
  },
  deleteExpense(id: string) {
    state.expenses = state.expenses.filter((row) => row.id !== id);
    report(remove("expenses", id));
  },
  async deleteExpenseAsync(id: string) {
    await remove("expenses", id);
    state.expenses = state.expenses.filter((row) => row.id !== id);
    return true;
  },
  getOrders: () => state.orders,
  getOrderById: (id: string) =>
    state.orders.find((row) => row.id === id || row.orderNumber === id),
  saveOrder(value: Order, sync = true) {
    replace(state.orders, value);
    if (sync) report(upsert("orders", value));
    return value;
  },
  async saveOrderAsync(value: Order) {
    await upsert("orders", value);
    replace(state.orders, value);
    this.syncCustomerFromOrder(value);
    return value;
  },
  deleteOrder(id: string) {
    state.orders = state.orders.filter((row) => row.id !== id);
    report(remove("orders", id));
  },
  syncCustomerFromOrder(order: Order) {
    const existing = state.customers.find(
      (row) =>
        row.id === order.customerId ||
        (!!order.customerPhone && row.phone === order.customerPhone),
    );
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
    replace(state.customers, saved);
    report(upsert("customers", saved));
  },
  recalculateCustomerStats(id: string) {
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
    report(upsert("customers", customer));
  },
  getCustomers: () => state.customers,
  getCustomerById: (id: string) => state.customers.find((row) => row.id === id),
  findCustomerByPhoneOrName(query: string) {
    return state.customers.filter(
      (row) => textIncludes(row.name, query) || textIncludes(row.phone, query),
    );
  },
  saveCustomer(value: Customer) {
    const saved = {
      ...value,
      id: value.id || `cust_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    replace(state.customers, saved);
    report(upsert("customers", saved));
    return saved;
  },
  async saveCustomerAsync(value: Customer) {
    const saved = {
      ...value,
      id: value.id || `cust_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    await upsert("customers", saved);
    replace(state.customers, saved);
    return saved;
  },
  deleteCustomer(id: string) {
    state.customers = state.customers.filter((row) => row.id !== id);
    report(remove("customers", id));
  },
  getGarmentTypes: () => state.garmentTypes,
  saveGarmentTypes(value: GarmentTypeConfig[]) {
    state.garmentTypes = value;
    report(upsert("garment_types", value));
  },
  saveGarmentType(value: GarmentTypeConfig) {
    replace(state.garmentTypes, value);
    report(upsert("garment_types", value));
    return value;
  },
  deleteGarmentType(id: string) {
    state.garmentTypes = state.garmentTypes.filter(
      (row) => row.id !== id && row.key !== id,
    );
    report(remove("garment_types", id));
  },
  getDesignCategories(type?: string) {
    return !type || type === "all"
      ? state.designCategories
      : state.designCategories.filter(
          (row) =>
            row.garmentCategory === type || row.garmentCategory === "all",
        );
  },
  saveDesignCategories(value: DesignCategory[]) {
    state.designCategories = value;
    report(upsert("design_categories", value));
  },
  saveDesignCategory(value: DesignCategory) {
    replace(state.designCategories, value);
    report(upsert("design_categories", value));
    return value;
  },
  deleteDesignCategory(id: string) {
    state.designCategories = state.designCategories.filter(
      (row) => row.id !== id,
    );
    report(remove("design_categories", id));
  },
  getMeasurementFields(type?: string) {
    return !type || type === "all"
      ? state.measurementFields
      : state.measurementFields.filter(
          (row) =>
            row.garmentCategory === type || row.garmentCategory === "all",
        );
  },
  saveMeasurementFields(value: MeasurementField[]) {
    state.measurementFields = value;
    report(upsert("measurement_fields", value));
  },
  saveMeasurementField(value: MeasurementField) {
    replace(state.measurementFields, value);
    report(upsert("measurement_fields", value));
    return value;
  },
  deleteMeasurementField(id: string) {
    state.measurementFields = state.measurementFields.filter(
      (row) => row.id !== id,
    );
    report(remove("measurement_fields", id));
  },
  getShopSettings: () => state.shopSettings || EMPTY_SETTINGS,
  saveShopSettings(value: ShopSettings) {
    state.shopSettings = value;
    report(upsert("shop_settings", value));
  },
  getAuthUser: () => authUser,
  saveAuthUser(value: { email: string; name: string } | null) {
    authUser = value;
    try {
      value
        ? localStorage.setItem("tailor_app_auth_user_v1", JSON.stringify(value))
        : localStorage.removeItem("tailor_app_auth_user_v1");
    } catch {}
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
