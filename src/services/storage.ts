import { 
  Customer, 
  Order, 
  DesignCategory, 
  MeasurementField, 
  ShopSettings, 
  Fabric, 
  Product, 
  ProductCategory,
  ProductSale 
} from '../types';

const STORAGE_KEYS = {
  ORDERS: 'tailor_orders_v1',
  CUSTOMERS: 'tailor_customers_v1',
  FABRICS: 'tailor_fabrics_v1',
  PRODUCTS: 'tailor_products_v1',
  PRODUCT_CATEGORIES: 'tailor_product_categories_v1',
  PRODUCT_VENDORS: 'tailor_product_vendors_v1',
  PRODUCT_BRANDS: 'tailor_product_brands_v1',
  PRODUCT_SALES: 'tailor_product_sales_v1',
  DESIGN_CATEGORIES: 'tailor_design_categories_v1',
  MEASUREMENT_FIELDS: 'tailor_measurement_fields_v1',
  SHOP_SETTINGS: 'tailor_shop_settings_v1',
  LANGUAGE: 'tailor_app_lang_v1',
  AUTH_USER: 'tailor_app_auth_user_v1',
};

export const DEFAULT_PRODUCT_CATEGORIES = ['Shoes', 'Watches', 'Perfume', 'Accessories', 'Caps / Karakul'];
export const DEFAULT_PRODUCT_VENDORS = ['Arab Mobiles Distributor', 'China Shop', 'Kabul Wholesale Supply'];
export const DEFAULT_PRODUCT_BRANDS = ['Peshawari Leather', 'Curren Classic', 'Al-Rehab Oud', 'Casio', 'Rayan Signature'];

export const INITIAL_DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'کفش چرم دست‌دوز اعلا (Handmade Leather Peshawari Shoes)',
    category: 'Shoes',
    brand: 'Peshawari Leather',
    vendor: 'Kabul Wholesale Supply',
    purchasePrice: 1200,
    stockQuantity: 14,
    lowStockThreshold: 3,
    description: 'چرم اصل گاوی دست‌دوز، زیره راحت و بادوام برای مجالس',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'prod_2',
    name: 'ساعت مچی مجلسی طلایی (Classic Gold Quartz Watch)',
    category: 'Watches',
    brand: 'Curren Classic',
    vendor: 'China Shop',
    purchasePrice: 850,
    stockQuantity: 8,
    lowStockThreshold: 2,
    description: 'ضد آب روزمره با رنگ ثابت طلایی و نمایشگر تقویم',
    createdAt: '2026-08-21T11:00:00Z',
    updatedAt: '2026-08-21T11:00:00Z',
  },
  {
    id: 'prod_3',
    name: 'عطر سلطنتی عود و امبر (Royal Oud & Amber Perfume 50ml)',
    category: 'Perfume',
    brand: 'Al-Rehab Oud',
    vendor: 'Arab Mobiles Distributor',
    purchasePrice: 650,
    stockQuantity: 22,
    lowStockThreshold: 4,
    description: 'رایحه ماندگار و اصیل عربی مناسب فصل‌های مختلف',
    createdAt: '2026-08-22T09:30:00Z',
    updatedAt: '2026-08-22T09:30:00Z',
  }
];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopNameEn: 'Rayan Tailor Shop Management',
  shopNameFa: 'خیاطی و دوخت رایان',
  shopNamePs: 'د رایان خیاطي او کالیو ګنډل',
  taglineEn: 'Finest bespoke Afghan tailoring & traditional fashion',
  taglineFa: 'بهترین دوخت لباس‌های سنتی، مجلسی و مدرن',
  taglinePs: 'د ټولو دودیزو، مجلسی او عصري جامو باکیفیته ګنډل',
  phone1: '0793710008',
  phone2: '0780000000',
  whatsapp: '0782207308',
  addressEn: 'Arzan Qimat, Prison Square, Al-Madina & Ahmadzai Market, 2nd Floor, Kabul',
  addressFa: 'ارزان قیمت، چهارراهی محبس، المدینه و احمدزی مارکیت، منزل دوم، کابل',
  addressPs: 'ارزان قیمت، د محبس څلورلارې، المدینه او احمدزي مارکیټ، دوهم پوړ، کابل',
  currencyEn: 'AFN',
  currencyFa: 'افغانی',
  currencyPs: 'افغانۍ',
  currencySymbol: 'AFN',
  receiptFooterEn: 'Please bring this receipt for collection. Rayan Tailors guarantees perfection in every stitch!',
  receiptFooterFa: 'لطفاً هنگام تحویل گرفتن لباس، این بل را با خود داشته باشید. تضمین کیفیت خیاطی رایان!',
  receiptFooterPs: 'مهرباني وکړئ د کالیو اخیستلو پر مهال دا بِل له ځان سره ولرئ. د رایان خیاطۍ د لوړ کیفیت تضمین!',
  logoType: 'emblem',
};

