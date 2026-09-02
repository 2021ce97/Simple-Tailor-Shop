import pg from 'pg';
const { Pool } = pg;

// Notice Simpletailor@123 needs proper handling or explicit object config
async function test() {
  console.log('Testing Supabase direct pooler connection...');
  
  const pool = new Pool({
    user: 'postgres.ubllqqimhdkubpqpbyvk',
    password: 'Simpletailor@123',
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const res = await pool.query('SELECT current_database(), current_user, now();');
    console.log('Connected successfully!', res.rows);

    // Let's create all tables in public schema
    await pool.query(`
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

      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'admin'
      );
    `);

    console.log('Tables created successfully in Supabase public schema!');

    // Let's seed demo fabrics if empty
    const fabricCount = await pool.query('SELECT count(*) FROM fabrics');
    console.log('Current fabrics count:', fabricCount.rows[0].count);
    if (parseInt(fabricCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO fabrics (id, name, code, color, type, price_per_meter, stock_meters, notes)
        VALUES 
          ('fab_1', 'Latha White Classic', 'FAB-001', 'White', 'Cotton Latha (سفید لته)', 450, 65, 'Premium smooth white Afghan latha cotton'),
          ('fab_2', 'Silk Boski Cream', 'FAB-002', 'Cream / Off-white', 'Boski Silk (بوسکی)', 850, 42, 'Original Pakistani Boski silk - very soft'),
          ('fab_3', 'Charcoal Wool Suiting', 'FAB-003', 'Dark Charcoal', 'Wool Blend (پشم / واسکتی)', 1100, 28, 'Ideal for warm winter Perahan Tunban & Waistcoats'),
          ('fab_4', 'Sky Blue Wash & Wear', 'FAB-004', 'Sky Blue', 'Wash & Wear (واش این ویر آبی)', 550, 50, 'Wrinkle free light summer fabric'),
          ('fab_5', 'Black Velvet (Makhimal)', 'FAB-005', 'Deep Black', 'Velvet (مخمل سیاه)', 1200, 18, 'Luxury velvet for Waistcoat and wedding vests')
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('Seeded sample fabrics!');
    }

    // List all public tables
    const tableList = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Public tables in Supabase:', tableList.rows.map(r => r.table_name));

  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
  }
}

test();
