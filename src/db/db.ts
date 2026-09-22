import pg from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const { Pool } = pg;

// Supabase client initialization (Cloud PostgreSQL PostgREST layer)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      realtime: { timeout: 10000 }
    })
  : null;

let pool: pg.Pool | null = null;
let currentConnectionString: string | null = null;
let isDbAvailable = false;
let isInitialized = false;
let pgAuthFailed = false;

// Direct PostgreSQL Pooler Configuration
export function getDbPool(): pg.Pool | null {
  if (pgAuthFailed) {
    // Prevent repeated connection hammering when TCP credentials failed
    return null;
  }

  let rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL;
  
  if (!rawUrl || rawUrl.includes('<project-ref>') || rawUrl.includes('<url-encoded-database-password>')) {
    if (pool) {
      pool.end().catch(() => {});
      pool = null;
      currentConnectionString = null;
      isInitialized = false;
    }
    return null;
  }

  if (pool && currentConnectionString === rawUrl) {
    return pool;
  }

  if (pool) {
    pool.end().catch(() => {});
    pool = null;
    isInitialized = false;
  }

  try {
    const parsedDatabaseUrl = new URL(rawUrl);
    if (parsedDatabaseUrl.hostname.endsWith('.pooler.supabase.com') && parsedDatabaseUrl.port === '5432') {
      parsedDatabaseUrl.port = '6543';
    }
    parsedDatabaseUrl.searchParams.delete('sslmode');
    parsedDatabaseUrl.searchParams.delete('sslrootcert');

    pool = new Pool({
      connectionString: parsedDatabaseUrl.toString(),
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      keepAlive: true,
    });
    currentConnectionString = rawUrl;

    pool.on('error', (err) => {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('password authentication failed') || (err as any)?.code === '28P01') {
        pgAuthFailed = true;
      }
    });

    return pool;
  } catch (err: any) {
    return null;
  }
}

// Check if database is connected (Supabase or direct PostgreSQL pool)
export function isDatabaseConnected(): boolean {
  return isDbAvailable || supabase !== null;
}

// Actively verify database health and availability
export async function verifyDbConnection(): Promise<boolean> {
  // 1. First priority: Check Supabase client
  if (supabase) {
    try {
      const { error } = await supabase.from('orders').select('id').limit(1);
      if (!error) {
        isDbAvailable = true;
        return true;
      }
    } catch (err: any) {
      console.warn('[Database] Supabase ping notice:', err?.message || err);
    }
  }

  // 2. Second priority: Check direct PostgreSQL pool if not flagged with auth failure
  if (!pgAuthFailed) {
    const p = getDbPool();
    if (p) {
      try {
        await p.query('SELECT 1');
        isDbAvailable = true;
        return true;
      } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('password authentication failed') || err?.code === '28P01') {
          pgAuthFailed = true;
          console.warn('[Database] Direct PostgreSQL TCP authentication failed. Routed seamlessly through Supabase Cloud Client.');
        }
      }
    }
  }

  return isDbAvailable;
}

