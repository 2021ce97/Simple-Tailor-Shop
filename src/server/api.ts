import express, { Router, Request, Response } from 'express';
import { 
  safeQuery, 
  isDatabaseConnected, 
  verifyDbConnection,
  dbGetOrders,
  dbSaveOrder,
  dbDeleteOrder,
  dbGetCustomers,
  dbSaveCustomer,
  dbDeleteCustomer,
  dbGetFabrics,
  dbSaveFabric,
  dbDeleteFabric,
  dbGetProducts,
  dbSaveProduct,
  dbDeleteProduct,
  dbGetProductSales,
  dbSaveProductSale,
  dbDeleteProductSale,
  dbGetShopSettings,
  dbSaveShopSettings
} from '../db/db.js';
import { getStore, saveStoreToDisk } from './store.js';

export const apiRouter = Router();

// Health check & DB status endpoint
const healthHandler = async (req: Request, res: Response) => {
  const isConnected = await verifyDbConnection();
  const store = getStore();
  const dbOrdersCountRes = isConnected ? await safeQuery('SELECT count(*) FROM orders') : null;
  const dbCustomersCountRes = isConnected ? await safeQuery('SELECT count(*) FROM customers') : null;
  const dbFabricsCountRes = isConnected ? await safeQuery('SELECT count(*) FROM fabrics') : null;

  const dbOrdersCount = dbOrdersCountRes?.rows?.[0]?.count ? parseInt(dbOrdersCountRes.rows[0].count, 10) : store.orders.length;
  const dbCustomersCount = dbCustomersCountRes?.rows?.[0]?.count ? parseInt(dbCustomersCountRes.rows[0].count, 10) : store.customers.length;
  const dbFabricsCount = dbFabricsCountRes?.rows?.[0]?.count ? parseInt(dbFabricsCountRes.rows[0].count, 10) : store.fabrics.length;

  res.json({
    status: 'ok',
    connected: isConnected,
    time: new Date().toISOString(),
    database: isConnected ? 'PostgreSQL Connected' : 'Persistent Storage Active',
    ordersCount: dbOrdersCount,
    customersCount: dbCustomersCount,
    fabricsCount: dbFabricsCount
  });
};

apiRouter.get('/health', healthHandler);
apiRouter.get('/db-status', healthHandler);
apiRouter.get('/status', healthHandler);

// Public tracking endpoint
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
  const store = getStore();
  const memoryOrders = store.orders.filter(item =>
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
  const store = getStore();
  const order = databaseOrder || store.orders.find(item =>
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
  const store = getStore();
  const result = await safeQuery('SELECT * FROM fabrics ORDER BY created_at DESC');
  if (result && result.rows && result.rows.length > 0) {
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
    store.fabrics = fabrics;
    saveStoreToDisk();
    return res.json(fabrics);
  }
  res.json(store.fabrics);
});

