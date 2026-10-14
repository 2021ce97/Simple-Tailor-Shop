import React, { useRef, useState, useEffect } from 'react';
import { 
  Order, 
  ShopSettings, 
  Language, 
  MeasurementField, 
  DesignCategory,
  ReceiptPaperFormat
} from '../types';
import { translations } from '../translations/i18n';
import { BarcodeView } from './BarcodeView';
import { QrCodeView } from './QrCodeView';
import { 
  Printer, 
  Download, 
  X, 
  Check, 
  Scissors, 
  Sparkles, 
  FileText,
  User,
  Calendar,
  Phone,
  MapPin,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { printReceiptElement, downloadReceiptPdf } from '../services/printService';

export type ReceiptSlipMode = 'tailor' | 'customer';
const SHOP_QR_URL = 'https://simple-tailor-shop.vercel.app/';

interface ReceiptSlipModalProps {
  order: Order;
  shopSettings: ShopSettings;
  measurementFields?: MeasurementField[];
  designCategories?: DesignCategory[];
  language: Language;
  initialMode?: ReceiptSlipMode;
  onClose: () => void;
}

const copy = {
  en: {
    contact: 'Contact',
    address: 'Address',
    bill: 'Bill No.',
    customer: 'Customer',
    garment: 'Garment',
    garments: 'Garments',
    quantity: 'Qty',
    cabinet: 'Cabinet',
    orderDate: 'Order Date',
    returnDate: 'Return Date',
    deliveryDate: 'Delivery Date',
    totalBill: 'Total Amount',
    totalPaid: 'Total Paid',
    totalRemaining: 'Total Balance',
    specs: 'Specs / Design',
    shape: 'Style / Selection',
    measurements: 'Measurements',
    value: 'Value',
    tailorNotes: 'Tailor Notes',
    noMeasurements: 'No measurements recorded',
    noDesign: 'Standard Style',
    tailorSlipTitle: 'Tailor Production Slip',
    customerReceiptTitle: 'Customer Receipt',
    developedBy: 'Developed by: Rayan Tech solution',
    fabricSource: 'Fabric Source',
    fabricDetails: 'Fabric Details',
    customerFabric: 'Customer Own Fabric',
    shopFabric: 'Shop Fabric',
    phoneBarcode: 'Customer Barcode',
    billBarcode: 'Bill Barcode',
  },
  fa: {
    contact: 'شماره تماس',
    address: 'آدرس',
    bill: 'شماره بل',
    customer: 'مشتری',
    garment: 'لباس',
    garments: 'لباس‌ها',
    quantity: 'تعداد',
    cabinet: 'کابین',
    orderDate: 'تاریخ ثبت',
    returnDate: 'تاریخ واپسی',
    deliveryDate: 'تاریخ تحویل',
    totalBill: 'جمله',
    totalPaid: 'جمله پرداخت',
    totalRemaining: 'جمله باقیات',
    specs: 'مشخصات',
    shape: 'شکل',
    measurements: 'اندازه‌ها',
    value: 'مقدار',
    tailorNotes: 'یادداشت خیاط',
    noMeasurements: 'اندازه‌ای ثبت نشده',
    noDesign: 'استایل ساده',
    tailorSlipTitle: 'برگه مشخصات و اندازه خیاط',
    customerReceiptTitle: 'قبض حساب مشتری',
    developedBy: 'ساخته شده توسط: Rayan Tech solution',
    fabricSource: 'منبع رخت',
    fabricDetails: 'مشخصات تکه (پارچه)',
    customerFabric: 'تکه از خود مشتری',
    shopFabric: 'تکه از دکان',
    phoneBarcode: 'بارکود مشتری',
    billBarcode: 'بارکود بل',
  },
  ps: {
    contact: 'د اړیکې شمېره',
    address: 'پته',
    bill: 'د بِل شمېره',
    customer: 'پېرودونکی',
    garment: 'کالي',
    garments: 'کالي',
    quantity: 'تعداد',
    cabinet: 'کابین',
    orderDate: 'د ثبت نېټه',
    returnDate: 'د واپسی نېټه',
    deliveryDate: 'د سپارلو نېټه',
    totalBill: 'جمله (ټول)',
    totalPaid: 'جمله پرداخت',
    totalRemaining: 'جمله باقیات',
    specs: 'ځانګړنې',
    shape: 'شکل / بڼه',
    measurements: 'اندازې',
    value: 'اندازه',
    tailorNotes: 'د خیاط یادښت',
    noMeasurements: 'اندازې نه دي ثبت شوي',
    noDesign: 'ساده سټایل',
    tailorSlipTitle: 'د خیاط کاري پاڼه او اندازې',
    customerReceiptTitle: 'د پیرودونکي رسید او بِل',
    developedBy: 'جوړونکی: Rayan Tech solution',
    fabricSource: 'د رخت سرچینه',
    fabricDetails: 'د رخت / ټوکر مشخصات',
    customerFabric: 'د مشتري خپل رخت',
    shopFabric: 'د دوکان رخت',
    phoneBarcode: 'د پیرودونکي بارکوډ',
    billBarcode: 'د بِل بارکوډ',
  },
} as const;

export const ReceiptSlipModal: React.FC<ReceiptSlipModalProps> = ({
  order,
  shopSettings,
  measurementFields = [],
  designCategories = [],
  language,
  initialMode = 'tailor',
  onClose,
}) => {
  const t = translations[language];
  const dict = copy[language];

  // Active slip mode: workshop slip or customer receipt.
  const [activeMode, setActiveMode] = useState<ReceiptSlipMode>(initialMode);
  const [printFormat, setPrintFormat] = useState<ReceiptPaperFormat>(
    shopSettings.receiptFormat === 'thermal58' || shopSettings.receiptFormat === 'thermal80'
      ? 'a5'
      : shopSettings.receiptFormat || 'a5'
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // References for printable DOM elements
  const mainPrintRef = useRef<HTMLDivElement>(null);
  const tailorPrintRef = useRef<HTMLDivElement>(null);
  const customerPrintRef = useRef<HTMLDivElement>(null);

  // Shop details by language
  const shopName = language === 'ps' 
    ? (shopSettings.shopNamePs || shopSettings.shopNameEn) 
    : language === 'fa' 
    ? (shopSettings.shopNameFa || shopSettings.shopNameEn) 
    : shopSettings.shopNameEn;

  const shopAddress = language === 'ps' 
    ? (shopSettings.addressPs || shopSettings.addressEn) 
    : language === 'fa' 
    ? (shopSettings.addressFa || shopSettings.addressEn) 
    : shopSettings.addressEn;

  const currencySymbol = language === 'ps'
    ? (shopSettings.currencyPs || 'افغانۍ')
    : language === 'fa'
    ? (shopSettings.currencyFa || 'افغانی')
    : (shopSettings.currencySymbol || shopSettings.currencyEn || 'AFN');

  const logoUrl = shopSettings.logoUrl || '/royal-kawsar-logo.png';
  const showLogo = shopSettings.receiptShowLogo !== false;
  const showBarcode = shopSettings.receiptShowBarcode !== false;
  const fabricSourceLabel = order.isCustomerFabric ? dict.customerFabric : dict.shopFabric;

  // Active Measurements list
  const activeMeasurements = (measurementFields || [])
    .map(field => {
      const val = order.measurements?.[field.key];
      const label = language === 'ps' ? field.labelPs : language === 'fa' ? field.labelFa : field.labelEn;
      return {
        key: field.key,
        label,
        value: val !== undefined && val !== '' && val !== null ? String(val) : '',
      };
    })
    .filter(m => Boolean(m.value));

  // Active Design list
  const activeDesignItems = Object.entries(order.designSelections || {})
    .map(([catKey, value]) => {
      const cat = (designCategories || []).find(c => c.key === catKey);
      const option = cat?.options.find(
        item => item.nameEn === value || item.nameFa === value || item.namePs === value
      );
      const title = cat 
        ? (language === 'ps' ? cat.titlePs : language === 'fa' ? cat.titleFa : cat.titleEn) 
        : catKey;
      const displayVal = option 
        ? (language === 'ps' ? option.namePs : language === 'fa' ? option.nameFa : option.nameEn) 
        : value;
      return {
        key: catKey,
        title,
        value: displayVal,
      };
    })
    .filter(d => Boolean(d.value));

  // Garment type translation
  const garmentKeys = ['perahanTunban', 'waistcoat', 'suit', 'coatKorti', 'kameezShalwar', 'kurta', 'otherGarment'] as const;
  const localizeGarmentType = (garmentType: string) => {
    const garmentKey = garmentKeys.find(key =>
      translations.en[key] === garmentType || translations.fa[key] === garmentType || translations.ps[key] === garmentType
    );
    return garmentKey ? t[garmentKey] : garmentType;
  };
  const receiptItems = order.items?.length
    ? order.items.map(item => ({
        id: item.id,
        name: localizeGarmentType(item.garmentType),
        quantity: item.quantity,
        measurements: (measurementFields || []).map(field => {
          const value = item.measurements?.[field.key];
          return {
            key: field.key,
            label: language === 'ps' ? field.labelPs : language === 'fa' ? field.labelFa : field.labelEn,
            value: value !== undefined && value !== '' && value !== null ? String(value) : '',
          };
        }).filter(entry => Boolean(entry.value)),
        designs: Object.entries(item.designSelections || {}).map(([categoryKey, value]) => {
          const category = designCategories.find(entry => entry.key === categoryKey);
          const option = category?.options.find(entry => entry.nameEn === value || entry.nameFa === value || entry.namePs === value);
          return {
            key: categoryKey,
            title: category ? (language === 'ps' ? category.titlePs : language === 'fa' ? category.titleFa : category.titleEn) : categoryKey,
            value: option ? (language === 'ps' ? option.namePs : language === 'fa' ? option.nameFa : option.nameEn) : value,
          };
        }).filter(entry => Boolean(entry.value)),
      }))
    : order.garmentType.split(/\s*\+\s*/).map((garmentType, index) => ({
        id: `legacy-${index}`,
        name: localizeGarmentType(garmentType),
        quantity: index === 0 ? (order.quantity || 1) : 1,
        measurements: index === 0 ? activeMeasurements : [],
        designs: index === 0 ? activeDesignItems : [],
      }));
  const receiptQuantity = order.items?.length
    ? receiptItems.reduce((sum, item) => sum + item.quantity, 0)
    : (order.quantity || 1);

  // Formatting delivery date with time
  const formattedDeliveryDate = order.deliveryDate ? order.deliveryDate : '';
  const orderDateWithTime = order.orderDate || order.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10);

  // Print Active Slip
  const handlePrint = async (targetElement?: HTMLElement | null) => {
    const el = targetElement || mainPrintRef.current;
    if (!el) return;

    await printReceiptElement(el, {
      title: `${shopName} - ${order.orderNumber} - ${activeMode.toUpperCase()}`,
      pageFormat: printFormat,
      dir: language === 'en' ? 'ltr' : 'rtl',
      onStart: () => setIsPrinting(true),
      onComplete: () => setIsPrinting(false),
      onError: (err) => {
        console.error('Print failed:', err);
        setIsPrinting(false);
      }
    });
  };

  // Download PDF
  const handleDownloadPdf = async (modeToDownload: ReceiptSlipMode = activeMode) => {
    let targetEl: HTMLElement | null = null;
    let typeSuffix = 'Slip';

    if (modeToDownload === 'tailor') {
      targetEl = tailorPrintRef.current || mainPrintRef.current;
      typeSuffix = 'Tailor_Slip';
    } else if (modeToDownload === 'customer') {
      targetEl = customerPrintRef.current || mainPrintRef.current;
      typeSuffix = 'Customer_Receipt';
    }

    if (!targetEl) return;

    const safeCustomer = (order.customerName || 'Customer').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const filename = `${shopName.replace(/\s+/g, '_')}_${order.orderNumber}_${typeSuffix}_${printFormat.toUpperCase()}_${safeCustomer}`;

    await downloadReceiptPdf(targetEl, {
      filename,
      pageFormat: printFormat,
      onStart: () => setIsGeneratingPdf(true),
      onComplete: () => setIsGeneratingPdf(false),
      onError: (err) => {
        console.error('PDF error:', err);
        setIsGeneratingPdf(false);
        handlePrint(targetEl);
      }
    });
  };

  // ==========================================
  // RENDER: Tailor Work Slip Component
  // ==========================================
  const renderTailorSlip = (ref?: React.RefObject<HTMLDivElement | null>) => (
    <div 
      ref={ref}
      className="tailor-slip-sheet bg-white text-[#1A1A1A] p-3 text-xs border-2 border-stone-950 font-sans shadow-xs relative select-text"
      style={{
        width: printFormat === 'a6' ? '99mm' : printFormat === 'a5' ? '138mm' : '100%',
        maxWidth: printFormat === 'a4' ? '180mm' : '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
      dir={language === 'en' ? 'ltr' : 'rtl'}
    >
      {/* Reference-inspired monochrome header: code, identity and logo. */}
      <div className="grid grid-cols-[58px_1fr_58px] items-center gap-1 border-b-2 border-stone-950 pb-1 mb-1">
        <div className="flex h-14 items-center justify-center">
          <QrCodeView value={SHOP_QR_URL} size={54} label="Royal Kawsar website QR code" />
        </div>
        <div className="min-w-0 text-center">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-950 font-serif leading-tight break-words">{shopName}</h1>
          <span className="inline-block mt-0.5 rounded-full bg-stone-950 px-3 py-0.5 font-mono text-[11px] font-black text-white">{shopSettings.phone1 || '0771221559'}</span>
        </div>
        <div className="flex h-12 items-center justify-center">
          {showLogo && <img src={logoUrl} alt={shopName} className="h-12 w-12 object-contain" />}
        </div>
      </div>
      <p className="text-center text-[8.5px] font-semibold border-b border-stone-500 pb-1 mb-1">{shopAddress}</p>

      {/* 2. Order & Customer Info Strip */}
      <div className="grid grid-cols-2 border-2 border-stone-950 divide-x-2 divide-stone-950 text-[10px] font-bold bg-white mb-1">
        <div className="p-1 flex items-center justify-between">
          <span className="text-stone-700 text-[9.5px]">{dict.bill}:</span>
          <span className="font-mono font-black text-stone-950 text-xs">{order.orderNumber}</span>
        </div>
        <div className="p-1 flex items-center justify-between">
          <span className="text-stone-700 text-[9.5px]">{dict.customer}:</span>
          <span className="font-black text-stone-950 truncate max-w-[120px] text-xs">{order.customerName}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 border-x-2 border-b-2 border-stone-950 divide-x-2 divide-stone-950 text-[10px] font-bold mb-1.5 -mt-1">
        <div className="p-1 flex items-center justify-between"><span className="text-stone-700">{dict.contact}:</span><span className="font-mono">{order.customerPhone || '---'}</span></div>
        <div className="p-1 flex items-center justify-between"><span className="text-stone-700">{dict.returnDate}:</span><span className="font-mono">{formattedDeliveryDate || '---'}</span></div>
      </div>

      {/* One clear measurement block per garment, matching the paper workflow. */}
      <div className="space-y-1.5 mb-1.5">
        {receiptItems.map(item => (
          <section key={item.id} className="border-2 border-stone-950 break-inside-avoid">
            <div className="flex items-center justify-between bg-stone-950 px-2 py-0.5 text-[10px] font-black text-white">
              <span>{item.name}</span><span className="font-mono">× {item.quantity}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 border-b border-stone-950">
              {item.measurements.length > 0 ? item.measurements.map(measurement => (
                <div key={measurement.key} className="min-h-9 border-e border-b border-stone-500 px-1 py-0.5 text-center last:border-e-0">
                  <div className="text-[8px] font-bold text-stone-700">{measurement.label}</div>
                  <div className="font-mono text-sm font-black leading-tight">{measurement.value}</div>
                </div>
              )) : <div className="col-span-full p-2 text-center text-[9px] italic text-stone-500">{dict.noMeasurements}</div>}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-1.5 py-1 text-[9px] min-h-7">
              {item.designs.length > 0 ? item.designs.map(design => (
                <span key={design.key} className="inline-flex items-center gap-1 font-bold"><span className="inline-block h-3 w-3 border border-stone-950" />{design.title}: <b>{String(design.value)}</b></span>
              )) : <span className="italic text-stone-500">{dict.noDesign}</span>}
            </div>
          </section>
        ))}
      </div>

      {/* 4. Fabric source is always explicit for workshop handling. */}
      <div className="border-2 border-stone-950 bg-stone-50 text-[9.5px] font-semibold mb-1.5 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-1.5 py-1">
          <span className="text-stone-700 font-bold">{dict.fabricSource}:</span>
          <span className={`px-2 py-0.5 rounded-sm font-black ${order.isCustomerFabric ? 'bg-amber-200 text-amber-950' : 'bg-emerald-100 text-emerald-950'}`}>
            {fabricSourceLabel}
          </span>
        </div>
        {(order.fabricName || order.fabricColor) && (
          <div className="border-t border-stone-400 px-1.5 py-1 flex items-center justify-between gap-2">
            <span className="text-stone-600">{dict.fabricDetails}:</span>
            <span className="font-bold text-stone-950 text-end">{order.fabricName || '---'} {order.fabricColor ? `(${order.fabricColor})` : ''}</span>
          </div>
        )}
      </div>

      {/* 5. Special Tailor Instructions Note (if present) */}
      {order.specialInstructions && (
        <div className="p-1 bg-amber-50 border-2 border-stone-950 text-[9.5px] font-semibold text-stone-950 mb-1.5 leading-tight">
          <span className="font-bold text-amber-950 block text-[9px]">{dict.tailorNotes}:</span>
          <span>{order.specialInstructions}</span>
        </div>
      )}

      {/* 6. Cut Line Divider */}
      <div className="my-1 border-t-2 border-dashed border-stone-800 relative text-center">
        <span className="bg-white px-2 text-[8px] text-stone-500 uppercase tracking-widest relative -top-2">
          ✂ {dict.tailorSlipTitle}
        </span>
      </div>

      {/* 7. Return Date & Order Date Strip */}
      <div className="border-2 border-stone-950 bg-stone-100 text-[10px] font-bold p-1 mb-1.5 flex justify-between items-center">
        <div className="flex items-center gap-1">
          <span className="text-stone-700">{dict.returnDate}:</span>
          <span className="font-mono font-black text-stone-950 text-[11px]">{formattedDeliveryDate}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-stone-700">
          <span>{dict.orderDate}:</span>
          <span className="font-mono font-bold text-stone-900">{orderDateWithTime}</span>
        </div>
      </div>

      {/* 8. Barcodes Row (Phone Barcode & Order Barcode) */}
      {showBarcode && (
        <div className="border-2 border-stone-950 p-1 flex justify-between items-center divide-x-2 divide-stone-950 bg-white mb-1.5">
          <div className="flex-1 text-center px-0.5">
            <BarcodeView 
              value={order.customerPhone || '0780000000'} 
              height={22} 
              width={1.05} 
              fontSize={8} 
            />
            <span className="text-[7.5px] text-stone-600 block">{dict.phoneBarcode}</span>
          </div>
          <div className="flex-1 text-center px-0.5">
            <BarcodeView 
              value={order.orderNumber} 
              height={22} 
              width={1.15} 
              fontSize={8} 
            />
            <span className="text-[7.5px] text-stone-600 block">{dict.billBarcode}</span>
          </div>
        </div>
      )}

      {/* 9. Bottom strip with Cabinet & Quantity */}
      <div className="grid grid-cols-2 border-2 border-stone-950 divide-x-2 divide-stone-950 bg-stone-200 text-center font-black text-xs py-1">
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] text-stone-700">{dict.cabinet}:</span>
          <span className="font-mono text-sm text-stone-950">{order.cabinetSlot || '---'}</span>
        </div>
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] text-stone-700">{dict.quantity}:</span>
          <span className="font-mono text-sm text-stone-950">{receiptQuantity}</span>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // RENDER: Customer Receipt Component
  // ==========================================
  const renderCustomerReceipt = (ref?: React.RefObject<HTMLDivElement | null>) => (
    <div 
      ref={ref}
      className="customer-receipt-sheet bg-white text-[#1A1A1A] p-3 text-xs border-2 border-stone-950 font-sans shadow-xs relative select-text"
      style={{
        width: printFormat === 'a6' ? '99mm' : printFormat === 'a5' ? '138mm' : '100%',
        maxWidth: printFormat === 'a4' ? '180mm' : '100%',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
      dir={language === 'en' ? 'ltr' : 'rtl'}
    >
      {/* 1. Compact header with permanent website QR. */}
      <div className="grid grid-cols-[58px_1fr_58px] items-center gap-1 border-b-2 border-stone-950 pb-1 mb-1">
        <div className="flex h-14 items-center justify-center">
          <QrCodeView value={SHOP_QR_URL} size={54} label="Royal Kawsar website QR code" />
        </div>
        <div className="min-w-0 text-center">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-950 font-serif leading-tight break-words">{shopName}</h1>
          <span className="inline-block mt-0.5 rounded-full bg-stone-950 px-3 py-0.5 font-mono text-[11px] font-black text-white">{shopSettings.phone1 || '0771221559'}</span>
        </div>
        <div className="flex h-12 items-center justify-center">
          {showLogo && <img src={logoUrl} alt={shopName} className="h-12 w-12 object-contain" />}
        </div>
      </div>
      <div className="mb-1.5 flex items-center justify-between border-b border-stone-500 px-1 pb-1 text-[8.5px] font-semibold">
        <span className="truncate">{shopAddress}</span>
        <span className="ms-2 shrink-0 font-mono font-black">{dict.bill}: {order.orderNumber}</span>
      </div>

      {/* 2. Customer Barcode & Bill Barcode Row (Matching Photo 2) */}
      {showBarcode && (
        <div className="border-2 border-stone-950 p-1 flex justify-between items-center divide-x-2 divide-stone-950 bg-white mb-1.5">
          <div className="flex-1 text-center px-0.5">
            <BarcodeView 
              value={order.orderNumber} 
              height={22} 
              width={1.15} 
              fontSize={8} 
            />
            <span className="text-[7.5px] text-stone-600 block">{dict.billBarcode}</span>
          </div>
          <div className="flex-1 text-center px-0.5">
            <BarcodeView 
              value={order.customerPhone || '0780000000'} 
              height={22} 
              width={1.05} 
              fontSize={8} 
            />
            <span className="text-[7.5px] text-stone-600 block">{dict.phoneBarcode}</span>
          </div>
        </div>
      )}

      {/* 3. Customer & Garment Type Details Box */}
      <div className="border-2 border-stone-950 divide-y-2 divide-stone-950 bg-stone-50 text-[11px] font-bold mb-1.5">
        <div className="grid grid-cols-2 divide-x-2 divide-stone-950 p-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-stone-700 text-[9.5px]">{dict.customer}:</span>
            <span className="font-black text-stone-950 truncate max-w-[110px] text-xs">{order.customerName}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-stone-700 text-[9.5px]">{dict.contact}:</span>
            <span className="font-mono text-stone-950 font-bold text-xs">{order.customerPhone}</span>
          </div>
        </div>
        <div className="bg-white px-2 py-1">
          <div className="flex items-start gap-2">
            <span className="text-stone-700 text-[9px] shrink-0">{dict.garments}:</span>
            <div className="flex flex-1 flex-wrap justify-end gap-x-3 gap-y-0.5">
              {receiptItems.map(item => <span key={item.id} className="font-black text-stone-950 text-[10px]">{item.name} <b className="font-mono">× {item.quantity}</b></span>)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x-2 divide-stone-950 border-t-2 border-stone-950 p-1 bg-white">
          <div className="flex items-center justify-between px-1">
            <span className="text-stone-700 text-[9px]">{dict.quantity}:</span>
            <span className="font-mono font-black text-stone-950 text-xs">{receiptQuantity}</span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-stone-700 text-[9px]">{dict.cabinet}:</span>
            <span className="font-mono font-black text-stone-950 text-xs">{order.cabinetSlot || '---'}</span>
          </div>
        </div>
      </div>

      {/* 4. Dates Box */}
      <div className="grid grid-cols-2 border-2 border-stone-950 divide-x-2 divide-stone-950 bg-stone-100 text-[10px] font-bold p-1 mb-1.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-stone-700">{dict.orderDate}:</span>
          <span className="font-mono font-bold text-stone-900">{orderDateWithTime}</span>
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-stone-700">{dict.returnDate}:</span>
          <span className="font-mono font-black text-stone-950 text-xs">{formattedDeliveryDate}</span>
        </div>
      </div>

      {/* 5. Big Clear Financial Table (جمله, جمله پرداخت, جمله باقیات - Matching Photo 2) */}
      <div className="border-2 border-stone-950 divide-y-2 divide-stone-950 my-1.5">
        <div className="grid grid-cols-3 divide-x-2 divide-stone-950 bg-stone-200 text-center text-[10px] font-black uppercase py-0.5">
          <div>{dict.totalBill}</div>
          <div className="text-emerald-900">{dict.totalPaid}</div>
          <div className="text-rose-900">{dict.totalRemaining}</div>
        </div>
        <div className="grid grid-cols-3 divide-x-2 divide-stone-950 text-center py-1.5 font-bold">
          <div className="px-1">
            <span className="font-mono text-sm font-black text-stone-950 block">{order.totalAmount}</span>
            <span className="text-[8px] text-stone-500 font-normal">{currencySymbol}</span>
          </div>
          <div className="px-1 bg-emerald-50/70">
            <span className="font-mono text-sm font-black text-emerald-700 block">{order.paidAmount}</span>
            <span className="text-[8px] text-emerald-800 font-normal">{currencySymbol}</span>
          </div>
          <div className="px-1 bg-rose-50/70">
            <span className={`font-mono text-sm font-black block ${order.balanceAmount > 0 ? 'text-rose-600' : 'text-stone-800'}`}>
              {order.balanceAmount}
            </span>
            <span className="text-[8px] text-rose-800 font-normal">{currencySymbol}</span>
          </div>
        </div>
      </div>

      {/* 6. Fabric source and details are always included for the customer. */}
      <div className="border-2 border-stone-950 bg-stone-50 text-[9.5px] font-semibold mb-1.5 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-1.5 py-1">
          <span className="text-stone-700 font-bold">{dict.fabricSource}:</span>
          <span className={`px-2 py-0.5 rounded-sm font-black ${order.isCustomerFabric ? 'bg-amber-200 text-amber-950' : 'bg-emerald-100 text-emerald-950'}`}>
            {fabricSourceLabel}
          </span>
        </div>
        {(order.fabricName || order.fabricColor) && (
          <div className="border-t border-stone-400 px-1.5 py-1 flex items-center justify-between gap-2">
            <span className="text-stone-600">{dict.fabricDetails}:</span>
            <span className="font-bold text-stone-950 text-end">{order.fabricName || '---'} {order.fabricColor ? `(${order.fabricColor})` : ''}</span>
          </div>
        )}
      </div>

      {/* 7. Footer Thank you Note & Attribution */}
      <div className="text-center pt-1.5 border-t border-dotted border-stone-300 text-[9px] text-stone-600">
        <p className="font-bold">{language === 'ps' ? shopSettings.receiptFooterPs : language === 'fa' ? shopSettings.receiptFooterFa : shopSettings.receiptFooterEn}</p>
        <p className="text-[8px] text-stone-400 mt-0.5">{dict.developedBy}</p>
      </div>
    </div>
  );

  return (
    <div 
      data-print-format={printFormat} 
      className={`receipt-modal-shell fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto ${isPrinting ? 'is-printing' : ''}`}
    >
      <div 
        id="receipt-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200 border border-[#E5E5E5]"
      >
        {/* ==========================================
            TOP CONTROL BAR: Mode Tabs & Actions
           ========================================== */}
        <div className="receipt-actions px-4 py-3 bg-[#1A1A1A] text-white border-b border-black no-print flex flex-col gap-2.5">
          <div className="flex flex-col min-[430px]:flex-row min-[430px]:items-center justify-between gap-2">
            {/* Title & Order info */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
              <Scissors className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-black tracking-wide">
                {order.orderNumber} - {order.customerName}
              </h2>
            </div>

            {/* Quick actions: Print and Close */}
            <div className="flex items-center justify-between min-[430px]:justify-start gap-1.5 flex-wrap w-full min-[430px]:w-auto">
              {/* Print Button */}
              <button
                type="button"
                onClick={() => handlePrint()}
                id="print-slip-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] hover:bg-[#B39025] active:bg-[#B39025] text-[#1A1A1A] font-black rounded-lg text-xs transition cursor-pointer shadow-xs"
                title={t.print}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.print}</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                id="close-receipt-btn"
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-bar: Format Selector & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
            {/* Mode Switcher Tabs: Tailor Slip | Customer Bill */}
            <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/10 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveMode('tailor')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'tailor'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Scissors className="w-3 h-3" />
                <span>{t.tailorWorkSlip}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('customer')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'customer'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <User className="w-3 h-3" />
                <span>{t.customerReceipt}</span>
              </button>
            </div>

            {/* Paper Size selector */}
            <div className="flex items-center justify-center gap-1 bg-white/10 rounded-xl p-0.5 border border-white/10 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setPrintFormat('a6')}
                className={`px-2 py-1 text-[11px] font-black rounded-md transition cursor-pointer ${
                  printFormat === 'a6'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="A6 Standard Sheet (105×148 mm)"
              >
                A6
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a5')}
                className={`px-2 py-1 text-[11px] font-black rounded-md transition cursor-pointer ${
                  printFormat === 'a5'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="A5 Standard Sheet (148×210 mm)"
              >
                A5
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2 py-1 text-[11px] font-black rounded-md transition cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="A4 Full Sheet"
              >
                A4
              </button>
            </div>
          </div>
        </div>

        {/* ==========================================
            PREVIEW AREA (Scrollable)
           ========================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F9F7F2] flex flex-col items-center justify-start gap-6">
          {/* Active Main Printable Container */}
          <div ref={mainPrintRef} className="print-main-wrapper flex flex-col gap-6 w-full items-center">
            {activeMode === 'tailor' && renderTailorSlip(tailorPrintRef)}
            {activeMode === 'customer' && renderCustomerReceipt(customerPrintRef)}
          </div>
        </div>

        {/* ==========================================
            FOOTER CONTROLS
           ========================================== */}
        <div className="receipt-modal-footer px-3 sm:px-5 py-3 bg-white border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between no-print gap-3">
          {/* Quick specific PDF download triggers */}
          <div className="grid grid-cols-1 min-[430px]:grid-cols-2 gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleDownloadPdf('tailor')}
              className="px-3 py-1.5 text-xs font-bold text-[#1A1A1A] bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t.downloadTailorPdf}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf('customer')}
              className="px-3 py-1.5 text-xs font-bold text-[#1A1A1A] bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-stone-700" />
              <span>{t.downloadCustomerPdf}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-[#706E6B] hover:text-[#1A1A1A] bg-[#F9F7F2] hover:bg-stone-200 rounded-xl transition cursor-pointer border border-[#E5E5E5]"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