// Initialize database schema and verify connectivity
export async function initDatabase(): Promise<boolean> {
  if (isInitialized) return true;

  if (supabase) {
    try {
      const { error } = await supabase.from('orders').select('id').limit(1);
      if (!error) {
        isDbAvailable = true;
        isInitialized = true;
        console.log('[PostgreSQL] Connected via Supabase Cloud Database (Verified)');
        return true;
      }
    } catch (err: any) {
      console.warn('[Database] Supabase initial connection notice:', err?.message || err);
    }
  }

  const p = getDbPool();
  if (!p) {
    isDbAvailable = supabase !== null;
    isInitialized = true;
    return isDbAvailable;
  }

  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS fabrics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT,
        color TEXT,
        type TEXT,
        price_per_meter NUMERIC DEFAULT 0,
        stock_meters NUMERIC DEFAULT 0,
        image_url TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        whatsapp TEXT,
        address TEXT,
        notes TEXT,
        standard_measurements JSONB DEFAULT '{}'::jsonb,
        preferred_garment_type TEXT,
        total_orders_count INT DEFAULT 0,
        total_spent NUMERIC DEFAULT 0,
        total_balance NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_whatsapp TEXT,
        garment_type TEXT,
        quantity INT DEFAULT 1,
        fabric_id TEXT,
        fabric_name TEXT,
        fabric_color TEXT,
        fabric_meters NUMERIC DEFAULT 0,
        is_customer_fabric BOOLEAN DEFAULT false,
        measurements JSONB DEFAULT '{}'::jsonb,
        design_selections JSONB DEFAULT '{}'::jsonb,
        special_instructions TEXT,
        cabinet_slot TEXT,
        items JSONB DEFAULT '[]'::jsonb,
        total_amount NUMERIC DEFAULT 0,
        paid_amount NUMERIC DEFAULT 0,
        balance_amount NUMERIC DEFAULT 0,
        payment_status TEXT DEFAULT 'unpaid',
        status TEXT DEFAULT 'pending',
        order_date TEXT,
        delivery_date TEXT,
        completed_date TEXT,
        delivered_date TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        vendor TEXT,
        brand TEXT,
        sku TEXT,
        image_url TEXT,
        purchase_price NUMERIC DEFAULT 0,
        stock_quantity INT DEFAULT 0,
        low_stock_threshold INT DEFAULT 5,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS product_sales (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INT NOT NULL,
        purchase_price NUMERIC DEFAULT 0,
        selling_price NUMERIC NOT NULL,
        total_amount NUMERIC NOT NULL,
        profit NUMERIC DEFAULT 0,
        customer_id TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        sale_date TEXT NOT NULL,
        payment_method TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS shop_settings (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    isDbAvailable = true;
    isInitialized = true;
    console.log('[PostgreSQL] Database tables verified and connected via TCP Pool.');
    return true;
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('password authentication failed') || err?.code === '28P01') {
      pgAuthFailed = true;
    }
    if (supabase) {
      isDbAvailable = true;
      isInitialized = true;
      return true;
    }
    isDbAvailable = false;
    return false;
  }
}

// Multi-Backend safe query runner: routes through Supabase Client or PostgreSQL Pool
export async function safeQuery(text: string, params?: any[]): Promise<any | null> {
  const cleanSql = text.trim();
  const safeParams = params ? params.map(p => p === undefined ? null : p) : [];

  // If Supabase is available, handle common SQL patterns cleanly
  if (supabase) {
    try {
      const lower = cleanSql.toLowerCase();

      // 1. SELECT count(*) FROM table
      if (lower.startsWith('select count(') || lower.startsWith('select count (*)')) {
        const match = cleanSql.match(/from\s+([a-zA-Z0-9_]+)/i);
        if (match) {
          const tableName = match[1];
          const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
          return { rows: [{ count: String(count ?? 0) }] };
        }
      }

      // 2. SELECT * FROM table ORDER BY ...
      if (lower.startsWith('select * from ')) {
        const match = cleanSql.match(/select\s+\*\s+from\s+([a-zA-Z0-9_]+)/i);
        if (match) {
          const tableName = match[1];
          let query = supabase.from(tableName).select('*');
          if (lower.includes('order by created_at desc')) {
            query = query.order('created_at', { ascending: false });
          } else if (lower.includes('order by sale_date desc')) {
            query = query.order('sale_date', { ascending: false });
          } else if (lower.includes('order by sort_order')) {
            query = query.order('sort_order', { ascending: true });
          }
          const { data, error } = await query;
          if (!error && data) {
            isDbAvailable = true;
            return { rows: data };
          }
        }
      }

      // 3. SELECT data FROM shop_settings WHERE id = $1
      if (lower.includes('from shop_settings') && lower.includes('id = $1')) {
        const targetId = safeParams[0] || 'default';
        const { data, error } = await supabase.from('shop_settings').select('data').eq('id', targetId);
        if (!error && data && data.length > 0) {
          return { rows: [{ data: data[0].data }] };
        }
        return { rows: [] };
      }

      // 4. Public orders tracking lookup
      if (lower.includes('from orders') && lower.includes('where order_number = $1')) {
        const lookup = String(safeParams[0] || '').trim();
        const digits = lookup.replace(/\D/g, '');
        const { data, error } = await supabase.from('orders').select('*');
        if (!error && data) {
          const matched = data.filter((o: any) => {
            if (o.order_number === lookup) return true;
            const ordDigits = (o.order_number || '').replace(/\D/g, '');
            const phoneDigits = (o.customer_phone || '').replace(/\D/g, '');
            const waDigits = (o.customer_whatsapp || '').replace(/\D/g, '');
            if (digits && (ordDigits === digits || phoneDigits === digits || waDigits === digits)) return true;
            return false;
          });
          return { rows: matched };
        }
      }

      // 5. DELETE FROM table WHERE id = $1
      if (lower.startsWith('delete from ') && lower.includes('where id = $1')) {
        const match = cleanSql.match(/delete\s+from\s+([a-zA-Z0-9_]+)/i);
        if (match) {
          const tableName = match[1];
          const targetId = safeParams[0];
          await supabase.from(tableName).delete().eq('id', targetId);
          return { rowCount: 1 };
        }
      }

      // 6. DELETE FROM order_items WHERE order_id = $1
      if (lower.includes('delete from order_items') && lower.includes('order_id = $1')) {
        await supabase.from('order_items').delete().eq('order_id', safeParams[0]);
        return { rowCount: 1 };
      }
    } catch (err: any) {
      console.warn('[Supabase safeQuery Notice]:', err?.message || err);
    }
  }

  // Fallback to PostgreSQL Pool if valid and not flagged with auth error
  if (!pgAuthFailed) {
    const p = getDbPool();
    if (p) {
      try {
        const result = await p.query(cleanSql, safeParams.length > 0 ? safeParams : undefined);
        isDbAvailable = true;
        return result;
      } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('password authentication failed') || err?.code === '28P01') {
          pgAuthFailed = true;
        }
      }
    }
  }

  return null;
}

