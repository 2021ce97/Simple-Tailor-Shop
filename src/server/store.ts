import fs from 'fs';
import path from 'path';
import { 
  INITIAL_DEMO_FABRICS, 
  INITIAL_DEMO_CUSTOMERS, 
  INITIAL_DEMO_ORDERS, 
  INITIAL_DEMO_PRODUCTS,
  INITIAL_DEMO_PRODUCT_SALES,
  DEFAULT_SHOP_SETTINGS, 
  DEFAULT_MEASUREMENT_FIELDS, 
  DEFAULT_DESIGN_CATEGORIES 
} from '../services/storage';

export interface DatabaseStore {
  fabrics: any[];
  orders: any[];
  customers: any[];
  products: any[];
  productSales: any[];
  shopSettings: any;
  measurementFields: any[];
  designCategories: any[];
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db-store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// In-memory cache synced with disk
let cachedStore: DatabaseStore = {
  fabrics: [...INITIAL_DEMO_FABRICS],
  orders: [...INITIAL_DEMO_ORDERS],
  customers: [...INITIAL_DEMO_CUSTOMERS],
  products: [...INITIAL_DEMO_PRODUCTS],
  productSales: [...INITIAL_DEMO_PRODUCT_SALES],
  shopSettings: { ...DEFAULT_SHOP_SETTINGS },
  measurementFields: [...DEFAULT_MEASUREMENT_FIELDS],
  designCategories: [...DEFAULT_DESIGN_CATEGORIES],
  lastUpdated: new Date().toISOString()
};

// Load existing data from disk on boot
export function initStore(): DatabaseStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        cachedStore = {
          fabrics: Array.isArray(parsed.fabrics) ? parsed.fabrics : [...INITIAL_DEMO_FABRICS],
          orders: Array.isArray(parsed.orders) ? parsed.orders : [...INITIAL_DEMO_ORDERS],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [...INITIAL_DEMO_CUSTOMERS],
          products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : [...INITIAL_DEMO_PRODUCTS],
          productSales: Array.isArray(parsed.productSales) && parsed.productSales.length > 0 ? parsed.productSales : [...INITIAL_DEMO_PRODUCT_SALES],
          shopSettings: parsed.shopSettings || { ...DEFAULT_SHOP_SETTINGS },
          measurementFields: Array.isArray(parsed.measurementFields) && parsed.measurementFields.length > 0 
            ? parsed.measurementFields 
            : [...DEFAULT_MEASUREMENT_FIELDS],
          designCategories: Array.isArray(parsed.designCategories) && parsed.designCategories.length > 0 
            ? parsed.designCategories 
            : [...DEFAULT_DESIGN_CATEGORIES],
          lastUpdated: parsed.lastUpdated || new Date().toISOString()
        };
        console.log(`[Store] Loaded from disk: ${cachedStore.orders.length} orders, ${cachedStore.customers.length} customers`);
        return cachedStore;
      }
    }
  } catch (err: any) {
    console.warn('[Store] Notice reading db-store.json:', err.message);
  }

  // Save initial template if file didn't exist
  saveStoreToDisk();
  return cachedStore;
}

export function getStore(): DatabaseStore {
  return cachedStore;
}

export function saveStoreToDisk(): void {
  try {
    cachedStore.lastUpdated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(cachedStore, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err: any) {
    console.error('[Store] Error saving store to disk:', err.message);
  }
}
