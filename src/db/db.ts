import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;
let isDbAvailable = false;
let dbCheckAttempted = false;

// Database connection configuration
// Handles DATABASE_URL, POSTGRES_URL, or direct pooler settings
export function getDbPool(): pg.Pool | null {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL;

  try {
    if (databaseUrl) {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 10000,
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
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 10000,
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

  try {
    const result = await p.query(text, params);
    isDbAvailable = true;
    return result;
  } catch (err: any) {
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
    `);
    isDbAvailable = true;
    console.log('PostgreSQL database tables verified and connected.');
  } catch (err: any) {
    isDbAvailable = false;
    console.log('PostgreSQL database not available (' + (err?.message || 'connection failed') + '). Falling back to local storage.');
  }
}