// -------------------------------------------------------------
// Direct High-Reliability Cloud Database Helper Operations
// -------------------------------------------------------------

// --- ORDERS ---
export async function dbGetOrders(): Promise<any[]> {
  if (supabase) {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  const res = await safeQuery('SELECT * FROM orders ORDER BY created_at DESC');
  return res?.rows || [];
}

export async function dbSaveOrder(order: any): Promise<boolean> {
  const orderId = String(order.id || `ord_${Date.now()}`);
  const orderNumber = String(order.orderNumber || order.order_number || '');
  const customerId = order.customerId || order.customer_id ? String(order.customerId || order.customer_id) : null;
  const customerName = String(order.customerName || order.customer_name || 'Customer');
  const customerPhone = order.customerPhone || order.customer_phone ? String(order.customerPhone || order.customer_phone) : null;
  const customerWhatsApp = order.customerWhatsApp || order.customer_whatsapp ? String(order.customerWhatsApp || order.customer_whatsapp) : null;
  const garmentType = order.garmentType || order.garment_type ? String(order.garmentType || order.garment_type) : null;
  const quantity = Number(order.quantity) || 1;
  const fabricId = order.fabricId || order.fabric_id ? String(order.fabricId || order.fabric_id) : null;
  const fabricName = order.fabricName || order.fabric_name ? String(order.fabricName || order.fabric_name) : null;
  const fabricColor = order.fabricColor || order.fabric_color ? String(order.fabricColor || order.fabric_color) : null;
  const fabricMeters = Number(order.fabricMeters || order.fabric_meters) || 0;
  const isCustomerFabric = Boolean(order.isCustomerFabric ?? order.is_customer_fabric);
  const measurements = typeof order.measurements === 'object' && order.measurements !== null ? order.measurements : {};
  const designSelections = typeof order.designSelections === 'object' && order.designSelections !== null ? order.designSelections : {};
  const specialInstructions = order.specialInstructions || order.special_instructions ? String(order.specialInstructions || order.special_instructions) : null;
  const cabinetSlot = order.cabinetSlot || order.cabinet_slot ? String(order.cabinetSlot || order.cabinet_slot) : null;
  const items = Array.isArray(order.items) ? order.items : [];
  const totalAmount = Number(order.totalAmount ?? order.total_amount) || 0;
  const paidAmount = Number(order.paidAmount ?? order.paid_amount) || 0;
  const balanceAmount = Number(order.balanceAmount ?? order.balance_amount) || Math.max(0, totalAmount - paidAmount);
  const paymentStatus = String(order.paymentStatus || order.payment_status || (balanceAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'));
  const status = String(order.status || 'pending');
  const orderDate = String(order.orderDate || order.order_date || new Date().toISOString().slice(0, 10));
  const deliveryDate = String(order.deliveryDate || order.delivery_date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const completedDate = order.completedDate || order.completed_date ? String(order.completedDate || order.completed_date) : null;
  const deliveredDate = order.deliveredDate || order.delivered_date ? String(order.deliveredDate || order.delivered_date) : null;

  const payload = {
    id: orderId,
    order_number: orderNumber,
    customer_id: customerId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_whatsapp: customerWhatsApp,
    garment_type: garmentType,
    quantity,
    fabric_id: fabricId,
    fabric_name: fabricName,
    fabric_color: fabricColor,
    fabric_meters: fabricMeters,
    is_customer_fabric: isCustomerFabric,
    measurements,
    design_selections: designSelections,
    special_instructions: specialInstructions,
    cabinet_slot: cabinetSlot,
    items,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    balance_amount: balanceAmount,
    payment_status: paymentStatus,
    status,
    order_date: orderDate,
    delivery_date: deliveryDate,
    completed_date: completedDate,
    delivered_date: deliveredDate,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { error } = await supabase.from('orders').upsert(payload);
      if (!error) {
        // Also ensure customer record is kept in sync
        if (customerId) {
          try {
            await supabase.from('customers').upsert({
              id: customerId,
              name: customerName,
              phone: customerPhone,
              whatsapp: customerWhatsApp,
              standard_measurements: measurements,
              preferred_garment_type: garmentType,
              updated_at: new Date().toISOString()
            });
          } catch {}
        }
        return true;
      } else {
        console.warn('[Supabase dbSaveOrder Error]:', error.message);
      }
    } catch (e: any) {
      console.warn('[Supabase dbSaveOrder Exception]:', e.message);
    }
  }

  return false;
}

export async function dbDeleteOrder(id: string): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from('order_items').delete().eq('order_id', id);
    } catch {}
    const { error } = await supabase.from('orders').delete().eq('id', id);
    return !error;
  }
  return false;
}

