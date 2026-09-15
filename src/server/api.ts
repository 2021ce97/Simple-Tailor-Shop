import express, { Router, Request, Response } from 'express';
import { safeQuery, isDatabaseConnected, verifyDbConnection } from '../db/db.js';
import { 
  DEFAULT_MEASUREMENT_FIELDS, 
  DEFAULT_DESIGN_CATEGORIES, 
  DEFAULT_SHOP_SETTINGS 
} from '../services/storage.js';

export const apiRouter = Router();

// In-memory fallback stores
let inMemoryFabrics: any[] = [];
let inMemoryProducts: any[] = [];
let inMemoryProductSales: any[] = [];
let inMemoryOrders: any[] = [];
let inMemoryCustomers: any[] = [];
let inMemorySettings: any = { ...DEFAULT_SHOP_SETTINGS };
let inMemoryMeasurementFields: any[] = [...DEFAULT_MEASUREMENT_FIELDS];
let inMemoryDesignCategories: any[] = [...DEFAULT_DESIGN_CATEGORIES];

// Health check endpoint
apiRouter.get('/health', async (req: Request, res: Response) => {
  const isConnected = await verifyDbConnection();
  const dbOrdersCountRes = isConnected ? await safeQuery('SELECT count(*) FROM orders') : null;
  const dbCustomersCountRes = isConnected ? await safeQuery('SELECT count(*) FROM customers') : null;
  const dbFabricsCountRes = isConnected ? await safeQuery('SELECT count(*) FROM fabrics') : null;

  const dbOrdersCount = dbOrdersCountRes?.rows?.[0]?.count ? parseInt(dbOrdersCountRes.rows[0].count, 10) : inMemoryOrders.length;
  const dbCustomersCount = dbCustomersCountRes?.rows?.[0]?.count ? parseInt(dbCustomersCountRes.rows[0].count, 10) : inMemoryCustomers.length;
  const dbFabricsCount = dbFabricsCountRes?.rows?.[0]?.count ? parseInt(dbFabricsCountRes.rows[0].count, 10) : inMemoryFabrics.length;

  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    database: isConnected ? 'PostgreSQL Connected' : 'Local / Offline Sync Mode',
    ordersCount: dbOrdersCount,
    customersCount: dbCustomersCount,
    fabricsCount: dbFabricsCount
  });
});

// Public tracking endpoint. It intentionally exposes no customer contact,
// measurements, payment data, internal notes, or shop inventory.
apiRouter.get('/public/orders', async (req: Request, res: Response) => {
  const lookup = String(req.query.lookup || '').trim();
  if (!lookup) {
    return res.status(400).json({ error: 'Order ID or contact number is required' });
  }

  const result = await safeQuery(`
    SELECT order_number, garment_type, quantity, status, order_date, delivery_date,
           completed_date, delivered_date
    FROM orders
    WHERE order_number = $1
       OR regexp_replace(COALESCE(order_number, ''), '\\D', '', 'g') = regexp_replace($1, '\\D', '', 'g')
       OR regexp_replace(COALESCE(customer_phone, ''), '\\D', '', 'g') = regexp_replace($1, '\\D', '', 'g')
       OR regexp_replace(COALESCE(customer_whatsapp, ''), '\\D', '', 'g') = regexp_replace($1, '\\D', '', 'g')
    ORDER BY created_at DESC
  `, [lookup]);

  const databaseOrders = result?.rows || [];
  const normalizedLookup = lookup.replace(/\D/g, '');
  const memoryOrders = inMemoryOrders.filter(item =>
    item.orderNumber === lookup ||
    String(item.orderNumber || '').replace(/\D/g, '') === normalizedLookup ||
    String(item.customerPhone || '').replace(/\D/g, '') === normalizedLookup ||
    String(item.customerWhatsApp || '').replace(/\D/g, '') === normalizedLookup
  );
  const sourceOrders = databaseOrders.length > 0 ? databaseOrders : memoryOrders;
  if (sourceOrders.length === 0) {
    return res.status(404).json({ error: 'No order was found for this Order ID or contact' });
  }

  return res.json({ orders: sourceOrders.map((order: any) => ({
    orderNumber: order.order_number || order.orderNumber,
    garmentType: order.garment_type || order.garmentType,
    quantity: order.quantity,
    status: order.status,
    orderDate: order.order_date || order.orderDate,
    deliveryDate: order.delivery_date || order.deliveryDate,
    completedDate: order.completed_date || order.completedDate || null,
    deliveredDate: order.delivered_date || order.deliveredDate || null,
  })) });
});

