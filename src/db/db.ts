import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;
let currentConnectionString: string | null = null;
let isDbAvailable = false;
let isInitialized = false;

// Database connection configuration
// Handles DATABASE_URL, POSTGRES_URL, or direct pooler settings
export function getDbPool(): pg.Pool | null {
  let rawUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL;
  
  // If no database URL or unconfigured placeholder, operate in local in-memory mode
  if (!rawUrl || rawUrl.includes('<project-ref>') || rawUrl.includes('<url-encoded-database-password>')) {
    if (pool) {
      pool.end().catch(() => {});
      pool = null;
      currentConnectionString = null;
      isDbAvailable = false;
      isInitialized = false;
    }
    return null;
  }

  // If pool exists and connection string is unchanged, reuse it
  if (pool && currentConnectionString === rawUrl) {
    return pool;
  }

  // If connection string changed, dispose old pool
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
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      keepAlive: true,
    });
    currentConnectionString = rawUrl;

    // Attach error listener to prevent uncaught exceptions on idle clients
    pool.on('error', (err) => {
      // Idle client notifications in pooled connections (e.g. PgBouncer/Supabase) are routine disconnects
      console.warn('PostgreSQL idle client notice:', err.message);
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

  if (!isInitialized) {
    await initDatabase().catch(() => {});
  }

  // Convert undefined to null because pg throws an error on undefined parameters
  const safeParams = params ? params.map(p => p === undefined ? null : p) : undefined;

  try {
    const result = await p.query(text, safeParams);
    isDbAvailable = true;
    return result;
  } catch (err: any) {
    console.error('PostgreSQL query notice:', err.message);
    const msg = String(err.message || '').toLowerCase();
    const code = String(err.code || '');
    if (
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === '28P01' ||
      code === '57P01' ||
      code === '57P02' ||
      code === '57P03' ||
      msg.includes('connection terminated') ||
      msg.includes('password authentication failed') ||
      msg.includes('connect econnrefused')
    ) {
      isDbAvailable = false;
    }
    // Do not crash, return null so calling route can fallback to memory cache
    return null;
  }
}

export function isDatabaseConnected(): boolean {
  return isDbAvailable && pool !== null;
}

export async function verifyDbConnection(): Promise<boolean> {
  const p = getDbPool();
  if (!p) return false;
  try {
    await p.query('SELECT 1');
    isDbAvailable = true;
    return true;
  } catch (err: any) {
    console.warn('Database verify connection failed:', err.message);
    isDbAvailable = false;
    return false;
  }
}

// Schema initialization ensuring all tables exist if PostgreSQL is available
export async function initDatabase(): Promise<boolean> {
  if (isInitialized) return true;

  const p = getDbPool();
  if (!p) {
    console.log('Database operating in standalone local mode (no external PostgreSQL configured).');
    return false;
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

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        garment_type TEXT,
        quantity INT DEFAULT 1,
        price_per_unit NUMERIC DEFAULT 0,
        total_price NUMERIC DEFAULT 0,
        measurements JSONB DEFAULT '{}'::jsonb,
        design_selections JSONB DEFAULT '{}'::jsonb,
        fabric_notes TEXT,
        special_instructions TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Ensure non-breaking schema migrations if tables pre-existed
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_meters NUMERIC DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_customer_fabric BOOLEAN DEFAULT false;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cabinet_slot TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_whatsapp TEXT;
      ALTER TABLE orders ALTER COLUMN customer_phone DROP NOT NULL;
      ALTER TABLE orders ALTER COLUMN order_date DROP NOT NULL;
      ALTER TABLE orders ALTER COLUMN delivery_date DROP NOT NULL;
      ALTER TABLE orders ALTER COLUMN garment_type DROP NOT NULL;
      ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;
      ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS code TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
    `);

    // Seed measurement_fields if empty
    const mfCount = await p.query('SELECT COUNT(*) FROM measurement_fields');
    if (parseInt(mfCount.rows[0].count, 10) === 0) {
      const defaultFields = [
        ['m1', 'qad', 'Length (Qad)', 'قد', 'قد', 'in', '40', true, 1],
        ['m2', 'shana', 'Shoulder (Shana)', 'شانه', 'شانه', 'in', '18.5', true, 2],
        ['m3', 'asteen', 'Sleeve (Asteen)', 'آستین', 'آستین', 'in', '23', true, 3],
        ['m4', 'yakhan', 'Collar (Yakhan)', 'یخن', 'یخن', 'in', '16.5', true, 4],
        ['m5', 'chati', 'Chest (Chati)', 'چاتی (سینه)', 'چاتی (سینه)', 'in', '22', true, 5],
        ['m6', 'baghal', 'Armpit (Baghal)', 'بغل', 'بغل', 'in', '21', true, 6],
        ['m7', 'kamar', 'Waist (Kamar)', 'کمر', 'کمر', 'in', '22.5', true, 7],
        ['m8', 'daman', 'Daman (Hem)', 'دامن', 'دامن', 'in', '25', true, 8],
        ['m9', 'tunban', 'Trouser (Tunban)', 'تنبان', 'تنبان / پرتوګ', 'in', '38', true, 9],
        ['m10', 'pacha', 'Bottom (Pacha)', 'پاچه', 'پاچه', 'in', '8.5', true, 10],
        ['m11', 'surin', 'Seat/Hip (Surin)', 'سورین', 'سورین', 'in', '24', true, 11],
        ['m12', 'machDast', 'Wrist (Mach Dast)', 'مچ دست', 'مچ لاس', 'in', '9', false, 12]
      ];
      for (const f of defaultFields) {
        await p.query(`
          INSERT INTO measurement_fields (id, key, label_en, label_fa, label_ps, unit, default_value, is_standard, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING;
        `, f);
      }
    }

    // Seed design_categories if empty
    const dcCount = await p.query('SELECT COUNT(*) FROM design_categories');
    if (parseInt(dcCount.rows[0].count, 10) === 0) {
      const defaultCategories = [
        ['d1', 'yakhanShape', 'Collar Shape / Style', 'شیپ یخن / کالر', 'د یخن ډول / شیپ', JSON.stringify([
          { id: 'o1_1', nameEn: 'Collar (Standard)', nameFa: 'کالر', namePs: 'کالر' },
          { id: 'o1_2', nameEn: 'V-Neck (Haft Ghara)', nameFa: 'هفت غاره', namePs: 'هفت غاړه' },
          { id: 'o1_3', nameEn: 'Mandarin Band (Bayn)', nameFa: 'بین ساده', namePs: 'ساده بین' },
          { id: 'o1_4', nameEn: 'Semi-Collar', nameFa: 'نیم کالر', namePs: 'نیم کالر' },
          { id: 'o1_5', nameEn: 'Sherwani Collar', nameFa: 'شروانی', namePs: 'شرواني یخن' },
          { id: 'o1_6', nameEn: 'Piped Collar (Moghzi)', nameFa: 'مغزی دار', namePs: 'مغزي لرونکی' }
        ])],
        ['d2', 'cuffStyle', 'Sleeve Cuff Style', 'کف یا استین', 'کف یا لستوڼی', JSON.stringify([
          { id: 'o2_1', nameEn: 'Round Cuff (9.25)', nameFa: 'کول کف (9.25)', namePs: 'کول کف (9.25)' },
          { id: 'o2_2', nameEn: 'Cut Cuff', nameFa: 'کټ کف', namePs: 'کټ کف' },
          { id: 'o2_3', nameEn: 'Plain Sleeve (No Cuff)', nameFa: 'استین ساده', namePs: 'ساده لستوڼی' },
          { id: 'o2_4', nameEn: 'Double Button Cuff', nameFa: 'کف دو دکمه', namePs: 'دوه تڼۍ کف' }
        ])],
        ['d3', 'damanStyle', 'Daman Style (Hem)', 'شیپ دامن', 'د دامن ډول', JSON.stringify([
          { id: 'o3_1', nameEn: 'Round Daman (Kol)', nameFa: 'کول دامن', namePs: 'ګرد دامن' },
          { id: 'o3_2', nameEn: 'Square / Straight Daman (Chakor)', nameFa: 'چوکات / مستقیم دامن', namePs: 'چوکات دامن' },
          { id: 'o3_3', nameEn: 'Double Border Daman', nameFa: 'دامن دو پله', namePs: 'دوه پله دامن' }
        ])],
        ['d4', 'pocketStyle', 'Pocket Configuration', 'جیب‌ها', 'جیبونه', JSON.stringify([
          { id: 'o4_1', nameEn: 'Two Side + One Front', nameFa: 'دو جیب بغل + یک جیب رو', namePs: 'دوه بغل + یو مخ جیب' },
          { id: 'o4_2', nameEn: 'Two Side Pockets Only', nameFa: 'فقط دو جیب بغل', namePs: 'یوازې دوه بغل جیبونه' },
          { id: 'o4_3', nameEn: 'One Side + One Front', nameFa: 'یک جیب بغل + یک جیب رو', namePs: 'یو بغل + یو مخ جیب' },
          { id: 'o4_4', nameEn: 'Trouser Pocket (Jib Tunban)', nameFa: 'همراه با جیب تنبان', namePs: 'د پرتوګ له جیب سره' }
        ])]
      ];
      for (const c of defaultCategories) {
        await p.query(`
          INSERT INTO design_categories (id, key, title_en, title_fa, title_ps, options)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
          ON CONFLICT (id) DO NOTHING;
        `, c);
      }
    }

    // Seed demo orders if orders table is currently empty
    const ordersCount = await p.query('SELECT COUNT(*) FROM orders');
    if (parseInt(ordersCount.rows[0].count, 10) === 0) {
      const demoOrders = [
        {
          id: 'ord_1',
          order_number: 'MA-0001',
          customer_id: 'cust_1',
          customer_name: 'فرهاد',
          customer_phone: '0765445309',
          customer_whatsapp: '0765445309',
          garment_type: 'پیراهن و تنبان (Perahan Tunban)',
          quantity: 1,
          fabric_id: 'fab_1',
          fabric_name: 'لته سفید اعلا (Classic White Latha)',
          fabric_color: 'سفید / White',
          fabric_meters: 4,
          is_customer_fabric: false,
          measurements: JSON.stringify({ qad: '40', shana: '19.5', asteen: '21', yakhan: '16.75', chati: '23.5', baghal: '23.5', kamar: '24', daman: '25', tunban: '37.5', pacha: '8' }),
          design_selections: JSON.stringify({ yakhanShape: 'کالر', cuffStyle: 'کول کف (9.25)', damanStyle: 'کول دامن', pocketStyle: 'دو جیب بغل + یک جیب رو' }),
          special_instructions: 'کالر یی 1.75 راشی',
          cabinet_slot: 'A-01',
          total_amount: 1800,
          paid_amount: 1800,
          balance_amount: 0,
          payment_status: 'paid',
          status: 'ready',
          order_date: '2026-08-23',
          delivery_date: '2026-08-28'
        },
        {
          id: 'ord_2',
          order_number: 'MA-0002',
          customer_id: 'cust_2',
          customer_name: 'شکیل خان',
          customer_phone: '0782930005',
          customer_whatsapp: '0782930005',
          garment_type: 'پیراهن و تنبان (Perahan Tunban)',
          quantity: 1,
          fabric_id: 'fab_2',
          fabric_name: 'ابریشم بوسکی کرمی (Silk Boski Cream)',
          fabric_color: 'کرمی / Off-White',
          fabric_meters: 4,
          is_customer_fabric: false,
          measurements: JSON.stringify({ qad: '26.75', shana: '16.25', asteen: '17', yakhan: '17', chati: '39.5', kamar: '36.25', surin: '40' }),
          design_selections: JSON.stringify({ yakhanShape: 'هفت غاره' }),
          special_instructions: 'دوخت دقیق و نرم',
          cabinet_slot: 'B-04',
          total_amount: 1600,
          paid_amount: 1600,
          balance_amount: 0,
          payment_status: 'paid',
          status: 'in_progress',
          order_date: '2026-08-23',
          delivery_date: '2026-08-29'
        },
        {
          id: 'ord_3',
          order_number: 'MA-0003',
          customer_id: 'cust_3',
          customer_name: 'حاجی بشیر احمد',
          customer_phone: '0700223344',
          customer_whatsapp: '0700223344',
          garment_type: 'واسکټ / Wescott',
          quantity: 1,
          fabric_id: 'fab_3',
          fabric_name: 'پشم کشمیر سرمه‌ای',
          fabric_color: 'سرمه‌ای / Navy',
          fabric_meters: 1.5,
          is_customer_fabric: false,
          measurements: JSON.stringify({ wescott_qad: '27', wescott_shana: '17', wescott_chati: '40', wescott_kamar: '38' }),
          design_selections: JSON.stringify({ pocketStyle: 'دو جیب بغل' }),
          special_instructions: 'دکمه های برنجی طلایی',
          cabinet_slot: 'C-08',
          total_amount: 2200,
          paid_amount: 1000,
          balance_amount: 1200,
          payment_status: 'partial',
          status: 'pending',
          order_date: '2026-09-01',
          delivery_date: '2026-09-08'
        }
      ];

      for (const ord of demoOrders) {
        await p.query(`
          INSERT INTO orders (
            id, order_number, customer_id, customer_name, customer_phone, customer_whatsapp,
            garment_type, quantity, fabric_id, fabric_name, fabric_color, fabric_meters,
            is_customer_fabric, measurements, design_selections, special_instructions,
            cabinet_slot, total_amount, paid_amount, balance_amount, payment_status,
            status, order_date, delivery_date, items, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16, $17, $18, $19, $20, $21, $22, $23, $24, '[]'::jsonb, NOW(), NOW()
          ) ON CONFLICT (id) DO NOTHING;
        `, [
          ord.id, ord.order_number, ord.customer_id, ord.customer_name, ord.customer_phone, ord.customer_whatsapp,
          ord.garment_type, ord.quantity, ord.fabric_id, ord.fabric_name, ord.fabric_color, ord.fabric_meters,
          ord.is_customer_fabric, ord.measurements, ord.design_selections, ord.special_instructions,
          ord.cabinet_slot, ord.total_amount, ord.paid_amount, ord.balance_amount, ord.payment_status,
          ord.status, ord.order_date, ord.delivery_date
        ]);

        // Also ensure customer exists
        await p.query(`
          INSERT INTO customers (
            id, name, phone, whatsapp, standard_measurements, preferred_garment_type, total_orders_count, total_spent, total_balance, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5::jsonb, $6, 1, $7, $8, NOW(), NOW()
          ) ON CONFLICT (id) DO NOTHING;
        `, [
          ord.customer_id, ord.customer_name, ord.customer_phone, ord.customer_whatsapp,
          ord.measurements, ord.garment_type, ord.total_amount, ord.balance_amount
        ]);
      }
    }
    isDbAvailable = true;
    isInitialized = true;
    console.log('PostgreSQL database tables verified and connected.');
    return true;
  } catch (err: any) {
    isDbAvailable = false;
    console.warn('PostgreSQL database not available (' + (err?.message || 'connection failed') + '). Falling back to local storage.');
    return false;
  }
}