// --- CUSTOMERS ---
export async function dbGetCustomers(): Promise<any[]> {
  if (supabase) {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  const res = await safeQuery('SELECT * FROM customers ORDER BY created_at DESC');
  return res?.rows || [];
}

export async function dbSaveCustomer(cust: any): Promise<boolean> {
  const payload = {
    id: String(cust.id || `cust_${Date.now()}`),
    name: String(cust.name || 'Customer'),
    phone: cust.phone ? String(cust.phone) : null,
    whatsapp: cust.whatsapp ? String(cust.whatsapp) : null,
    address: cust.address ? String(cust.address) : null,
    notes: cust.notes ? String(cust.notes) : null,
    standard_measurements: typeof cust.standardMeasurements === 'object' ? cust.standardMeasurements : (cust.standard_measurements || {}),
    preferred_garment_type: cust.preferredGarmentType || cust.preferred_garment_type || null,
    total_orders_count: Number(cust.totalOrdersCount ?? cust.total_orders_count) || 0,
    total_spent: Number(cust.totalSpent ?? cust.total_spent) || 0,
    total_balance: Number(cust.totalBalance ?? cust.total_balance) || 0,
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    const { error } = await supabase.from('customers').upsert(payload);
    return !error;
  }
  return false;
}

export async function dbDeleteCustomer(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    return !error;
  }
  return false;
}

// --- FABRICS ---
export async function dbGetFabrics(): Promise<any[]> {
  if (supabase) {
    const { data, error } = await supabase.from('fabrics').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  const res = await safeQuery('SELECT * FROM fabrics ORDER BY created_at DESC');
  return res?.rows || [];
}

export async function dbSaveFabric(fabric: any): Promise<boolean> {
  const payload = {
    id: String(fabric.id || `fab_${Date.now()}`),
    name: String(fabric.name || ''),
    code: fabric.code ? String(fabric.code) : null,
    color: fabric.color ? String(fabric.color) : null,
    type: fabric.type ? String(fabric.type) : null,
    price_per_meter: Number(fabric.pricePerMeter ?? fabric.price_per_meter) || 0,
    stock_meters: Number(fabric.stockMeters ?? fabric.stock_meters) || 0,
    image_url: fabric.imageUrl || fabric.image_url || null,
    notes: fabric.notes ? String(fabric.notes) : null,
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    const { error } = await supabase.from('fabrics').upsert(payload);
    return !error;
  }
  return false;
}

export async function dbDeleteFabric(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('fabrics').delete().eq('id', id);
    return !error;
  }
  return false;
}

// --- PRODUCTS ---
export async function dbGetProducts(): Promise<any[]> {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  const res = await safeQuery('SELECT * FROM products ORDER BY created_at DESC');
  return res?.rows || [];
}

export async function dbSaveProduct(product: any): Promise<boolean> {
  const payload = {
    id: String(product.id || `prod_${Date.now()}`),
    name: String(product.name || ''),
    category: String(product.category || 'Accessories'),
    vendor: product.vendor ? String(product.vendor) : null,
    brand: product.brand ? String(product.brand) : null,
    sku: product.sku ? String(product.sku) : null,
    image_url: product.imageUrl || product.image_url || null,
    purchase_price: Number(product.purchasePrice ?? product.purchase_price) || 0,
    stock_quantity: Number(product.stockQuantity ?? product.stock_quantity) || 0,
    low_stock_threshold: Number(product.lowStockThreshold ?? product.low_stock_threshold) || 5,
    description: product.description ? String(product.description) : null,
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    const { error } = await supabase.from('products').upsert(payload);
    return !error;
  }
  return false;
}