export const INITIAL_DEMO_FABRICS: Fabric[] = [
  {
    id: 'fab_1',
    name: 'لته سفید اعلا (Classic White Latha)',
    code: 'FAB-001',
    color: 'سفید / White',
    type: 'نخی لته (Cotton Latha)',
    pricePerMeter: 450,
    stockMeters: 65,
    notes: 'تکه لته باکیفیت و لطیف برای پیراهن تنبان افغانی',
  },
  {
    id: 'fab_2',
    name: 'ابریشم بوسکی کرمی (Silk Boski Cream)',
    code: 'FAB-002',
    color: 'کرمی / Off-White',
    type: 'ابریشم بوسکی (Silk Boski)',
    pricePerMeter: 850,
    stockMeters: 42,
    notes: 'بوسکی اصیل پاکستانی بسیار نرم و شیک',
  },
  {
    id: 'fab_3',
    name: 'پشم واسکتی طوسی (Charcoal Wool Blend)',
    code: 'FAB-003',
    color: 'خاکستری تیره / Charcoal',
    type: 'پشم مجلسی (Wool Blend)',
    pricePerMeter: 1100,
    stockMeters: 28,
    notes: 'مناسب برای واسکت و دریشی زمستانی با گرمایش بالا',
  },
  {
    id: 'fab_4',
    name: 'واش این ویر آبی (Sky Blue Wash & Wear)',
    code: 'FAB-004',
    color: 'آبی آسمانی / Sky Blue',
    type: 'واش این ویر (Wash & Wear)',
    pricePerMeter: 550,
    stockMeters: 50,
    notes: 'پارچه بدون چروک، خنک و تابستانی',
  },
  {
    id: 'fab_5',
    name: 'مخمل سیاه اعلا (Black Luxury Velvet)',
    code: 'FAB-005',
    color: 'سیاه براق / Jet Black',
    type: 'مخمل (Velvet)',
    pricePerMeter: 1200,
    stockMeters: 18,
    notes: 'مخمل لوکس برای واسکت‌های مجلسی و دامادی',
  }
];

export const DEFAULT_MEASUREMENT_FIELDS: MeasurementField[] = [
  { id: 'm1', key: 'qad', labelEn: 'Length (Qad)', labelFa: 'قد', labelPs: 'قد', unit: 'in', isStandard: true },
  { id: 'm2', key: 'shana', labelEn: 'Shoulder (Shana)', labelFa: 'شانه', labelPs: 'شانه', unit: 'in', isStandard: true },
  { id: 'm3', key: 'asteen', labelEn: 'Sleeve (Asteen)', labelFa: 'آستین', labelPs: 'آستین', unit: 'in', isStandard: true },
  { id: 'm4', key: 'yakhan', labelEn: 'Collar (Yakhan)', labelFa: 'یخن', labelPs: 'یخن', unit: 'in', isStandard: true },
  { id: 'm5', key: 'chati', labelEn: 'Chest (Chati)', labelFa: 'چاتی (سینه)', labelPs: 'چاتی (سینه)', unit: 'in', isStandard: true },
  { id: 'm6', key: 'baghal', labelEn: 'Armpit (Baghal)', labelFa: 'بغل', labelPs: 'بغل', unit: 'in', isStandard: true },
  { id: 'm7', key: 'kamar', labelEn: 'Waist (Kamar)', labelFa: 'کمر', labelPs: 'کمر', unit: 'in', isStandard: true },
  { id: 'm8', key: 'daman', labelEn: 'Daman (Hem)', labelFa: 'دامن', labelPs: 'دامن', unit: 'in', isStandard: true },
  { id: 'm9', key: 'tunban', labelEn: 'Trouser (Tunban)', labelFa: 'تنبان', labelPs: 'تنبان / پرتوګ', unit: 'in', isStandard: true },
  { id: 'm10', key: 'pacha', labelEn: 'Bottom (Pacha)', labelFa: 'پاچه', labelPs: 'پاچه', unit: 'in', isStandard: true },
  { id: 'm11', key: 'surin', labelEn: 'Seat/Hip (Surin)', labelFa: 'سورین', labelPs: 'سورین', unit: 'in', isStandard: true },
  { id: 'm12', key: 'machDast', labelEn: 'Wrist (Mach Dast)', labelFa: 'مچ دست', labelPs: 'مچ لاس', unit: 'in', isStandard: false },
];