apiRouter.get('/public/orders/:orderNumber', async (req: Request, res: Response) => {
  const orderNumber = String(req.params.orderNumber || '').trim();
  if (!orderNumber) {
    return res.status(400).json({ error: 'Cloth ID is required' });
  }

  const result = await safeQuery(`
    SELECT order_number, garment_type, quantity, status, order_date, delivery_date,
           completed_date, delivered_date
    FROM orders
    WHERE order_number = $1
       OR regexp_replace(COALESCE(order_number, ''), '\\D', '', 'g') = regexp_replace($1, '\\D', '', 'g')
    LIMIT 1
  `, [orderNumber]);

  const databaseOrder = result?.rows?.[0];
  const normalizedOrderNumber = orderNumber.replace(/\D/g, '');
  const order = databaseOrder || inMemoryOrders.find(item =>
    item.orderNumber === orderNumber || String(item.orderNumber || '').replace(/\D/g, '') === normalizedOrderNumber
  );
  if (!order) {
    return res.status(404).json({ error: 'No cloth order was found for this ID' });
  }

  return res.json({
    orderNumber: order.order_number || order.orderNumber,
    garmentType: order.garment_type || order.garmentType,
    quantity: order.quantity,
    status: order.status,
    orderDate: order.order_date || order.orderDate,
    deliveryDate: order.delivery_date || order.deliveryDate,
    completedDate: order.completed_date || order.completedDate || null,
    deliveredDate: order.delivered_date || order.deliveredDate || null,
  });
});

// --- FABRICS ---
apiRouter.get('/fabrics', async (req: Request, res: Response) => {
  const result = await safeQuery('SELECT * FROM fabrics ORDER BY created_at DESC');
  if (result && result.rows) {
    const fabrics = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      color: row.color,
      type: row.type,
      pricePerMeter: parseFloat(row.price_per_meter) || 0,
      stockMeters: parseFloat(row.stock_meters) || 0,
      imageUrl: row.image_url,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    inMemoryFabrics = fabrics;
    return res.json(fabrics);
  }
  res.json(inMemoryFabrics);
});