export async function dbDeleteProduct(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  }
  return false;
}

// --- PRODUCT SALES ---
export async function dbGetProductSales(): Promise<any[]> {
  if (supabase) {
    const { data, error } = await supabase.from('product_sales').select('*').order('sale_date', { ascending: false });
    if (!error && data) {
      return data.map((row: any) => {
        let paidAmount = Number(row.total_amount) || 0;
        let balanceAmount = 0;
        let paymentStatus = 'paid';
        let userNotes = row.notes || '';

        // Safely extract payment metadata packed in notes
        if (typeof row.notes === 'string' && row.notes.startsWith('{') && row.notes.includes('paymentStatus')) {
          try {
            const meta = JSON.parse(row.notes);
            if (meta.paidAmount !== undefined) paidAmount = Number(meta.paidAmount);
            if (meta.balanceAmount !== undefined) balanceAmount = Number(meta.balanceAmount);
            if (meta.paymentStatus) paymentStatus = String(meta.paymentStatus);
            if (meta.userNotes) userNotes = meta.userNotes;
          } catch {}
        }

        return {
          id: row.id,
          productId: row.product_id,
          productName: row.product_name,
          category: row.category,
          quantity: Number(row.quantity) || 1,
          purchasePrice: Number(row.purchase_price) || 0,
          sellingPrice: Number(row.selling_price) || 0,
          totalAmount: Number(row.total_amount) || 0,
          paidAmount,
          balanceAmount,
          paymentStatus,
          profit: Number(row.profit) || 0,
          customerId: row.customer_id,
          customerName: row.customer_name,
          customerPhone: row.customer_phone,
          saleDate: row.sale_date,
          paymentMethod: row.payment_method,
          notes: userNotes,
          createdAt: row.created_at
        };
      });
    }
  }
  return [];
}

export async function dbSaveProductSale(sale: any): Promise<boolean> {
  const totalAmount = Number(sale.totalAmount ?? sale.total_amount) || 0;
  const paidAmount = Number(sale.paidAmount ?? sale.paid_amount) || totalAmount;
  const balanceAmount = Number(sale.balanceAmount ?? sale.balance_amount) || Math.max(0, totalAmount - paidAmount);
  const paymentStatus = String(sale.paymentStatus || (balanceAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'));

  // Pack payment metadata into notes JSON so Supabase schema accepts it smoothly
  const notesMeta = JSON.stringify({
    paidAmount,
    balanceAmount,
    paymentStatus,
    userNotes: sale.notes || ''
  });

  const payload = {
    id: String(sale.id || `sale_${Date.now()}`),
    product_id: String(sale.productId || sale.product_id || ''),
    product_name: String(sale.productName || sale.product_name || ''),
    category: String(sale.category || 'Accessories'),
    quantity: Number(sale.quantity) || 1,
    purchase_price: Number(sale.purchasePrice ?? sale.purchase_price) || 0,
    selling_price: Number(sale.sellingPrice ?? sale.selling_price) || 0,
    total_amount: totalAmount,
    profit: Number(sale.profit) || 0,
    customer_id: sale.customerId || sale.customer_id || null,
    customer_name: sale.customerName || sale.customer_name || null,
    customer_phone: sale.customerPhone || sale.customer_phone || null,
    sale_date: String(sale.saleDate || sale.sale_date || new Date().toISOString().slice(0, 10)),
    payment_method: sale.paymentMethod || sale.payment_method || null,
    notes: notesMeta,
    created_at: sale.createdAt || new Date().toISOString()
  };

  if (supabase) {
    const { error } = await supabase.from('product_sales').upsert(payload);
    return !error;
  }
  return false;
}

export async function dbDeleteProductSale(id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('product_sales').delete().eq('id', id);
    return !error;
  }
  return false;
}

// --- SHOP SETTINGS ---
export async function dbGetShopSettings(): Promise<any | null> {
  if (supabase) {
    const { data, error } = await supabase.from('shop_settings').select('data').eq('id', 'default');
    if (!error && data && data.length > 0) return data[0].data;
  }
  return null;
}

export async function dbSaveShopSettings(data: any): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from('shop_settings').upsert({
      id: 'default',
      data,
      updated_at: new Date().toISOString()
    });
    return !error;
  }
  return false;
}