export const DEFAULT_DESIGN_CATEGORIES: DesignCategory[] = [
  {
    id: 'd1',
    key: 'yakhanShape',
    titleEn: 'Collar Shape / Style',
    titleFa: 'شیپ یخن / کالر',
    titlePs: 'د یخن ډول / شیپ',
    allowCustomInput: true,
    options: [
      { id: 'o1_1', nameEn: 'Collar (Standard)', nameFa: 'کالر', namePs: 'کالر' },
      { id: 'o1_2', nameEn: 'V-Neck (Haft Ghara)', nameFa: 'هفت غاره', namePs: 'هفت غاړه' },
      { id: 'o1_3', nameEn: 'Mandarin Band (Bayn)', nameFa: 'بین ساده', namePs: 'ساده بین' },
      { id: 'o1_4', nameEn: 'Semi-Collar', nameFa: 'نیم کالر', namePs: 'نیم کالر' },
      { id: 'o1_5', nameEn: 'Sherwani Collar', nameFa: 'شروانی', namePs: 'شرواني یخن' },
      { id: 'o1_6', nameEn: 'Piped Collar (Moghzi)', nameFa: 'مغزی دار', namePs: 'مغزي لرونکی' },
    ],
  },
  {
    id: 'd2',
    key: 'cuffStyle',
    titleEn: 'Sleeve Cuff Style',
    titleFa: 'کف یا استین',
    titlePs: 'کف یا لستوڼی',
    allowCustomInput: true,
    options: [
      { id: 'o2_1', nameEn: 'Round Cuff (9.25)', nameFa: 'کول کف (9.25)', namePs: 'کول کف (9.25)' },
      { id: 'o2_2', nameEn: 'Cut Cuff', nameFa: 'کټ کف', namePs: 'کټ کف' },
      { id: 'o2_3', nameEn: 'Plain Sleeve (No Cuff)', nameFa: 'استین ساده', namePs: 'ساده لستوڼی' },
      { id: 'o2_4', nameEn: 'Double Button Cuff', nameFa: 'کف دو دکمه', namePs: 'دوه تڼۍ کف' },
    ],
  },
  {
    id: 'd3',
    key: 'damanStyle',
    titleEn: 'Daman Style (Hem)',
    titleFa: 'شیپ دامن',
    titlePs: 'د دامن ډول',
    allowCustomInput: true,
    options: [
      { id: 'o3_1', nameEn: 'Round Daman (Kol)', nameFa: 'کول دامن (ګرد)', namePs: 'کول دامن (ګرد)' },
      { id: 'o3_2', nameEn: 'Square Daman (Char Kunj)', nameFa: 'چارکنج دامن (چوکور)', namePs: 'چوکور دامن' },
      { id: 'o3_3', nameEn: 'Slanted Daman', nameFa: 'دامن کږه', namePs: 'کږه دامن' },
    ],
  },
  {
    id: 'd4',
    key: 'frontPocket',
    titleEn: 'Front Chest Pocket',
    titleFa: 'جیب رو / سینه',
    titlePs: 'د سینې جېب',
    allowCustomInput: true,
    options: [
      { id: 'o4_1', nameEn: 'One Chest Pocket', nameFa: 'یک جیب رو', namePs: 'یو د سینې جېب' },
      { id: 'o4_2', nameEn: 'Two Chest Pockets', nameFa: 'دو جیب رو', namePs: 'دوه د سینې جېبونه' },
      { id: 'o4_3', nameEn: 'No Chest Pocket', nameFa: 'بی جیب رو', namePs: 'بې د سینې جېب' },
      { id: 'o4_4', nameEn: 'Zipper Pocket', nameFa: 'جیب زیپ دار', namePs: 'زیپ لرونکی جېب' },
    ],
  },
  {
    id: 'd5',
    key: 'sidePocket',
    titleEn: 'Side Pockets',
    titleFa: 'جیب بغل',
    titlePs: 'د اړخ (بغل) جېبونه',
    allowCustomInput: true,
    options: [
      { id: 'o5_1', nameEn: 'Two Side Pockets', nameFa: 'دو جیب بغل', namePs: 'دوه د بغل جېبونه' },
      { id: 'o5_2', nameEn: 'One Side Pocket', nameFa: 'یک جیب بغل', namePs: 'یو د بغل جېب' },
      { id: 'o5_3', nameEn: 'No Side Pocket', nameFa: 'بی جیب بغل', namePs: 'بې د بغل جېب' },
    ],
  },
  {
    id: 'd6',
    key: 'trouserPocket',
    titleEn: 'Trouser Pocket',
    titleFa: 'جیب تنبان',
    titlePs: 'د پرتوګ (تنبان) جېب',
    allowCustomInput: true,
    options: [
      { id: 'o6_1', nameEn: 'One Trouser Pocket', nameFa: 'یک جیب تنبان', namePs: 'یو د پرتوګ جېب' },
      { id: 'o6_2', nameEn: 'Two Trouser Pockets', nameFa: 'دو جیب تنبان', namePs: 'دوه د پرتوګ جېبونه' },
      { id: 'o6_3', nameEn: 'Zipper Pocket', nameFa: 'جیب زیپ دار تنبان', namePs: 'زیپ لرونکی تنبان جېب' },
      { id: 'o6_4', nameEn: 'No Pocket', nameFa: 'بی جیب', namePs: 'بې جېب' },
    ],
  },
  {
    id: 'd7',
    key: 'placketButtons',
    titleEn: 'Buttons & Placket',
    titleFa: 'دکمه و پتی',
    titlePs: 'تڼۍ او پټۍ',
    allowCustomInput: true,
    options: [
      { id: 'o7_1', nameEn: 'Simple Buttons (0.90x14)', nameFa: 'ساده دکمه (0.90x14)', namePs: 'ساده تڼۍ (0.90x14)' },
      { id: 'o7_2', nameEn: 'Concealed Placket (Patah)', nameFa: 'پټه پتی (پټ دکمه)', namePs: 'پټه پټۍ (پټې تڼۍ)' },
      { id: 'o7_3', nameEn: 'Designer Buttons', nameFa: 'دکمه ډیزاین', namePs: 'ډیزایني تڼۍ' },
      { id: 'o7_4', nameEn: 'Pleated Placket', nameFa: 'پتی چین دار', namePs: 'چین دار پټۍ' },
    ],
  },
  {
    id: 'd8',
    key: 'trouserStyle',
    titleEn: 'Trouser Fit / Style',
    titleFa: 'شیپ تنبان',
    titlePs: 'د تنبان / پرتوګ سټایل',
    allowCustomInput: true,
    options: [
      { id: 'o8_1', nameEn: 'Normal Width (22 in)', nameFa: 'نارمل 22', namePs: 'نارمل 22' },
      { id: 'o8_2', nameEn: 'Wide Afghan Cut (24 in)', nameFa: 'فراخ افغانی 24', namePs: 'پراخه افغاني 24' },
      { id: 'o8_3', nameEn: 'Slim Fit (20 in)', nameFa: 'تنگ / فټ 20', namePs: 'تنګ / فټ 20' },
      { id: 'o8_4', nameEn: 'Elastic Waist (Kash)', nameFa: 'کمر کش دار', namePs: 'کش لرونکی کمر' },
    ],
  },
];