apiRouter.post('/fabrics', async (req: Request, res: Response) => {
  const fabric = req.body;
  if (!fabric || !fabric.id) {
    return res.status(400).json({ error: 'Fabric data with id is required' });
  }

  // Update in-memory
  const idx = inMemoryFabrics.findIndex(f => f.id === fabric.id);
  if (idx >= 0) {
    inMemoryFabrics[idx] = { ...fabric, updatedAt: new Date().toISOString() };
  } else {
    inMemoryFabrics.unshift({ ...fabric, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  // Persist to PostgreSQL if connected
  await safeQuery(`
    INSERT INTO fabrics (id, name, code, color, type, price_per_meter, stock_meters, image_url, notes, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      code = EXCLUDED.code,
      color = EXCLUDED.color,
      type = EXCLUDED.type,
      price_per_meter = EXCLUDED.price_per_meter,
      stock_meters = EXCLUDED.stock_meters,
      image_url = EXCLUDED.image_url,
      notes = EXCLUDED.notes,
      updated_at = NOW();
  `, [
    fabric.id, fabric.name, fabric.code, fabric.color, fabric.type, 
    fabric.pricePerMeter || 0, fabric.stockMeters || 0, fabric.imageUrl, fabric.notes
  ]);

  res.json({ success: true, fabric });
});

apiRouter.delete('/fabrics/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  inMemoryFabrics = inMemoryFabrics.filter(f => f.id !== id);
  await safeQuery('DELETE FROM fabrics WHERE id = $1', [id]);
  res.json({ success: true });
});

// --- ORDERS ---
apiRouter.get('/orders', async (req: Request, res: Response) => {
  const result = await safeQuery('SELECT * FROM orders ORDER BY created_at DESC');
  if (result && result.rows) {
    const orders = result.rows.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerWhatsApp: row.customer_whatsapp,
      garmentType: row.garment_type,
      quantity: row.quantity,
      fabricId: row.fabric_id,
      fabricName: row.fabric_name,
      fabricColor: row.fabric_color,
      fabricMeters: parseFloat(row.fabric_meters) || 0,
      isCustomerFabric: row.is_customer_fabric,
      measurements: row.measurements || {},
      designSelections: row.design_selections || {},
      specialInstructions: row.special_instructions,
      totalAmount: parseFloat(row.total_amount) || 0,
      paidAmount: parseFloat(row.paid_amount) || 0,
      balanceAmount: parseFloat(row.balance_amount) || 0,
      paymentStatus: row.payment_status,
      status: row.status,
      orderDate: row.order_date,
      deliveryDate: row.delivery_date,
      completedDate: row.completed_date,
      deliveredDate: row.delivered_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    inMemoryOrders = orders;
    return res.json(orders);
  }
  res.json(inMemoryOrders);
});

// Database order saver helper
async function saveOrderToDb(order: any): Promise<boolean> {
  if (!order || !order.id) return false;

  const orderId = String(order.id);
  const orderNumber = String(order.orderNumber || 'ORD-' + Math.floor(1000 + Math.random() * 9000));
  const customerId = order.customerId ? String(order.customerId) : null;
  const customerName = String(order.customerName || 'مشتری').trim();
  const customerPhone = String(order.customerPhone || '').trim();
  const customerWhatsApp = String(order.customerWhatsApp || customerPhone).trim();
  const garmentType = String(order.garmentType || 'perahanTunban');
  const quantity = Number(order.quantity) || 1;
  const fabricId = order.fabricId ? String(order.fabricId) : null;
  const fabricName = order.fabricName ? String(order.fabricName) : null;
  const fabricColor = order.fabricColor ? String(order.fabricColor) : null;
  const fabricMeters = Number(order.fabricMeters) || 0;
  const isCustomerFabric = Boolean(order.isCustomerFabric);

  let measurementsJson: string;
  try {
    measurementsJson = typeof order.measurements === 'string'
      ? order.measurements
      : JSON.stringify(order.measurements || {});
  } catch {
    measurementsJson = '{}';
  }

  let designSelectionsJson: string;
  try {
    designSelectionsJson = typeof order.designSelections === 'string'
      ? order.designSelections
      : JSON.stringify(order.designSelections || {});
  } catch {
    designSelectionsJson = '{}';
  }

  const specialInstructions = order.specialInstructions ? String(order.specialInstructions) : null;
  const cabinetSlot = order.cabinetSlot ? String(order.cabinetSlot) : null;
  const totalAmount = Number(order.totalAmount) || 0;
  const paidAmount = Number(order.paidAmount) || 0;
  const balanceAmount = Number(order.balanceAmount) || Math.max(0, totalAmount - paidAmount);
  const paymentStatus = String(order.paymentStatus || (balanceAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'));
  const status = String(order.status || 'pending');
  const orderDate = String(order.orderDate || new Date().toISOString().slice(0, 10));
  const deliveryDate = String(order.deliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const completedDate = order.completedDate ? String(order.completedDate) : null;
  const deliveredDate = order.deliveredDate ? String(order.deliveredDate) : null;

  const result = await safeQuery(`
    INSERT INTO orders (
      id, order_number, customer_id, customer_name, customer_phone, customer_whatsapp,
      garment_type, quantity, fabric_id, fabric_name, fabric_color, fabric_meters,
      is_customer_fabric, measurements, design_selections, special_instructions,
      cabinet_slot, total_amount, paid_amount, balance_amount, payment_status,
      status, order_date, delivery_date, completed_date, delivered_date, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      order_number = EXCLUDED.order_number,
      customer_id = EXCLUDED.customer_id,
      customer_name = EXCLUDED.customer_name,
      customer_phone = EXCLUDED.customer_phone,
      customer_whatsapp = EXCLUDED.customer_whatsapp,
      garment_type = EXCLUDED.garment_type,
      quantity = EXCLUDED.quantity,
      fabric_id = EXCLUDED.fabric_id,
      fabric_name = EXCLUDED.fabric_name,
      fabric_color = EXCLUDED.fabric_color,
      fabric_meters = EXCLUDED.fabric_meters,
      is_customer_fabric = EXCLUDED.is_customer_fabric,
      measurements = EXCLUDED.measurements,
      design_selections = EXCLUDED.design_selections,
      special_instructions = EXCLUDED.special_instructions,
      cabinet_slot = EXCLUDED.cabinet_slot,
      total_amount = EXCLUDED.total_amount,
      paid_amount = EXCLUDED.paid_amount,
      balance_amount = EXCLUDED.balance_amount,
      payment_status = EXCLUDED.payment_status,
      status = EXCLUDED.status,
      order_date = EXCLUDED.order_date,
      delivery_date = EXCLUDED.delivery_date,
      completed_date = EXCLUDED.completed_date,
      delivered_date = EXCLUDED.delivered_date,
      updated_at = NOW();
  `, [
    orderId, orderNumber, customerId, customerName, customerPhone, customerWhatsApp,
    garmentType, quantity, fabricId, fabricName, fabricColor, fabricMeters,
    isCustomerFabric, measurementsJson, designSelectionsJson, specialInstructions,
    cabinetSlot, totalAmount, paidAmount, balanceAmount, paymentStatus,
    status, orderDate, deliveryDate, completedDate, deliveredDate
  ]);

  if (customerName) {
    const custId = customerId || 'cust_' + (customerPhone ? customerPhone.replace(/\D/g, '') : Date.now());
    await safeQuery(`
      INSERT INTO customers (id, name, phone, whatsapp, preferred_garment_type, total_orders_count, total_spent, total_balance, updated_at)
      VALUES ($1, $2, $3, $4, $5, 1, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE customers.phone END,
        whatsapp = EXCLUDED.whatsapp,
        total_orders_count = customers.total_orders_count + 1,
        total_spent = customers.total_spent + EXCLUDED.total_spent,
        total_balance = customers.total_balance + EXCLUDED.total_balance,
        updated_at = NOW();
    `, [
      custId, customerName, customerPhone, customerWhatsApp, garmentType, totalAmount, balanceAmount
    ]);
  }

  return result !== null;
}

apiRouter.post('/orders', async (req: Request, res: Response) => {
  const order = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: 'Order data with id is required' });
  }

  // Update in-memory
  const idx = inMemoryOrders.findIndex(o => o.id === order.id);
  if (idx >= 0) {
    inMemoryOrders[idx] = { ...order, updatedAt: new Date().toISOString() };
  } else {
    inMemoryOrders.unshift({ ...order, createdAt: order.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  // Persist to PostgreSQL
  const persisted = await saveOrderToDb(order);
  res.json({ success: true, order, persistedToDb: persisted });
});

// Dedicated Batch & Realtime Sync endpoint
apiRouter.post('/sync/all', async (req: Request, res: Response) => {
  const { orders = [], customers = [] } = req.body;

  let syncedOrdersCount = 0;
  if (Array.isArray(orders) && orders.length > 0) {
    for (const ord of orders) {
      if (ord && ord.id) {
        const ok = await saveOrderToDb(ord);
        if (ok) syncedOrdersCount++;
      }
    }
  }

  // Also upsert any incoming customers
  if (Array.isArray(customers) && customers.length > 0) {
    for (const c of customers) {
      if (c && c.id && c.name) {
        await safeQuery(`
          INSERT INTO customers (id, name, phone, whatsapp, address, notes, standard_measurements, preferred_garment_type, total_orders_count, total_spent, total_balance, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            whatsapp = EXCLUDED.whatsapp,
            address = EXCLUDED.address,
            notes = EXCLUDED.notes,
            standard_measurements = EXCLUDED.standard_measurements,
            preferred_garment_type = EXCLUDED.preferred_garment_type,
            updated_at = NOW();
        `, [
          c.id, c.name, c.phone || '', c.whatsapp || '', c.address || '', c.notes || '',
          typeof c.standardMeasurements === 'string' ? c.standardMeasurements : JSON.stringify(c.standardMeasurements || {}),
          c.preferredGarmentType || null, c.totalOrdersCount || 0, c.totalSpent || 0, c.totalBalance || 0
        ]);
      }
    }
  }

  // Query fresh consolidated orders directly from PostgreSQL
  const result = await safeQuery('SELECT * FROM orders ORDER BY created_at DESC');
  if (result && result.rows) {
    inMemoryOrders = result.rows.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerWhatsApp: row.customer_whatsapp,
      garmentType: row.garment_type,
      quantity: row.quantity,
      fabricId: row.fabric_id,
      fabricName: row.fabric_name,
      fabricColor: row.fabric_color,
      fabricMeters: parseFloat(row.fabric_meters) || 0,
      isCustomerFabric: row.is_customer_fabric,
      measurements: row.measurements || {},
      designSelections: row.design_selections || {},
      specialInstructions: row.special_instructions,
      cabinetSlot: row.cabinet_slot,
      totalAmount: parseFloat(row.total_amount) || 0,
      paidAmount: parseFloat(row.paid_amount) || 0,
      balanceAmount: parseFloat(row.balance_amount) || 0,
      paymentStatus: row.payment_status,
      status: row.status,
      orderDate: row.order_date,
      deliveryDate: row.delivery_date,
      completedDate: row.completed_date,
      deliveredDate: row.delivered_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  res.json({
    success: true,
    syncedOrdersCount,
    orders: inMemoryOrders,
    database: isDatabaseConnected() ? 'PostgreSQL Connected' : 'Local Mode'
  });
});

apiRouter.delete('/orders/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  inMemoryOrders = inMemoryOrders.filter(o => o.id !== id);
  await safeQuery('DELETE FROM orders WHERE id = $1', [id]);
  res.json({ success: true });
});

// --- CUSTOMERS ---
apiRouter.get('/customers', async (req: Request, res: Response) => {
  const result = await safeQuery('SELECT * FROM customers ORDER BY created_at DESC');
  if (result && result.rows) {
    const customers = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      whatsapp: row.whatsapp,
      address: row.address,
      notes: row.notes,
      standardMeasurements: row.standard_measurements || {},
      preferredGarmentType: row.preferred_garment_type,
      totalOrdersCount: row.total_orders_count || 0,
      totalSpent: parseFloat(row.total_spent) || 0,
      totalBalance: parseFloat(row.total_balance) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    inMemoryCustomers = customers;
    return res.json(customers);
  }
  res.json(inMemoryCustomers);
});

apiRouter.post('/customers', async (req: Request, res: Response) => {
  const customer = req.body;
  if (!customer || !customer.id) {
    return res.status(400).json({ error: 'Customer data with id is required' });
  }

  // Update in-memory
  const idx = inMemoryCustomers.findIndex(c => c.id === customer.id);
  if (idx >= 0) {
    inMemoryCustomers[idx] = { ...customer, updatedAt: new Date().toISOString() };
  } else {
    inMemoryCustomers.unshift({ ...customer, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  // Persist to PostgreSQL if connected
  await safeQuery(`
    INSERT INTO customers (
      id, name, phone, whatsapp, address, notes, standard_measurements,
      preferred_garment_type, total_orders_count, total_spent, total_balance, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      whatsapp = EXCLUDED.whatsapp,
      address = EXCLUDED.address,
      notes = EXCLUDED.notes,
      standard_measurements = EXCLUDED.standard_measurements,
      preferred_garment_type = EXCLUDED.preferred_garment_type,
      total_orders_count = EXCLUDED.total_orders_count,
      total_spent = EXCLUDED.total_spent,
      total_balance = EXCLUDED.total_balance,
      updated_at = NOW();
  `, [
    customer.id, customer.name, customer.phone, customer.whatsapp, customer.address, customer.notes,
    JSON.stringify(customer.standardMeasurements || {}), customer.preferredGarmentType,
    customer.totalOrdersCount || 0, customer.totalSpent || 0, customer.totalBalance || 0
  ]);

  res.json({ success: true, customer });
});

apiRouter.delete('/customers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  inMemoryCustomers = inMemoryCustomers.filter(c => c.id !== id);
  await safeQuery('DELETE FROM customers WHERE id = $1', [id]);
  res.json({ success: true });
});

// --- SHOP SETTINGS ---
apiRouter.get('/shop-settings', async (req: Request, res: Response) => {
  const result = await safeQuery('SELECT data FROM shop_settings WHERE id = $1', ['default']);
  if (result && result.rows && result.rows.length > 0) {
    inMemorySettings = result.rows[0].data;
    return res.json(inMemorySettings);
  }
  res.json(inMemorySettings);
});

apiRouter.post('/shop-settings', async (req: Request, res: Response) => {
  const settings = req.body;
  inMemorySettings = settings;

  await safeQuery(`
    INSERT INTO shop_settings (id, data, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = NOW();
  `, ['default', JSON.stringify(settings)]);

  res.json({ success: true, settings });
});

// --- MEASUREMENT FIELDS ---
apiRouter.get('/measurement-fields', async (req: Request, res: Response) => {
  const result = await safeQuery('SELECT * FROM measurement_fields ORDER BY sort_order, id');
  if (result?.rows) {
    inMemoryMeasurementFields = result.rows.map((row: any) => ({
      id: row.id,
      key: row.key,
      labelEn: row.label_en,
      labelFa: row.label_fa,
      labelPs: row.label_ps,
      unit: row.unit,
      defaultValue: row.default_value,
      isStandard: row.is_standard,
      sortOrder: row.sort_order,
    }));
  }
  res.json(inMemoryMeasurementFields);
});

apiRouter.post('/measurement-fields', async (req: Request, res: Response) => {
  const fields = Array.isArray(req.body) ? req.body : [];
  inMemoryMeasurementFields = fields;
  for (const field of fields) {
    await safeQuery(`
      INSERT INTO measurement_fields (id, key, label_en, label_fa, label_ps, unit, default_value, is_standard, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        key = EXCLUDED.key, label_en = EXCLUDED.label_en, label_fa = EXCLUDED.label_fa,
        label_ps = EXCLUDED.label_ps, unit = EXCLUDED.unit, default_value = EXCLUDED.default_value,
        is_standard = EXCLUDED.is_standard, sort_order = EXCLUDED.sort_order;
    `, [field.id, field.key, field.labelEn, field.labelFa, field.labelPs, field.unit, field.defaultValue, field.isStandard ?? true, field.sortOrder ?? 0]);
  }
  res.json({ success: true, fields });
});

// --- DESIGN CATEGORIES ---
apiRouter.get('/design-categories', async (req: Request, res: Response) => {
  const result = await safeQuery('SELECT * FROM design_categories ORDER BY id');
  if (result?.rows) {
    inMemoryDesignCategories = result.rows.map((row: any) => ({
      id: row.id,
      key: row.key,
      titleEn: row.title_en,
      titleFa: row.title_fa,
      titlePs: row.title_ps,
      options: row.options || [],
    }));
  }
  res.json(inMemoryDesignCategories);
});

apiRouter.post('/design-categories', async (req: Request, res: Response) => {
  const categories = Array.isArray(req.body) ? req.body : [];
  inMemoryDesignCategories = categories;
  for (const category of categories) {
    await safeQuery(`
      INSERT INTO design_categories (id, key, title_en, title_fa, title_ps, options)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        key = EXCLUDED.key, title_en = EXCLUDED.title_en, title_fa = EXCLUDED.title_fa,
        title_ps = EXCLUDED.title_ps, options = EXCLUDED.options;
    `, [category.id, category.key, category.titleEn, category.titleFa, category.titlePs, JSON.stringify(category.options || [])]);
  }
  res.json({ success: true, categories });
});

// --- PRODUCTS ---
apiRouter.get('/products', async (req: Request, res: Response) => {
  const result = await safeQuery('SELECT * FROM products ORDER BY created_at DESC');
  if (result?.rows) {
    inMemoryProducts = result.rows.map((row: any) => ({
      id: row.id, name: row.name, category: row.category, vendor: row.vendor,
      brand: row.brand, sku: row.sku, imageUrl: row.image_url,
      purchasePrice: Number(row.purchase_price) || 0, stockQuantity: Number(row.stock_quantity) || 0,
      lowStockThreshold: Number(row.low_stock_threshold) || 5, description: row.description,
      createdAt: row.created_at, updatedAt: row.updated_at,
    }));
    return res.json(inMemoryProducts);
  }
  res.json(inMemoryProducts);
});

apiRouter.post('/products', async (req: Request, res: Response) => {
  const product = req.body;
  if (!product || !product.id) {
    return res.status(400).json({ error: 'Product data with id is required' });
  }
  const idx = inMemoryProducts.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    inMemoryProducts[idx] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    inMemoryProducts.unshift({ ...product, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  await safeQuery(`
    INSERT INTO products (id, name, category, vendor, brand, sku, image_url, purchase_price, stock_quantity, low_stock_threshold, description, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, category = EXCLUDED.category, vendor = EXCLUDED.vendor,
      brand = EXCLUDED.brand, sku = EXCLUDED.sku, image_url = EXCLUDED.image_url,
      purchase_price = EXCLUDED.purchase_price, stock_quantity = EXCLUDED.stock_quantity,
      low_stock_threshold = EXCLUDED.low_stock_threshold, description = EXCLUDED.description,
      updated_at = NOW();
  `, [
    product.id, product.name, product.category, product.vendor, product.brand, product.sku,
    product.imageUrl, product.purchasePrice || 0, product.stockQuantity || 0,
    product.lowStockThreshold ?? 5, product.description,
  ]);
  res.json({ success: true, product });
});

apiRouter.delete('/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  inMemoryProducts = inMemoryProducts.filter(p => p.id !== id);
  await safeQuery('DELETE FROM products WHERE id = $1', [id]);
  res.json({ success: true });
});

// --- PRODUCT SALES ---
apiRouter.get('/product-sales', async (req: Request, res: Response) => {
  const result = await safeQuery('SELECT * FROM product_sales ORDER BY sale_date DESC, created_at DESC');
  if (result?.rows) {
    inMemoryProductSales = result.rows.map((row: any) => ({
      id: row.id, productId: row.product_id, productName: row.product_name, category: row.category,
      quantity: Number(row.quantity) || 0, purchasePrice: Number(row.purchase_price) || 0,
      sellingPrice: Number(row.selling_price) || 0, totalAmount: Number(row.total_amount) || 0,
      profit: Number(row.profit) || 0, customerId: row.customer_id, customerName: row.customer_name,
      customerPhone: row.customer_phone, saleDate: row.sale_date, paymentMethod: row.payment_method,
      notes: row.notes,
    }));
    return res.json(inMemoryProductSales);
  }
  res.json(inMemoryProductSales);
});

apiRouter.post('/product-sales', async (req: Request, res: Response) => {
  const sale = req.body;
  if (!sale || !sale.id) {
    return res.status(400).json({ error: 'Sale record with id is required' });
  }
  const existing = inMemoryProductSales.findIndex(record => record.id === sale.id);
  if (existing >= 0) inMemoryProductSales[existing] = sale;
  else inMemoryProductSales.unshift(sale);
  await safeQuery(`
    INSERT INTO product_sales (id, product_id, product_name, category, quantity, purchase_price, selling_price, total_amount, profit, customer_id, customer_name, customer_phone, sale_date, payment_method, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (id) DO UPDATE SET
      quantity = EXCLUDED.quantity, selling_price = EXCLUDED.selling_price, total_amount = EXCLUDED.total_amount,
      profit = EXCLUDED.profit, customer_id = EXCLUDED.customer_id, customer_name = EXCLUDED.customer_name,
      customer_phone = EXCLUDED.customer_phone, payment_method = EXCLUDED.payment_method, notes = EXCLUDED.notes;
  `, [
    sale.id, sale.productId, sale.productName, sale.category, sale.quantity, sale.purchasePrice || 0,
    sale.sellingPrice, sale.totalAmount, sale.profit || 0, sale.customerId, sale.customerName,
    sale.customerPhone, sale.saleDate, sale.paymentMethod, sale.notes,
  ]);
  res.json({ success: true, sale });
});
