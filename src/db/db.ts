import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;
let isDbAvailable = false;
let dbCheckAttempted = false;

// Database connection configuration
// Handles DATABASE_URL, POSTGRES_URL, or direct pooler settings
const DEFAULT_USER_SUPABASE_URL = 'postgresql://postgres.ubllqqimhdkubpqpbyvk:Rayantailor999@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

export function getDbPool(): pg.Pool | null {
  if (pool) return pool;

  let rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL;
  
  // If the environment contains an unconfigured placeholder like '<project-ref>', fallback to user's real Supabase URL
  if (!rawUrl || rawUrl.includes('<project-ref>') || rawUrl.includes('<url-encoded-database-password>')) {
    rawUrl = DEFAULT_USER_SUPABASE_URL;
  }

  try {
    if (rawUrl) {
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
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 10000,
        keepAlive: true,
      });
    } else if (process.env.DB_PASSWORD && process.env.DB_HOST) {
      pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'postgres',
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 10000,
        keepAlive: true,
      });
    } else {
      // No explicit credentials configured - skip database pool to avoid unneeded connection errors
      return null;
    }

    // Attach error listener to prevent uncaught exceptions on idle clients
    pool.on('error', (err) => {
      console.warn('PostgreSQL idle client notice:', err.message);
      isDbAvailable = false;
    });

    return pool;
  } catch (err: any) {
    console.warn('Database pool setup notice:', err?.message || err);
    return null;
  }
}

// Safe query runner that gracefully fails when DB is offline or credentials fail
export async function safeQuery(text: string, params?: any[]): Promise<any | null> {
  const p = getDbPool();
  if (!p) return null;

  // Convert undefined to null because pg throws an error on undefined parameters
  const safeParams = params ? params.map(p => p === undefined ? null : p) : undefined;

  try {
    const result = await p.query(text, safeParams);
    isDbAvailable = true;
    return result;
  } catch (err: any) {
    console.error('safeQuery error:', err.message, '\nQuery:', text, '\nParams:', safeParams);
    isDbAvailable = false;
    // Do not crash, return null so calling route can fallback to memory cache
    return null;
  }
}

export function isDatabaseConnected(): boolean {
  return isDbAvailable;
}

// Schema initialization ensuring all tables exist if PostgreSQL is available
export async function initDatabase() {
  if (dbCheckAttempted) return;
  dbCheckAttempted = true;

  const p = getDbPool();
  if (!p) {
    console.log('Database operating in standalone local mode (no external PostgreSQL configured).');
    return;
  }

  try {
    const res = await p.query(`
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
        phone TEXT NOT NULL,
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
        customer_phone TEXT NOT NULL,
        customer_whatsapp TEXT,
        garment_type TEXT NOT NULL,
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
        total_amount NUMERIC DEFAULT 0,
        paid_amount NUMERIC DEFAULT 0,
        balance_amount NUMERIC DEFAULT 0,
        payment_status TEXT DEFAULT 'unpaid',
        status TEXT DEFAULT 'pending',
        order_date TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        completed_date TEXT,
        delivered_date TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS measurement_fields (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        label_en TEXT NOT NULL,
        label_fa TEXT NOT NULL,
        label_ps TEXT NOT NULL,
        unit TEXT DEFAULT 'in',
        default_value TEXT,
        is_standard BOOLEAN DEFAULT true,
        sort_order INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS design_categories (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_fa TEXT NOT NULL,
        title_ps TEXT NOT NULL,
        options JSONB DEFAULT '[]'::jsonb
      );

      CREATE TABLE IF NOT EXISTS shop_settings (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
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

      -- Ensure non-breaking schema migrations if tables pre-existed
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_meters NUMERIC DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_customer_fabric BOOLEAN DEFAULT false;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cabinet_slot TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT;
      ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS code TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
    `);
    isDbAvailable = true;
    console.log('PostgreSQL database tables verified and connected.');
  } catch (err: any) {
    isDbAvailable = false;
    console.log('PostgreSQL database not available (' + (err?.message || 'connection failed') + '). Falling back to local storage.');
  }
}