const INITIAL_DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: 'فرهاد',
    phone: '0765445309',
    whatsapp: '0765445309',
    notes: 'مشتری دایمی - دوخت کالر دار',
    standardMeasurements: {
      qad: '40',
      shana: '19.5',
      asteen: '21',
      yakhan: '16.75',
      chati: '23.5',
      baghal: '23.5',
      kamar: '24',
      daman: '25',
      tunban: '37.5',
      pacha: '8',
    },
    preferredGarmentType: 'perahanTunban',
    createdAt: '2026-08-23T06:35:30Z',
    updatedAt: '2026-08-23T06:35:30Z',
    totalOrdersCount: 1,
    totalSpent: 1800,
    totalBalance: 0,
  },
  {
    id: 'cust_2',
    name: 'شکیل خان',
    phone: '0782930005',
    whatsapp: '0782930005',
    notes: 'فرمایش هفت غاره و شانه نیمه دون',
    standardMeasurements: {
      qad: '26.75',
      shana: '16.25',
      asteen: '17',
      yakhan: '17',
      chati: '39.5',
      kamar: '36.25',
      surin: '40',
    },
    preferredGarmentType: 'perahanTunban',
    createdAt: '2026-08-23T06:58:17Z',
    updatedAt: '2026-08-23T06:58:17Z',
    totalOrdersCount: 1,
    totalSpent: 1600,
    totalBalance: 0,
  },
  {
    id: 'cust_3',
    name: 'عطا الله',
    phone: '0780372506',
    whatsapp: '0780372506',
    notes: 'پیراهن تنبان با واسکت و پټه پتی',
    standardMeasurements: {
      qad: '39',
      shana: '18.5',
      asteen: '22',
      yakhan: '16.5',
      chati: '24',
      baghal: '22.5',
      kamar: '24',
      daman: '26',
      tunban: '38',
      pacha: '8.5',
    },
    preferredGarmentType: 'perahanTunban',
    createdAt: '2026-08-23T08:00:00Z',
    updatedAt: '2026-08-23T08:00:00Z',
    totalOrdersCount: 1,
    totalSpent: 3200,
    totalBalance: 2700,
  },
];

const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ord_1',
    orderNumber: '16308',
    customerId: 'cust_1',
    customerName: 'فرهاد',
    customerPhone: '0765445309',
    customerWhatsApp: '0765445309',
    garmentType: 'پیراهن و تنبان (Perahan Tunban)',
    quantity: 1,
    fabricId: 'fab_1',
    fabricName: 'لته سفید اعلا (Classic White Latha)',
    fabricColor: 'سفید / White',
    fabricMeters: 4,
    measurements: {
      qad: '40',
      shana: '19.5',
      asteen: '21',
      yakhan: '16.75',
      chati: '23.5',
      baghal: '23.5',
      kamar: '24',
      daman: '25',
      tunban: '37.5',
      pacha: '8',
    },
    designSelections: {
      yakhanShape: 'کالر',
      cuffStyle: 'کول کف (9.25)',
      damanStyle: 'کول دامن',
      placketButtons: 'ساده دکمه 0.90 14',
      sidePocket: 'دو جیب بغل',
      frontPocket: 'یک جیب رو',
      trouserPocket: 'جیب تنبان',
      trouserStyle: 'نارمل 22',
    },
    specialInstructions: 'کالر یی 1.75 راشی',
    cabinetSlot: 'D1',
    items: [],
    totalAmount: 1800,
    paidAmount: 1800,
    balanceAmount: 0,
    paymentStatus: 'paid',
    status: 'ready',
    orderDate: '2026-08-23 06:35',
    deliveryDate: '2026-08-28',
    createdAt: '2026-08-23T06:35:30Z',
    updatedAt: '2026-08-23T06:35:30Z',
  },
  {
    id: 'ord_2',
    orderNumber: '435',
    customerId: 'cust_2',
    customerName: 'شکیل خان',
    customerPhone: '0782930005',
    customerWhatsApp: '0782930005',
    garmentType: 'پیراهن و تنبان (Perahan Tunban)',
    quantity: 1,
    fabricId: 'fab_2',
    fabricName: 'ابریشم بوسکی کرمی (Silk Boski Cream)',
    fabricColor: 'کرمی / Off-White',
    fabricMeters: 4,
    measurements: {
      qad: '26.75',
      shana: '16.25',
      asteen: '17',
      yakhan: '17',
      chati: '39.5',
      kamar: '36.25',
      surin: '40',
    },
    designSelections: {
      yakhanShape: 'هفت غاره',
      shoulderSlope: 'شانه نیمه دون کوپ',
    },
    specialInstructions: 'دوخت دقیق و نرم',
    cabinetSlot: 'C4',
    items: [],
    totalAmount: 1600,
    paidAmount: 1600,
    balanceAmount: 0,
    paymentStatus: 'paid',
    status: 'in_progress',
    orderDate: '2026-08-23 06:58',
    deliveryDate: '2026-08-29',
    createdAt: '2026-08-23T06:58:17Z',
    updatedAt: '2026-08-23T06:58:17Z',
  },
  {
    id: 'ord_3',
    orderNumber: '18861',
    customerId: 'cust_3',
    customerName: 'عطا الله',
    customerPhone: '0780372506',
    customerWhatsApp: '0780372506',
    garmentType: 'پیراهن و تنبان (Perahan Tunban)',
    quantity: 2,
    isCustomerFabric: true,
    fabricName: 'رخت از خود مشتری (Customer Own Fabric)',
    measurements: {
      qad: '39',
      shana: '18.5',
      asteen: '22',
      yakhan: '16.5',
      chati: '24',
      baghal: '22.5',
      kamar: '24',
      daman: '26',
      tunban: '38',
      pacha: '8.5',
    },
    designSelections: {
      yakhanShape: 'کالر',
      cuffStyle: 'کټ کف',
      damanStyle: 'کول دامن (ګرد)',
      frontPocket: 'یک جیب رو',
      sidePocket: 'دو جیب بغل',
      placketButtons: 'پټه پتی',
    },
    specialInstructions: 'پیراهن تنبان + واسکت',
    cabinetSlot: 'D1 & C4',
    items: [],
    totalAmount: 3200,
    paidAmount: 500,
    balanceAmount: 2700,
    paymentStatus: 'partial',
    status: 'pending',
    orderDate: '2026-08-23 08:00',
    deliveryDate: '2026-08-30',
    createdAt: '2026-08-23T08:00:00Z',
    updatedAt: '2026-08-23T08:00:00Z',
  },
];

