import express, { Router, Request, Response } from 'express';
import { safeQuery, isDatabaseConnected } from '../db/db';
import { 
  INITIAL_DEMO_FABRICS, 
  DEFAULT_MEASUREMENT_FIELDS, 
  DEFAULT_DESIGN_CATEGORIES, 
  DEFAULT_SHOP_SETTINGS 
} from '../services/storage';

export const apiRouter = Router();

// In-memory fallback stores
let inMemoryFabrics = [...INITIAL_DEMO_FABRICS];
let inMemoryOrders: any[] = [];
let inMemoryCustomers: any[] = [];
let inMemorySettings: any = { ...DEFAULT_SHOP_SETTINGS };
let inMemoryMeasurementFields: any[] = [...DEFAULT_MEASUREMENT_FIELDS];
let inMemoryDesignCategories: any[] = [...DEFAULT_DESIGN_CATEGORIES];

// Health check endpoint
apiRouter.get('/health', async (req: Request, res: Response) => {
  const isConnected = isDatabaseConnected();
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    database: isConnected ? 'PostgreSQL Connected' : 'Local / Offline Sync Mode',
    ordersCount: inMemoryOrders.length,
    customersCount: inMemoryCustomers.length,
    fabricsCount: inMemoryFabrics.length
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
    inMemoryOrders = orders;
    return res.json(orders);
  }
  res.json(inMemoryOrders);
});

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
    inMemoryOrders.unshift({ ...order, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  // Persist to PostgreSQL if connected
  await safeQuery(`
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
    order.id, order.orderNumber, order.customerId, order.customerName, order.customerPhone, order.customerWhatsApp,
    order.garmentType, order.quantity, order.fabricId, order.fabricName, order.fabricColor, order.fabricMeters || 0,
    order.isCustomerFabric || false, JSON.stringify(order.measurements || {}), JSON.stringify(order.designSelections || {}),
    order.specialInstructions, order.cabinetSlot, order.totalAmount || 0, order.paidAmount || 0, order.balanceAmount || 0,
    order.paymentStatus || 'unpaid', order.status || 'pending', order.orderDate, order.deliveryDate, order.completedDate, order.deliveredDate
  ]);

  res.json({ success: true, order });
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
apiRouter.get('/measurement-fields', (req: Request, res: Response) => {
  res.json(inMemoryMeasurementFields);
});

apiRouter.post('/measurement-fields', (req: Request, res: Response) => {
  inMemoryMeasurementFields = req.body;
  res.json({ success: true });
});

// --- DESIGN CATEGORIES ---
apiRouter.get('/design-categories', (req: Request, res: Response) => {
  res.json(inMemoryDesignCategories);
});

apiRouter.post('/design-categories', (req: Request, res: Response) => {
  inMemoryDesignCategories = req.body;
  res.json({ success: true });
});
