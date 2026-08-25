export type Language = 'en' | 'fa' | 'ps';

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface MeasurementValues {
  [key: string]: string | number;
}

export interface MeasurementField {
  id: string;
  key: string;
  labelEn: string;
  labelFa: string; // Dari / دری
  labelPs: string; // Pashto / پښتو
  unit: string;
  defaultValue?: string;
  isStandard?: boolean;
}

export interface DesignOption {
  id: string;
  nameEn: string;
  nameFa: string;
  namePs: string;
}

export interface DesignCategory {
  id: string;
  key: string;
  titleEn: string;
  titleFa: string;
  titlePs: string;
  options: DesignOption[];
  allowCustomInput?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  notes?: string;
  standardMeasurements?: MeasurementValues;
  preferredGarmentType?: string;
  createdAt: string;
  updatedAt: string;
  totalOrdersCount?: number;
  totalSpent?: number;
  totalBalance?: number;
}

export interface OrderItem {
  id: string;
  garmentType: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  measurements: MeasurementValues;
  designSelections: Record<string, string>; // categoryKey -> optionName or custom string
  fabricNotes?: string;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "16308", "18917"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerWhatsApp?: string;
  
  items: OrderItem[];
  
  // Quick direct access for single-garment orders (most common)
  garmentType: string;
  quantity: number;
  measurements: MeasurementValues;
  designSelections: Record<string, string>;
  specialInstructions?: string;
  cabinetSlot?: string; // Optional tag e.g. "D1", "C4" like on photo

  // Financials
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;

  // Status & Dates
  status: OrderStatus;
  orderDate: string; // YYYY-MM-DD HH:mm
  deliveryDate: string; // YYYY-MM-DD
  completedDate?: string;
  deliveredDate?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ShopSettings {
  shopNameEn: string;
  shopNameFa: string;
  shopNamePs: string;
  taglineEn?: string;
  taglineFa?: string;
  taglinePs?: string;
  phone1: string;
  phone2?: string;
  whatsapp: string;
  addressEn: string;
  addressFa: string;
  addressPs: string;
  currencyEn: string;
  currencyFa: string;
  currencyPs: string;
  receiptFooterEn?: string;
  receiptFooterFa?: string;
  receiptFooterPs?: string;
  logoType?: 'emblem' | 'scissors' | 'sewing' | 'custom';
}