apiRouter.post('/fabrics', async (req: Request, res: Response) => {
  const fabric = req.body;
  if (!fabric || !fabric.id) {
    return res.status(400).json({ error: 'Fabric data with id is required' });
  }

  const store = getStore();
  const idx = store.fabrics.findIndex(f => f.id === fabric.id);
  if (idx >= 0) {
    store.fabrics[idx] = { ...fabric, updatedAt: new Date().toISOString() };
  } else {
    store.fabrics.unshift({ ...fabric, createdAt: fabric.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveStoreToDisk();

  // Persist to Cloud PostgreSQL (Supabase)
  await dbSaveFabric(fabric);

  res.json({ success: true, fabric });
});

apiRouter.delete('/fabrics/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = getStore();
  store.fabrics = store.fabrics.filter(f => f.id !== id);
  saveStoreToDisk();
  await dbDeleteFabric(id);
  await safeQuery('DELETE FROM fabrics WHERE id = $1', [id]);
  res.json({ success: true });
});

// --- ORDERS ---
apiRouter.get('/orders', async (req: Request, res: Response) => {
  const store = getStore();
  const result = await safeQuery('SELECT * FROM orders ORDER BY created_at DESC');
  if (result && result.rows && result.rows.length > 0) {
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
      items: Array.isArray(row.items) ? row.items : [],
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
    store.orders = orders;
    saveStoreToDisk();
    return res.json(orders);
  }
  res.json(store.orders);
});

// Database order saver helper
async function saveOrderToDb(order: any): Promise<boolean> {
  if (!order || !order.id) return false;

  // Persist directly to Supabase Cloud PostgreSQL
  try {
    const saved = await dbSaveOrder(order);
    if (saved) return true;
  } catch (e: any) {
    console.warn('[Database] dbSaveOrder notice:', e?.message || e);
  }

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

  let itemsJson: string;
  try {
    itemsJson = Array.isArray(order.items)
      ? JSON.stringify(order.items)
      : typeof order.items === 'string'
      ? order.items
      : '[]';
  } catch {
    itemsJson = '[]';
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
      cabinet_slot, items, total_amount, paid_amount, balance_amount, payment_status,
      status, order_date, delivery_date, completed_date, delivered_date, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16, $17, $18::jsonb, $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW()
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
      items = EXCLUDED.items,
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
    cabinetSlot, itemsJson, totalAmount, paidAmount, balanceAmount, paymentStatus,
    status, orderDate, deliveryDate, completedDate, deliveredDate
  ]);

  // Insert individual items into order_items table if present
  if (Array.isArray(order.items) && order.items.length > 0) {
    for (const item of order.items) {
      if (item) {
        const itemId = String(item.id || 'item_' + orderId + '_' + Math.random().toString(36).substr(2, 6));
        await safeQuery(`
          INSERT INTO order_items (
            id, order_id, garment_type, quantity, price_per_unit, total_price,
            measurements, design_selections, fabric_notes, special_instructions, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, NOW())
          ON CONFLICT (id) DO UPDATE SET
            garment_type = EXCLUDED.garment_type,
            quantity = EXCLUDED.quantity,
            price_per_unit = EXCLUDED.price_per_unit,
            total_price = EXCLUDED.total_price,
            measurements = EXCLUDED.measurements,
            design_selections = EXCLUDED.design_selections,
            fabric_notes = EXCLUDED.fabric_notes,
            special_instructions = EXCLUDED.special_instructions;
        `, [
          itemId, orderId, item.garmentType || garmentType, item.quantity || 1,
          item.pricePerUnit || 0, item.totalPrice || totalAmount,
          typeof item.measurements === 'object' ? JSON.stringify(item.measurements) : '{}',
          typeof item.designSelections === 'object' ? JSON.stringify(item.designSelections) : '{}',
          item.fabricNotes || null, item.specialInstructions || null
        ]);
      }
    }
  }

  // Update fabric inventory stock in PostgreSQL if applicable
  if (fabricId && fabricMeters > 0 && !isCustomerFabric) {
    await safeQuery(`
      UPDATE fabrics
      SET stock_meters = GREATEST(0, stock_meters - $1), updated_at = NOW()
      WHERE id = $2;
    `, [fabricMeters, fabricId]);
  }

  // Ensure customer record is accurately maintained with measurements and aggregated stats
  if (customerName) {
    const custId = customerId || 'cust_' + (customerPhone ? customerPhone.replace(/\D/g, '') : Date.now());
    await safeQuery(`
      INSERT INTO customers (
        id, name, phone, whatsapp, preferred_garment_type, standard_measurements, notes,
        total_orders_count, total_spent, total_balance, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, 1, $8, $9, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE customers.phone END,
        whatsapp = CASE WHEN EXCLUDED.whatsapp <> '' THEN EXCLUDED.whatsapp ELSE customers.whatsapp END,
        preferred_garment_type = EXCLUDED.preferred_garment_type,
        standard_measurements = CASE WHEN EXCLUDED.standard_measurements <> '{}'::jsonb THEN EXCLUDED.standard_measurements ELSE customers.standard_measurements END,
        notes = CASE WHEN EXCLUDED.notes IS NOT NULL THEN EXCLUDED.notes ELSE customers.notes END,
        updated_at = NOW();
    `, [
      custId, customerName, customerPhone, customerWhatsApp, garmentType, measurementsJson, specialInstructions, totalAmount, balanceAmount
    ]);

    // Recalculate customer statistics from all orders in database
    await safeQuery(`
      UPDATE customers
      SET 
        total_orders_count = COALESCE((SELECT COUNT(*) FROM orders WHERE customer_id = $1 OR (customer_phone = $2 AND customer_phone != '')), 0),
        total_spent = COALESCE((SELECT SUM(total_amount) FROM orders WHERE customer_id = $1 OR (customer_phone = $2 AND customer_phone != '')), 0),
        total_balance = COALESCE((SELECT SUM(balance_amount) FROM orders WHERE customer_id = $1 OR (customer_phone = $2 AND customer_phone != '')), 0),
        updated_at = NOW()
      WHERE id = $1;
    `, [custId, customerPhone]);
  }

  return result !== null;
}

apiRouter.post('/orders', async (req: Request, res: Response) => {
  const order = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: 'Order data with id is required' });
  }

  const store = getStore();

  // Deduct fabric stock in store
  if (order.fabricId && order.fabricMeters && order.fabricMeters > 0 && !order.isCustomerFabric) {
    const fabIdx = store.fabrics.findIndex(f => f.id === order.fabricId);
    if (fabIdx >= 0) {
      store.fabrics[fabIdx].stockMeters = Math.max(0, (store.fabrics[fabIdx].stockMeters || 0) - order.fabricMeters);
      store.fabrics[fabIdx].updatedAt = new Date().toISOString();
    }
  }

  // Update or insert order in server store
  const idx = store.orders.findIndex(o => o.id === order.id);
  if (idx >= 0) {
    store.orders[idx] = { ...order, updatedAt: new Date().toISOString() };
  } else {
    store.orders.unshift({ ...order, createdAt: order.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  // Update or insert customer in server store
  if (order.customerName) {
    const cleanPhone = (order.customerPhone || '').trim();
    const cleanName = (order.customerName || '').trim();
    const custIdx = store.customers.findIndex(c => 
      (cleanPhone && c.phone && c.phone.trim() === cleanPhone) || 
      (order.customerId && c.id === order.customerId)
    );
    if (custIdx >= 0) {
      store.customers[custIdx].name = cleanName || store.customers[custIdx].name;
      store.customers[custIdx].phone = cleanPhone || store.customers[custIdx].phone;
      if (order.customerWhatsApp) store.customers[custIdx].whatsapp = order.customerWhatsApp;
      if (order.measurements && Object.keys(order.measurements).length > 0) {
        store.customers[custIdx].standardMeasurements = {
          ...(store.customers[custIdx].standardMeasurements || {}),
          ...order.measurements
        };
      }
      store.customers[custIdx].updatedAt = new Date().toISOString();
    } else {
      store.customers.unshift({
        id: order.customerId || 'cust_' + Date.now(),
        name: cleanName,
        phone: cleanPhone,
        whatsapp: order.customerWhatsApp || cleanPhone,
        standardMeasurements: order.measurements || {},
        preferredGarmentType: order.garmentType || 'perahanTunban',
        totalOrdersCount: 1,
        totalSpent: Number(order.totalAmount) || 0,
        totalBalance: Number(order.balanceAmount) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  saveStoreToDisk();

  // Persist to PostgreSQL if available
  const persisted = await saveOrderToDb(order);
  res.json({ success: true, order, persistedToDb: persisted });
});

// Dedicated Batch & Realtime Sync endpoint
apiRouter.post('/sync/all', async (req: Request, res: Response) => {
  const { orders = [], customers = [], fabrics = [], products = [], productSales = [] } = req.body;
  const store = getStore();

  if (Array.isArray(orders) && orders.length > 0) {
    for (const ord of orders) {
      if (ord && ord.id) {
        const existingIdx = store.orders.findIndex(o => o.id === ord.id);
        if (existingIdx >= 0) {
          // Keep newer
          const existingUpdated = new Date(store.orders[existingIdx].updatedAt || 0).getTime();
          const incomingUpdated = new Date(ord.updatedAt || 0).getTime();
          if (incomingUpdated >= existingUpdated) {
            store.orders[existingIdx] = { ...ord };
          }
        } else {
          store.orders.unshift(ord);
        }
        await saveOrderToDb(ord);
      }
    }
  }

  // Merge customers
  if (Array.isArray(customers) && customers.length > 0) {
    for (const c of customers) {
      if (c && c.id && c.name) {
        const existingIdx = store.customers.findIndex(x => x.id === c.id || (c.phone && x.phone === c.phone));
        if (existingIdx >= 0) {
          store.customers[existingIdx] = { ...store.customers[existingIdx], ...c };
        } else {
          store.customers.push(c);
        }
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

  // Merge fabrics
  if (Array.isArray(fabrics) && fabrics.length > 0) {
    for (const f of fabrics) {
      if (f && f.id) {
        const idx = store.fabrics.findIndex(x => x.id === f.id);
        if (idx >= 0) store.fabrics[idx] = { ...store.fabrics[idx], ...f };
        else store.fabrics.push(f);
      }
    }
  }

  // Merge products
  if (Array.isArray(products) && products.length > 0) {
    for (const p of products) {
      if (p && p.id) {
        const idx = store.products.findIndex(x => x.id === p.id);
        if (idx >= 0) store.products[idx] = { ...store.products[idx], ...p };
        else store.products.push(p);

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
          p.id, p.name, p.category, p.vendor || null, p.brand || null, p.sku || null,
          p.imageUrl || null, p.purchasePrice || 0, p.stockQuantity || 0,
          p.lowStockThreshold ?? 5, p.description || null,
        ]);
      }
    }
  }

  // Merge sales
  if (Array.isArray(productSales) && productSales.length > 0) {
    for (const s of productSales) {
      if (s && s.id) {
        const idx = store.productSales.findIndex(x => x.id === s.id);
        if (idx >= 0) store.productSales[idx] = { ...store.productSales[idx], ...s };
        else store.productSales.push(s);

        await safeQuery(`
          INSERT INTO product_sales (id, product_id, product_name, category, quantity, purchase_price, selling_price, total_amount, profit, customer_id, customer_name, customer_phone, sale_date, payment_method, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            quantity = EXCLUDED.quantity, selling_price = EXCLUDED.selling_price, total_amount = EXCLUDED.total_amount,
            profit = EXCLUDED.profit, customer_id = EXCLUDED.customer_id, customer_name = EXCLUDED.customer_name,
            customer_phone = EXCLUDED.customer_phone, payment_method = EXCLUDED.payment_method, notes = EXCLUDED.notes;
        `, [
          s.id, s.productId, s.productName, s.category, s.quantity, s.purchasePrice || 0,
          s.sellingPrice, s.totalAmount, s.profit || 0, s.customerId || null, s.customerName || null,
          s.customerPhone || null, s.saleDate, s.paymentMethod || null, s.notes || null,
        ]);
      }
    }
  }

  saveStoreToDisk();

  // Query fresh consolidated data directly from PostgreSQL if available
  const [ordersRes, customersRes, productsRes, salesRes, fabricsRes] = await Promise.all([
    safeQuery('SELECT * FROM orders ORDER BY updated_at DESC, created_at DESC'),
    safeQuery('SELECT * FROM customers ORDER BY updated_at DESC, created_at DESC'),
    safeQuery('SELECT * FROM products ORDER BY updated_at DESC, created_at DESC'),
    safeQuery('SELECT * FROM product_sales ORDER BY sale_date DESC, created_at DESC'),
    safeQuery('SELECT * FROM fabrics ORDER BY updated_at DESC, created_at DESC')
  ]);

  if (ordersRes && ordersRes.rows && ordersRes.rows.length > 0) {
    store.orders = ordersRes.rows.map((row: any) => ({
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
      items: Array.isArray(row.items) ? row.items : [],
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

  if (customersRes && customersRes.rows && customersRes.rows.length > 0) {
    store.customers = customersRes.rows.map((row: any) => {
      let measurements = {};
      if (typeof row.standard_measurements === 'string') {
        try { measurements = JSON.parse(row.standard_measurements); } catch {}
      } else if (typeof row.standard_measurements === 'object' && row.standard_measurements !== null) {
        measurements = row.standard_measurements;
      }
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        whatsapp: row.whatsapp,
        address: row.address,
        notes: row.notes,
        standardMeasurements: measurements,
        preferredGarmentType: row.preferred_garment_type,
        totalOrdersCount: row.total_orders_count || 0,
        totalSpent: parseFloat(row.total_spent) || 0,
        totalBalance: parseFloat(row.total_balance) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
  }

  if (productsRes && productsRes.rows && productsRes.rows.length > 0) {
    store.products = productsRes.rows.map((row: any) => ({
      id: row.id, name: row.name, category: row.category, vendor: row.vendor,
      brand: row.brand, sku: row.sku, imageUrl: row.image_url,
      purchasePrice: Number(row.purchase_price) || 0, stockQuantity: Number(row.stock_quantity) || 0,
      lowStockThreshold: Number(row.low_stock_threshold) || 5, description: row.description,
      createdAt: row.created_at, updatedAt: row.updated_at,
    }));
  }

  if (salesRes && salesRes.rows && salesRes.rows.length > 0) {
    store.productSales = salesRes.rows.map((row: any) => ({
      id: row.id, productId: row.product_id, productName: row.product_name, category: row.category,
      quantity: Number(row.quantity) || 0, purchasePrice: Number(row.purchase_price) || 0,
      sellingPrice: Number(row.selling_price) || 0, totalAmount: Number(row.total_amount) || 0,
      profit: Number(row.profit) || 0, customerId: row.customer_id, customerName: row.customer_name,
      customerPhone: row.customer_phone, saleDate: row.sale_date, paymentMethod: row.payment_method,
      notes: row.notes,
    }));
  }

  if (fabricsRes && fabricsRes.rows && fabricsRes.rows.length > 0) {
    store.fabrics = fabricsRes.rows.map((row: any) => ({
      id: row.id, name: row.name, code: row.code, color: row.color,
      pattern: row.pattern, type: row.type, width: row.width,
      stockMeters: parseFloat(row.stock_meters) || 0,
      pricePerMeter: parseFloat(row.price_per_meter) || 0,
      costPerMeter: parseFloat(row.cost_per_meter) || 0,
      location: row.location, supplier: row.supplier,
      imageUrl: row.image_url, notes: row.notes,
      createdAt: row.created_at, updatedAt: row.updated_at
    }));
  }

  saveStoreToDisk();

  res.json({
    success: true,
    orders: store.orders,
    customers: store.customers,
    fabrics: store.fabrics,
    products: store.products,
    productSales: store.productSales,
    shopSettings: store.shopSettings,
    measurementFields: store.measurementFields,
    designCategories: store.designCategories,
    database: isDatabaseConnected() ? 'PostgreSQL Connected' : 'Persistent Storage Active'
  });
});

apiRouter.delete('/orders/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = getStore();
  store.orders = store.orders.filter(o => o.id !== id);
  saveStoreToDisk();
  await dbDeleteOrder(id);
  await safeQuery('DELETE FROM order_items WHERE order_id = $1', [id]);
  await safeQuery('DELETE FROM orders WHERE id = $1', [id]);
  res.json({ success: true });
});

// --- CUSTOMERS ---
apiRouter.get('/customers', async (req: Request, res: Response) => {
  const store = getStore();
  const result = await safeQuery('SELECT * FROM customers ORDER BY created_at DESC');
  if (result && result.rows && result.rows.length > 0) {
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
    store.customers = customers;
    saveStoreToDisk();
    return res.json(customers);
  }
  res.json(store.customers);
});

apiRouter.post('/customers', async (req: Request, res: Response) => {
  const customer = req.body;
  if (!customer || !customer.id) {
    return res.status(400).json({ error: 'Customer data with id is required' });
  }

  const store = getStore();
  const idx = store.customers.findIndex(c => c.id === customer.id);
  if (idx >= 0) {
    store.customers[idx] = { ...customer, updatedAt: new Date().toISOString() };
  } else {
    store.customers.unshift({ ...customer, createdAt: customer.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveStoreToDisk();

  // Persist to Cloud PostgreSQL (Supabase)
  await dbSaveCustomer(customer);

  res.json({ success: true, customer });
});

apiRouter.delete('/customers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = getStore();
  store.customers = store.customers.filter(c => c.id !== id);
  saveStoreToDisk();
  await dbDeleteCustomer(id);
  await safeQuery('DELETE FROM customers WHERE id = $1', [id]);
  res.json({ success: true });
});

// --- SHOP SETTINGS ---
apiRouter.get('/shop-settings', async (req: Request, res: Response) => {
  const store = getStore();
  const dbSettings = await dbGetShopSettings();
  if (dbSettings) {
    store.shopSettings = dbSettings;
    saveStoreToDisk();
    return res.json(store.shopSettings);
  }
  const result = await safeQuery('SELECT data FROM shop_settings WHERE id = $1', ['default']);
  if (result && result.rows && result.rows.length > 0) {
    store.shopSettings = result.rows[0].data;
    saveStoreToDisk();
    return res.json(store.shopSettings);
  }
  res.json(store.shopSettings);
});

apiRouter.post('/shop-settings', async (req: Request, res: Response) => {
  const settings = req.body;
  const store = getStore();
  store.shopSettings = settings;
  saveStoreToDisk();

  await dbSaveShopSettings(settings);
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
  const store = getStore();
  const result = await safeQuery('SELECT * FROM measurement_fields ORDER BY sort_order, id');
  if (result?.rows && result.rows.length > 0) {
    store.measurementFields = result.rows.map((row: any) => ({
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
    saveStoreToDisk();
  }
  res.json(store.measurementFields);
});

apiRouter.post('/measurement-fields', async (req: Request, res: Response) => {
  const fields = Array.isArray(req.body) ? req.body : [];
  const store = getStore();
  store.measurementFields = fields;
  saveStoreToDisk();

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
  const store = getStore();
  const result = await safeQuery('SELECT * FROM design_categories ORDER BY id');
  if (result?.rows && result.rows.length > 0) {
    store.designCategories = result.rows.map((row: any) => ({
      id: row.id,
      key: row.key,
      titleEn: row.title_en,
      titleFa: row.title_fa,
      titlePs: row.title_ps,
      options: row.options || [],
    }));
    saveStoreToDisk();
  }
  res.json(store.designCategories);
});

apiRouter.post('/design-categories', async (req: Request, res: Response) => {
  const categories = Array.isArray(req.body) ? req.body : [];
  const store = getStore();
  store.designCategories = categories;
  saveStoreToDisk();

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
  const store = getStore();
  const result = await safeQuery('SELECT * FROM products ORDER BY created_at DESC');
  if (result?.rows && result.rows.length > 0) {
    store.products = result.rows.map((row: any) => ({
      id: row.id, name: row.name, category: row.category, vendor: row.vendor,
      brand: row.brand, sku: row.sku, imageUrl: row.image_url,
      purchasePrice: Number(row.purchase_price) || 0, stockQuantity: Number(row.stock_quantity) || 0,
      lowStockThreshold: Number(row.low_stock_threshold) || 5, description: row.description,
      createdAt: row.created_at, updatedAt: row.updated_at,
    }));
    saveStoreToDisk();
    return res.json(store.products);
  }
  res.json(store.products);
});

apiRouter.post('/products', async (req: Request, res: Response) => {
  const product = req.body;
  if (!product || !product.id) {
    return res.status(400).json({ error: 'Product data with id is required' });
  }

  const store = getStore();
  const idx = store.products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    store.products[idx] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    store.products.unshift({ ...product, createdAt: product.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveStoreToDisk();

  await dbSaveProduct(product);
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
  const store = getStore();
  store.products = store.products.filter(p => p.id !== id);
  saveStoreToDisk();
  await dbDeleteProduct(id);
  await safeQuery('DELETE FROM products WHERE id = $1', [id]);
  res.json({ success: true });
});

// --- PRODUCT SALES ---
apiRouter.get('/product-sales', async (req: Request, res: Response) => {
  const store = getStore();
  const dbSales = await dbGetProductSales();
  if (dbSales && dbSales.length > 0) {
    store.productSales = dbSales;
    saveStoreToDisk();
    return res.json(store.productSales);
  }
  const result = await safeQuery('SELECT * FROM product_sales ORDER BY sale_date DESC, created_at DESC');
  if (result?.rows && result.rows.length > 0) {
    store.productSales = result.rows.map((row: any) => ({
      id: row.id, productId: row.product_id, productName: row.product_name, category: row.category,
      quantity: Number(row.quantity) || 0, purchasePrice: Number(row.purchase_price) || 0,
      sellingPrice: Number(row.selling_price) || 0, totalAmount: Number(row.total_amount) || 0,
      paidAmount: (Number(row.paid_amount) ?? Number(row.total_amount)) || 0,
      balanceAmount: Number(row.balance_amount) || 0,
      paymentStatus: row.payment_status || 'paid',
      profit: Number(row.profit) || 0, customerId: row.customer_id, customerName: row.customer_name,
      customerPhone: row.customer_phone, saleDate: row.sale_date, paymentMethod: row.payment_method,
      notes: row.notes,
    }));
    saveStoreToDisk();
    return res.json(store.productSales);
  }
  res.json(store.productSales);
});

apiRouter.post('/product-sales', async (req: Request, res: Response) => {
  const sale = req.body;
  if (!sale || !sale.id) {
    return res.status(400).json({ error: 'Sale record with id is required' });
  }

  const store = getStore();
  const existing = store.productSales.findIndex(record => record.id === sale.id);
  if (existing >= 0) store.productSales[existing] = sale;
  else store.productSales.unshift(sale);

  // Deduct product stock in memory and in Supabase
  if (sale.productId && sale.quantity > 0) {
    const prodIdx = store.products.findIndex(p => p.id === sale.productId);
    if (prodIdx >= 0) {
      store.products[prodIdx].stockQuantity = Math.max(0, (store.products[prodIdx].stockQuantity || 0) - sale.quantity);
      store.products[prodIdx].updatedAt = new Date().toISOString();
      await dbSaveProduct(store.products[prodIdx]);
    }
    await safeQuery(`
      UPDATE products 
      SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW() 
      WHERE id = $2
    `, [sale.quantity, sale.productId]);
  }

  saveStoreToDisk();

  // Persist directly to Supabase Cloud PostgreSQL
  await dbSaveProductSale(sale);

  res.json({ success: true, sale });
});

apiRouter.delete('/product-sales/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = getStore();
  store.productSales = store.productSales.filter(s => s.id !== id);
  saveStoreToDisk();
  await dbDeleteProductSale(id);
  await safeQuery('DELETE FROM product_sales WHERE id = $1', [id]);
  res.json({ success: true });
});