// Helper to safely load data
function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) {
      return defaultValue;
    }
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
      return defaultValue;
    }
    return parsed;
  } catch {
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Background sync helper to API if online
async function apiSync(endpoint: string, method = 'GET', data?: any) {
  try {
    const res = await fetch(`/api/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful offline fallback
  }
  return null;
}

// Storage Operations
export const storageService = {
  // Fabrics
  getFabrics(): Fabric[] {
    const list = getStoredItem<Fabric[]>(STORAGE_KEYS.FABRICS, []);
    return Array.isArray(list) ? list : [];
  },

  getFabricById(id: string): Fabric | undefined {
    const fabrics = this.getFabrics() || [];
    return fabrics.find(f => f.id === id || f.code === id);
  },

  saveFabric(fabric: Fabric): Fabric {
    const fabrics = this.getFabrics() || [];
    const existingIndex = fabrics.findIndex(f => f.id === fabric.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      fabrics[existingIndex] = { ...fabric, updatedAt: now };
    } else {
      fabrics.unshift({
        ...fabric,
        id: fabric.id || 'fab_' + Date.now(),
        createdAt: fabric.createdAt || now,
        updatedAt: now,
      });
    }

    setStoredItem(STORAGE_KEYS.FABRICS, fabrics);
    apiSync('fabrics', 'POST', fabric);
    return fabric;
  },

  deleteFabric(id: string): void {
    const fabrics = (this.getFabrics() || []).filter(f => f.id !== id);
    setStoredItem(STORAGE_KEYS.FABRICS, fabrics);
    apiSync(`fabrics/${id}`, 'DELETE');
  },

  deductFabricStock(fabricId: string, metersUsed: number): void {
    if (!fabricId || metersUsed <= 0) return;
    const fabrics = this.getFabrics() || [];
    const fabric = fabrics.find(f => f.id === fabricId);
    if (fabric) {
      fabric.stockMeters = Math.max(0, Number(fabric.stockMeters || 0) - Number(metersUsed));
      fabric.updatedAt = new Date().toISOString();
      setStoredItem(STORAGE_KEYS.FABRICS, fabrics);
      apiSync('fabrics', 'POST', fabric);
    }
  },

  // Products & Retail Inventory
  getProducts(): Product[] {
    const list = getStoredItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    return Array.isArray(list) ? list : [];
  },

  getProductById(id: string): Product | undefined {
    const products = this.getProducts() || [];
    return products.find(p => p.id === id);
  },

  saveProduct(product: Partial<Product> & { name: string; category: string; purchasePrice: number; stockQuantity: number }): Product {
    const products = this.getProducts() || [];
    const now = new Date().toISOString();
    const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const fullProduct: Product = {
      id,
      name: product.name,
      category: product.category,
      vendor: product.vendor || '',
      brand: product.brand || '',
      purchasePrice: Number(product.purchasePrice) || 0,
      stockQuantity: Number(product.stockQuantity) || 0,
      lowStockThreshold: product.lowStockThreshold !== undefined ? Number(product.lowStockThreshold) : 2,
      description: product.description || '',
      createdAt: product.createdAt || now,
      updatedAt: now,
    };

    const existingIndex = products.findIndex(p => p.id === id);
    if (existingIndex >= 0) {
      products[existingIndex] = fullProduct;
    } else {
      products.unshift(fullProduct);
    }

    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    apiSync('products', 'POST', fullProduct);
    return fullProduct;
  },

  deleteProduct(id: string): void {
    let products = this.getProducts() || [];
    products = products.filter(p => p.id !== id);
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    apiSync(`products/${id}`, 'DELETE');
  },

  // Product Categories
  getProductCategories(): ProductCategory[] {
    const list = getStoredItem<any[]>(STORAGE_KEYS.PRODUCT_CATEGORIES, DEFAULT_PRODUCT_CATEGORIES);
    const safeList = Array.isArray(list) && list.length > 0 ? list : DEFAULT_PRODUCT_CATEGORIES;
    return safeList.map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `cat_${idx}_${item.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, name: item };
      }
      return item as ProductCategory;
    });
  },

  saveProductCategory(name: string): ProductCategory {
    const trimmed = name.trim();
    const list = this.getProductCategories();
    const existing = list.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const newCat: ProductCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
    };
    list.push(newCat);
    setStoredItem(STORAGE_KEYS.PRODUCT_CATEGORIES, list);
    return newCat;
  },

  deleteProductCategory(idOrName: string): ProductCategory[] {
    let list = this.getProductCategories();
    list = list.filter(c => c.id !== idOrName && c.name !== idOrName);
    setStoredItem(STORAGE_KEYS.PRODUCT_CATEGORIES, list);
    return list;
  },

  // Product Vendors
  getProductVendors(): string[] {
    const list = getStoredItem<string[]>(STORAGE_KEYS.PRODUCT_VENDORS, DEFAULT_PRODUCT_VENDORS);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_PRODUCT_VENDORS;
  },

  saveProductVendor(name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return this.getProductVendors();
    const list = this.getProductVendors();
    if (!list.includes(trimmed)) {
      list.push(trimmed);
      setStoredItem(STORAGE_KEYS.PRODUCT_VENDORS, list);
    }
    return list;
  },

  deleteProductVendor(name: string): string[] {
    let list = this.getProductVendors();
    list = list.filter(v => v !== name);
    setStoredItem(STORAGE_KEYS.PRODUCT_VENDORS, list);
    return list;
  },

  // Product Brands
  getProductBrands(): string[] {
    const list = getStoredItem<string[]>(STORAGE_KEYS.PRODUCT_BRANDS, DEFAULT_PRODUCT_BRANDS);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_PRODUCT_BRANDS;
  },

  saveProductBrand(name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return this.getProductBrands();
    const list = this.getProductBrands();
    if (!list.includes(trimmed)) {
      list.push(trimmed);
      setStoredItem(STORAGE_KEYS.PRODUCT_BRANDS, list);
    }
    return list;
  },

  deleteProductBrand(name: string): string[] {
    let list = this.getProductBrands();
    list = list.filter(b => b !== name);
    setStoredItem(STORAGE_KEYS.PRODUCT_BRANDS, list);
    return list;
  },

  // Product Sales
  getProductSales(): ProductSale[] {
    const list = getStoredItem<ProductSale[]>(STORAGE_KEYS.PRODUCT_SALES, []);
    return Array.isArray(list) ? list : [];
  },

  recordProductSale(sale: {
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    sellingPrice: number;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }): ProductSale {
    const products = this.getProducts() || [];
    const product = products.find(p => p.id === sale.productId);
    const purchasePrice = product ? Number(product.purchasePrice) || 0 : 0;
    const qty = Math.max(1, Number(sale.quantity) || 1);
    const sellingPrice = Number(sale.sellingPrice) || 0;
    const totalAmount = sellingPrice * qty;
    const profit = (sellingPrice - purchasePrice) * qty;

    const newSale: ProductSale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: sale.productId,
      productName: sale.productName,
      category: sale.category,
      quantity: qty,
      purchasePrice,
      sellingPrice,
      totalAmount,
      profit,
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      saleDate: new Date().toISOString(),
      notes: sale.notes,
    };

    // Deduct stock from product
    if (product) {
      product.stockQuantity = Math.max(0, (Number(product.stockQuantity) || 0) - qty);
      product.updatedAt = new Date().toISOString();
      setStoredItem(STORAGE_KEYS.PRODUCTS, products);
      apiSync('products', 'POST', product);
    }

    const sales = this.getProductSales();
    sales.unshift(newSale);
    setStoredItem(STORAGE_KEYS.PRODUCT_SALES, sales);
    apiSync('product-sales', 'POST', newSale);

    return newSale;
  },

  saveProductSale(sale: {
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    purchasePrice?: number;
    sellingPrice: number;
    totalAmount?: number;
    profit?: number;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    paymentMethod?: string;
    notes?: string;
  }): ProductSale {
    return this.recordProductSale(sale);
  },

  // Orders
  getOrders(): Order[] {
    const list = getStoredItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    return Array.isArray(list) ? list : [];
  },

  getOrderById(id: string): Order | undefined {
    const orders = this.getOrders() || [];
    return orders.find(o => o.id === id || o.orderNumber === id);
  },

  saveOrder(order: Order): Order {
    const orders = this.getOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);

    if (existingIndex >= 0) {
      orders[existingIndex] = { ...order, updatedAt: new Date().toISOString() };
    } else {
      orders.unshift({
        ...order,
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // If new order used fabric from inventory, auto-deduct stock
      if (order.fabricId && order.fabricMeters && order.fabricMeters > 0) {
        this.deductFabricStock(order.fabricId, order.fabricMeters);
      }
    }

    setStoredItem(STORAGE_KEYS.ORDERS, orders);
    this.syncCustomerFromOrder(order);
    apiSync('orders', 'POST', order);

    return order;
  },

  deleteOrder(id: string): void {
    const orders = this.getOrders().filter(o => o.id !== id);
    setStoredItem(STORAGE_KEYS.ORDERS, orders);
    apiSync(`orders/${id}`, 'DELETE');
  },

  // Automatically update/create customer when an order is saved
  syncCustomerFromOrder(order: Order): void {
    const customers = this.getCustomers() || [];
    const cleanPhone = order.customerPhone.trim();
    const cleanName = order.customerName.trim();

    let customer = customers.find(
      c => (cleanPhone && c.phone.trim() === cleanPhone) || c.id === order.customerId
    );

    const now = new Date().toISOString();

    if (customer) {
      // Update existing customer
      customer.name = cleanName || customer.name;
      customer.phone = cleanPhone || customer.phone;
      if (order.customerWhatsApp) customer.whatsapp = order.customerWhatsApp;
      if (order.measurements && Object.keys(order.measurements).length > 0) {
        customer.standardMeasurements = {
          ...customer.standardMeasurements,
          ...order.measurements,
        };
      }
      customer.preferredGarmentType = order.garmentType || customer.preferredGarmentType;
      customer.updatedAt = now;
      this.recalculateCustomerStats(customer.id);
    } else {
      // Create new customer
      const newCustomer: Customer = {
        id: order.customerId || 'cust_' + Date.now(),
        name: cleanName || 'مشتری بدون نام',
        phone: cleanPhone,
        whatsapp: order.customerWhatsApp || cleanPhone,
        notes: order.specialInstructions || '',
        standardMeasurements: order.measurements || {},
        preferredGarmentType: order.garmentType || 'perahanTunban',
        createdAt: now,
        updatedAt: now,
        totalOrdersCount: 1,
        totalSpent: order.totalAmount,
        totalBalance: order.balanceAmount,
      };
      customers.unshift(newCustomer);
      setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
    }
  },

  recalculateCustomerStats(customerId: string): void {
    const orders = (this.getOrders() || []).filter(o => o.customerId === customerId);
    const customers = this.getCustomers() || [];
    const customer = customers.find(c => c.id === customerId);

    if (customer) {
      customer.totalOrdersCount = orders.length;
      customer.totalSpent = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      customer.totalBalance = orders.reduce((sum, o) => sum + (Number(o.balanceAmount) || 0), 0);
      setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
    }
  },

  // Customers
  getCustomers(): Customer[] {
    const list = getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    return Array.isArray(list) ? list : [];
  },

  getCustomerById(id: string): Customer | undefined {
    const customers = this.getCustomers() || [];
    return customers.find(c => c.id === id);
  },

  findCustomerByPhoneOrName(query: string): Customer[] {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const customers = this.getCustomers() || [];
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  },

  saveCustomer(customer: Customer): Customer {
    const customers = this.getCustomers() || [];
    const existingIndex = customers.findIndex(c => c.id === customer.id);

    if (existingIndex >= 0) {
      customers[existingIndex] = { ...customer, updatedAt: new Date().toISOString() };
    } else {
      customers.unshift({
        ...customer,
        id: customer.id || 'cust_' + Date.now(),
        createdAt: customer.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
    apiSync('customers', 'POST', customer);
    return customer;
  },

  deleteCustomer(id: string): void {
    const customers = (this.getCustomers() || []).filter(c => c.id !== id);
    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
    apiSync(`customers/${id}`, 'DELETE');
  },

  // Design Categories
  getDesignCategories(): DesignCategory[] {
    const list = getStoredItem<DesignCategory[]>(STORAGE_KEYS.DESIGN_CATEGORIES, DEFAULT_DESIGN_CATEGORIES);
    return Array.isArray(list) ? list : DEFAULT_DESIGN_CATEGORIES;
  },

  saveDesignCategories(categories: DesignCategory[]): void {
    setStoredItem(STORAGE_KEYS.DESIGN_CATEGORIES, categories);
    apiSync('design-categories', 'POST', categories);
  },

  // Measurement Fields
  getMeasurementFields(): MeasurementField[] {
    const list = getStoredItem<MeasurementField[]>(STORAGE_KEYS.MEASUREMENT_FIELDS, DEFAULT_MEASUREMENT_FIELDS);
    return Array.isArray(list) ? list : DEFAULT_MEASUREMENT_FIELDS;
  },

  saveMeasurementFields(fields: MeasurementField[]): void {
    setStoredItem(STORAGE_KEYS.MEASUREMENT_FIELDS, fields);
    apiSync('measurement-fields', 'POST', fields);
  },

  // Shop Settings
  getShopSettings(): ShopSettings {
    const settings = getStoredItem<ShopSettings>(STORAGE_KEYS.SHOP_SETTINGS, DEFAULT_SHOP_SETTINGS);
    return settings;
  },

  saveShopSettings(settings: ShopSettings): void {
    setStoredItem(STORAGE_KEYS.SHOP_SETTINGS, settings);
    apiSync('shop-settings', 'POST', settings);
  },

  // Auth User Session
  getAuthUser(): { email: string; name: string } | null {
    return getStoredItem<{ email: string; name: string } | null>(STORAGE_KEYS.AUTH_USER, null);
  },

  saveAuthUser(user: { email: string; name: string } | null): void {
    if (user) {
      setStoredItem(STORAGE_KEYS.AUTH_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  },

  // Language
  getLanguage(): 'en' | 'fa' | 'ps' {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (stored === 'en' || stored === 'fa' || stored === 'ps') {
      return stored;
    }
    return 'fa'; // Default to Dari / دری
  },

  saveLanguage(lang: 'en' | 'fa' | 'ps'): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  // Backup & Export / Import
  exportFullDatabase(): string {
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      shopSettings: this.getShopSettings(),
      customers: this.getCustomers(),
      fabrics: this.getFabrics(),
      products: this.getProducts(),
      productCategories: this.getProductCategories(),
      productVendors: this.getProductVendors(),
      productBrands: this.getProductBrands(),
      productSales: this.getProductSales(),
      orders: this.getOrders(),
      designCategories: this.getDesignCategories(),
      measurementFields: this.getMeasurementFields(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullDatabase(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.shopSettings) setStoredItem(STORAGE_KEYS.SHOP_SETTINGS, data.shopSettings);
      if (data.customers) setStoredItem(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.fabrics) setStoredItem(STORAGE_KEYS.FABRICS, data.fabrics);
      if (data.products) setStoredItem(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.productCategories) setStoredItem(STORAGE_KEYS.PRODUCT_CATEGORIES, data.productCategories);
      if (data.productVendors) setStoredItem(STORAGE_KEYS.PRODUCT_VENDORS, data.productVendors);
      if (data.productBrands) setStoredItem(STORAGE_KEYS.PRODUCT_BRANDS, data.productBrands);
      if (data.productSales) setStoredItem(STORAGE_KEYS.PRODUCT_SALES, data.productSales);
      if (data.orders) setStoredItem(STORAGE_KEYS.ORDERS, data.orders);
      if (data.designCategories) setStoredItem(STORAGE_KEYS.DESIGN_CATEGORIES, data.designCategories);
      if (data.measurementFields) setStoredItem(STORAGE_KEYS.MEASUREMENT_FIELDS, data.measurementFields);
      return true;
    } catch (err) {
      console.error('Failed to import database JSON:', err);
      return false;
    }
  },

  resetAllToDemo(): void {
    setStoredItem(STORAGE_KEYS.ORDERS, INITIAL_DEMO_ORDERS);
    setStoredItem(STORAGE_KEYS.CUSTOMERS, INITIAL_DEMO_CUSTOMERS);
    setStoredItem(STORAGE_KEYS.FABRICS, INITIAL_DEMO_FABRICS);
    setStoredItem(STORAGE_KEYS.PRODUCTS, INITIAL_DEMO_PRODUCTS);
    setStoredItem(STORAGE_KEYS.PRODUCT_CATEGORIES, DEFAULT_PRODUCT_CATEGORIES);
    setStoredItem(STORAGE_KEYS.PRODUCT_VENDORS, DEFAULT_PRODUCT_VENDORS);
    setStoredItem(STORAGE_KEYS.PRODUCT_BRANDS, DEFAULT_PRODUCT_BRANDS);
    setStoredItem(STORAGE_KEYS.PRODUCT_SALES, []);
    setStoredItem(STORAGE_KEYS.DESIGN_CATEGORIES, DEFAULT_DESIGN_CATEGORIES);
    setStoredItem(STORAGE_KEYS.MEASUREMENT_FIELDS, DEFAULT_MEASUREMENT_FIELDS);
    setStoredItem(STORAGE_KEYS.SHOP_SETTINGS, DEFAULT_SHOP_SETTINGS);
  },

  generateNextOrderNumber(): string {
    const orders = this.getOrders();
    if (orders.length === 0) return '16309';
    const numbers = orders
      .map(o => parseInt(o.orderNumber, 10))
      .filter(n => !isNaN(n));
    if (numbers.length === 0) return (10000 + Math.floor(Math.random() * 90000)).toString();
    const max = Math.max(...numbers);
    return (max + 1).toString();
  },

  // Pull latest data from PostgreSQL database if available
  async syncFromDatabase(): Promise<void> {
    try {
      const [fabricsRes, ordersRes, customersRes, productsRes, productSalesRes] = await Promise.all([
        fetch('/api/fabrics').catch(() => null),
        fetch('/api/orders').catch(() => null),
        fetch('/api/customers').catch(() => null),
        fetch('/api/products').catch(() => null),
        fetch('/api/product-sales').catch(() => null)
      ]);

      if (fabricsRes && fabricsRes.ok) {
        const data = await fabricsRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setStoredItem(STORAGE_KEYS.FABRICS, data);
        }
      }

      if (ordersRes && ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setStoredItem(STORAGE_KEYS.ORDERS, data);
        }
      }

      if (customersRes && customersRes.ok) {
        const data = await customersRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setStoredItem(STORAGE_KEYS.CUSTOMERS, data);
        }
      }

      if (productsRes && productsRes.ok) {
        const data = await productsRes.json();
        if (Array.isArray(data)) setStoredItem(STORAGE_KEYS.PRODUCTS, data);
      }

      if (productSalesRes && productSalesRes.ok) {
        const data = await productSalesRes.json();
        if (Array.isArray(data)) setStoredItem(STORAGE_KEYS.PRODUCT_SALES, data);
      }
    } catch (e) {
      console.log('Database initial sync handled in local mode');
    }
  }
};
