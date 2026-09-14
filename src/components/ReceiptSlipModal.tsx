import React, { useRef, useState } from 'react';
import { 
  Order, 
  ShopSettings, 
  Language, 
  MeasurementField, 
  DesignCategory 
} from '../types';
import { translations } from '../translations/i18n';
import { BarcodeView } from './BarcodeView';
import { 
  Printer, 
  Download, 
  Share2, 
  X, 
  Check, 
  Scissors, 
  Sparkles, 
  Phone, 
  MessageCircle, 
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { printReceiptElement, downloadReceiptPdf } from '../services/printService';

interface ReceiptSlipModalProps {
  order: Order;
  shopSettings: ShopSettings;
  measurementFields?: MeasurementField[];
  designCategories?: DesignCategory[];
  language: Language;
  onClose: () => void;
  onEdit?: (order: Order) => void;
}

type PrintFormat = 'a4' | 'thermal58' | 'thermal80';

const receiptCopy = {
  en: {
    contact: 'Contact', address: 'Address', bill: 'Bill no.', customer: 'Customer',
    noStyle: 'Standard style', notes: 'Tailor notes', noMeasurements: 'No measurements recorded',
    delivery: 'Delivery date', orderDate: 'Order date', garment: 'Garment',
    quantity: 'Quantity', total: 'Total', paid: 'Paid', balance: 'Balance', developed: 'Developed by: Rayan Tech solution',
  },
  fa: {
    contact: 'شماره تماس', address: 'آدرس', bill: 'شماره بل', customer: 'مشتری',
    noStyle: 'استایل ساده', notes: 'یادداشت خیاط', noMeasurements: 'اندازه‌ای ثبت نشده',
    delivery: 'تاریخ تحویل', orderDate: 'تاریخ ثبت سفارش', garment: 'لباس',
    quantity: 'تعداد', total: 'مجموع', paid: 'پرداخت', balance: 'باقی‌مانده', developed: 'ساخته شده توسط: Rayan Tech solution',
  },
  ps: {
    contact: 'د اړیکې شمېره', address: 'پته', bill: 'د بِل شمېره', customer: 'پېرودونکی',
    noStyle: 'ساده سټایل', notes: 'د خیاط یادښت', noMeasurements: 'اندازې نه دي ثبت شوي',
    delivery: 'د سپارلو نېټه', orderDate: 'د فرمایش نېټه', garment: 'کالي',
    quantity: 'تعداد', total: 'ټول', paid: 'ورکړل شوي', balance: 'پاتې', developed: 'جوړونکی: Rayan Tech solution',
  },
} as const;

export const ReceiptSlipModal: React.FC<ReceiptSlipModalProps> = ({
  order,
  shopSettings,
  measurementFields = [],
  designCategories = [],
  language,
  onClose,
  onEdit,
}) => {
  const t = translations[language];
  const receiptText = receiptCopy[language];
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [printFormat, setPrintFormat] = useState<PrintFormat>(
    (shopSettings.receiptFormat as PrintFormat) || 'thermal80'
  );
  const [isPrinting, setIsPrinting] = useState(false);

  // Sync with shopSettings.receiptFormat if changed externally
  React.useEffect(() => {
    if (shopSettings.receiptFormat) {
      setPrintFormat(shopSettings.receiptFormat as PrintFormat);
    }
  }, [shopSettings.receiptFormat]);

  const thermalStyle = shopSettings.receiptThermalStyle || 'standard';
  const showLogo = shopSettings.receiptShowLogo !== false;
  const showBarcode = shopSettings.receiptShowBarcode !== false;
  const showNotes = shopSettings.receiptShowNotes !== false;
  const headerBlessing = language === 'ps'
    ? shopSettings.receiptHeaderNotePs
    : language === 'fa'
    ? shopSettings.receiptHeaderNoteFa
    : shopSettings.receiptHeaderNoteEn;

  // Shop Name & Details based on language or dual
  const shopName = language === 'ps' 
    ? shopSettings.shopNamePs 
    : language === 'fa' 
    ? shopSettings.shopNameFa 
    : shopSettings.shopNameEn;

  const shopAddress = language === 'ps' 
    ? shopSettings.addressPs 
    : language === 'fa' 
    ? shopSettings.addressFa 
    : shopSettings.addressEn;

  const currencySymbol = language === 'ps'
    ? shopSettings.currencyPs
    : language === 'fa'
    ? shopSettings.currencyFa
    : shopSettings.currencyEn;
  const logoUrl = shopSettings.logoUrl || '/mujeeb-afghan-logo.jpeg';

  // Print Handler (100% reliable across browsers, iframes, and thermal printers)
  const handlePrint = async () => {
    if (!receiptRef.current) return;
    await printReceiptElement(receiptRef.current, {
      title: `${shopName} - ${order.orderNumber}`,
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

  // PDF Generator using printService
  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    const safeCustomerName = order.customerName ? order.customerName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : 'Customer';
    const filename = `Mujeeb_Afghan_${order.orderNumber || 'Order'}_${printFormat}_${safeCustomerName}`;
    await downloadReceiptPdf(receiptRef.current, {
      filename,
      pageFormat: printFormat,
      onStart: () => setIsGeneratingPdf(true),
      onComplete: () => setIsGeneratingPdf(false),
      onError: (err) => {
        console.error('PDF error:', err);
        setIsGeneratingPdf(false);
        // Fallback to direct print
        handlePrint();
      }
    });
  };

  // WhatsApp Share text generator
  const handleWhatsAppShare = () => {
    const balanceText = order.balanceAmount > 0 
      ? `باقیمانده / پاتې: ${order.balanceAmount} ${currencySymbol}` 
      : `حساب تصفیه شده / بشپړ ورکړل شوی`;

    const text = `*${shopName}*
------------------------------
*شماره بل / د بِل شمېره:* ${order.orderNumber}
*مشتری / پېرودونکی:* ${order.customerName}
*تاریخ ثبت:* ${order.orderDate}
*تاریخ تسلیمی / تحویل:* ${order.deliveryDate}
*لباس:* ${order.garmentType} (تعداد: ${order.quantity})
*جمله مبلغ / ټولې پیسې:* ${order.totalAmount} ${currencySymbol}
*پرداخت شده / رسید:* ${order.paidAmount} ${currencySymbol}
*${balanceText}*
------------------------------
${shopSettings.receiptFooterFa || shopSettings.receiptFooterPs || ''}
تلیفون: ${shopSettings.phone1} | واتساپ: ${shopSettings.whatsapp}`;

    const cleanPhone = (order.customerWhatsApp || order.customerPhone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone.startsWith('0') ? '93' + cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank');
  };

  // Map active measurements with values
  const activeMeasurements = (measurementFields || [])
    .map(field => ({
      key: field.key,
      label: language === 'ps' ? field.labelPs : language === 'fa' ? field.labelFa : field.labelEn,
      labelFa: field.labelFa,
      value: order.measurements?.[field.key],
    }))
    .filter(m => m.value !== undefined && m.value !== '' && m.value !== null);

  // Map active design selections with labels
  const activeDesignItems = Object.entries(order.designSelections || {})
    .map(([catKey, value]) => {
      const cat = (designCategories || []).find(c => c.key === catKey);
      const option = cat?.options.find(item =>
        item.nameEn === value || item.nameFa === value || item.namePs === value
      );
      const catTitle = cat 
        ? (language === 'ps' ? cat.titlePs : language === 'fa' ? cat.titleFa : cat.titleEn)
        : catKey;
      return {
        key: catKey,
        title: catTitle,
        value: option ? (language === 'ps' ? option.namePs : language === 'fa' ? option.nameFa : option.nameEn) : value,
      };
    })
    .filter(d => Boolean(d.value));

  const garmentKeys = ['perahanTunban', 'waistcoat', 'suit', 'coatKorti', 'kameezShalwar', 'kurta', 'otherGarment'] as const;
  const displayGarmentType = (() => {
    const garmentKey = garmentKeys.find(key =>
      translations.en[key] === order.garmentType || translations.fa[key] === order.garmentType || translations.ps[key] === order.garmentType
    );
    return garmentKey ? t[garmentKey] : order.garmentType;
  })();

  return (
    <div data-print-format={printFormat} className={`receipt-modal-shell fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto ${isPrinting ? 'is-printing' : ''}`}>
      {/* Dynamic CSS Media Query for Thermal Printer Widths (58mm / 80mm / A4) */}
      <style>{`
        @media print {
          @page {
            size: ${printFormat === 'thermal58' ? '58mm auto' : printFormat === 'thermal80' ? '80mm auto' : 'A4 portrait'};
            margin: ${printFormat === 'thermal58' ? '0mm' : printFormat === 'thermal80' ? '1mm' : '8mm'};
          }
          html, body {
            width: ${printFormat === 'thermal58' ? '54mm' : printFormat === 'thermal80' ? '76mm' : '100%'} !important;
            margin: 0 auto !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #authentic-receipt-slip {
            width: ${printFormat === 'thermal58' ? '54mm' : printFormat === 'thermal80' ? '76mm' : '100%'} !important;
            max-width: ${printFormat === 'thermal58' ? '54mm' : printFormat === 'thermal80' ? '76mm' : '186mm'} !important;
            margin: 0 auto !important;
            padding: ${printFormat === 'thermal58' ? '2mm 1mm' : printFormat === 'thermal80' ? '3mm 2mm' : '6mm'} !important;
            font-size: ${printFormat === 'thermal58' ? '10px' : printFormat === 'thermal80' ? '11px' : '13px'} !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      <div 
        id="receipt-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border border-[#E5E5E5]"
      >
        {/* Header Action Bar */}
        <div className="receipt-actions flex flex-wrap items-center justify-between px-5 py-3.5 bg-[#1A1A1A] text-white border-b border-black no-print gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
            <Scissors className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-bold tracking-wide">
              {t.tailorReceipt} - {order.orderNumber}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Thermal Print-Size Selector */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 border border-white/15">
              <button
                type="button"
                onClick={() => setPrintFormat('thermal80')}
                className={`px-2 py-1 text-[10px] font-black rounded-md transition cursor-pointer ${
                  printFormat === 'thermal80'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="80mm Thermal Paper (POS/Receipt Printer like MY-P80)"
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal58')}
                className={`px-2 py-1 text-[10px] font-black rounded-md transition cursor-pointer ${
                  printFormat === 'thermal58'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="58mm Mini Thermal Paper"
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2 py-1 text-[10px] font-black rounded-md transition cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title="Standard A4 Paper"
              >
                A4
              </button>
            </div>
            <button
              onClick={handlePrint}
              id="print-slip-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] hover:bg-[#B39025] active:bg-[#B39025] text-[#1A1A1A] font-black rounded-lg text-xs transition cursor-pointer shadow-xs"
              title={t.print}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.print}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              id="download-pdf-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-xs transition cursor-pointer border border-white/10 disabled:opacity-50"
              title={t.downloadPdf}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? t.loading : 'PDF'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              id="whatsapp-share-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition cursor-pointer"
              title={t.shareWhatsApp}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              id="close-receipt-btn"
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F9F7F2] flex justify-center">
          {/* Printable Receipt Card matching exact authentic Afghan slip layout */}
          <div 
            ref={receiptRef}
            id="authentic-receipt-slip"
            dir={language === 'en' ? 'ltr' : 'rtl'}
            className={`bg-white border border-[#E5E5E5] shadow-xs p-4 text-[#1A1A1A] text-sm relative select-text rounded-xl transition-all ${
              printFormat === 'a4' 
                ? 'w-full max-w-[420px]' 
                : printFormat === 'thermal58' 
                ? 'w-[280px]' 
                : 'w-[380px]'
            } ${
              thermalStyle === 'classic' 
                ? 'font-mono' 
                : thermalStyle === 'compact' 
                ? 'p-2.5 text-xs' 
                : 'font-sans'
            }`}
            style={{ minHeight: '520px' }}
          >
            {/* Header Blessing / Bismillah */}
            {headerBlessing && (
              <div className="text-center font-serif text-[11px] text-stone-700 pb-1 mb-1 border-b border-stone-200">
                {headerBlessing}
              </div>
            )}

            {/* Top Header with Seal and Contacts */}
            <div className="text-center pb-3 border-b-2 border-stone-900">
              {showLogo && (
                <img
                  src={logoUrl}
                  alt="Mujeeb Afghan Fashion"
                  className="mx-auto mb-2 h-20 w-20 rounded-lg object-contain"
                />
              )}
              <div className="flex items-center justify-center gap-2 mb-1">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-stone-950 font-serif leading-tight">
                    {shopName}
                  </h1>
                </div>
              </div>

              {/* Contacts row */}
              <div className="flex justify-between items-center text-[11px] font-semibold text-stone-800 px-1 mt-1 border-t border-dotted border-stone-300 pt-1">
                <span className="flex items-center gap-1">
                  <span>WhatsApp:</span>
                  <b className="font-mono">{shopSettings.whatsapp || '0782220194'}</b>
                </span>
                <span className="flex items-center gap-1">
                  <span>{receiptText.contact}:</span>
                  <b className="font-mono">{shopSettings.phone1 || '0772559881'}</b>
                </span>
              </div>

              {/* Address */}
              <p className="text-[10px] text-stone-600 mt-1 leading-snug px-2">
                <b>{receiptText.address}:</b> {shopAddress}
              </p>
            </div>

            {/* Order Info & Customer Strip */}
            <div className="grid grid-cols-2 border-b-2 border-stone-900 text-xs font-bold bg-stone-50">
              <div className="p-2 border-l border-stone-900 flex items-center justify-between">
                <span className="text-stone-600">{receiptText.bill}:</span>
                <span className="text-base font-black font-mono text-stone-950">{order.orderNumber}</span>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-stone-600">{receiptText.customer}:</span>
                <span className="text-sm font-black text-stone-950 truncate max-w-[130px]">{order.customerName}</span>
              </div>
            </div>

            {/* Main Measurements & Styles 2-Column Grid matching receipt in photo */}
            <div className="grid grid-cols-2 border-b border-stone-900">
              {/* Left Column: Design & Style Specs */}
              <div className="border-l border-stone-900 flex flex-col justify-between text-[11px]">
                <div className="divide-y divide-stone-200">
                  {activeDesignItems.length > 0 ? (
                    activeDesignItems.map((item, idx) => (
                      <div key={idx} className="p-1.5 flex justify-between items-center">
                        <span className="text-stone-500 font-medium text-[10px]">{item.title}:</span>
                        <span className="font-bold text-stone-900 text-left">{String(item.value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-stone-400 text-center italic text-[10px]">
                      {receiptText.noStyle}
                    </div>
                  )}
                </div>

                {/* Special Tailor Instructions / Note */}
                {order.specialInstructions && (
                  <div className="p-2 bg-amber-50/70 border-t border-stone-300 text-[11px] font-semibold text-stone-900 mt-auto">
                    <span className="text-[10px] text-amber-800 block">{receiptText.notes}:</span>
                    <span>{order.specialInstructions}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Measurements Table (قد, شانه, آستین, یخن, چاتی, etc.) */}
              <div className="divide-y divide-stone-300 text-xs">
                {activeMeasurements.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center px-2.5 py-1 hover:bg-stone-50">
                    <span className="font-semibold text-stone-700">{m.label}:</span>
                    <span className="font-mono font-black text-stone-950 text-sm">{m.value}</span>
                  </div>
                ))}
                {activeMeasurements.length === 0 && (
                  <div className="p-4 text-stone-400 text-center text-xs">
                    {receiptText.noMeasurements}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Date & Time section */}
            <div className="p-2 border-b border-dashed border-stone-400 bg-stone-50/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-stone-500 block">{receiptText.delivery}:</span>
                <span className="font-black text-stone-950 font-mono">{order.deliveryDate}</span>
              </div>
              <div className="text-left font-mono text-[11px] text-stone-600">
                <span className="text-[10px] text-stone-400 block">{receiptText.orderDate}:</span>
                <span>{order.orderDate || new Date().toISOString().slice(0, 10)}</span>
              </div>
            </div>

            {/* Barcodes Row (Contact Barcode & Order Barcode) as shown in uploaded photos */}
            {showBarcode && (
              <div className="py-2 px-1 border-b border-dashed border-stone-400 flex items-center justify-between">
                {/* Phone Barcode */}
                <div className="flex-1 text-center">
                  <BarcodeView 
                    value={order.customerPhone || '0780000000'} 
                    height={28}
                    width={1.2}
                    fontSize={9}
                  />
                  <span className="text-[9px] text-stone-500 block">{t.phoneBarcode}</span>
                </div>

                {/* Order Number Barcode */}
                <div className="flex-1 text-center">
                  <BarcodeView 
                    value={order.orderNumber} 
                    height={28}
                    width={1.4}
                    fontSize={9}
                  />
                  <span className="text-[9px] text-stone-500 block">{t.billBarcode}</span>
                </div>
              </div>
            )}

            {/* Garment and quantity */}
            <div className="grid grid-cols-2 border-b border-stone-900 text-xs py-1.5 px-2 font-bold bg-stone-100/70 text-center">
              <div>
                <span className="text-[10px] text-stone-500 block">{receiptText.garment}:</span>
                <span className="text-stone-900">{displayGarmentType}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">{receiptText.quantity}:</span>
                <span className="font-mono text-base text-stone-950">{order.quantity || 1}</span>
              </div>
            </div>

            {/* Financials Breakdown Table (جمله, جمله پرداخت, جمله باقیات) */}
            <div className="grid grid-cols-3 border-2 border-stone-950 text-center font-bold mt-2 divide-x divide-x-reverse divide-stone-950 bg-stone-50">
              <div className="p-1.5">
                <div className="text-[10px] text-stone-600">{receiptText.total}</div>
                <div className="font-mono text-sm font-black text-stone-950">
                  {order.totalAmount} <span className="text-[9px] font-normal">{currencySymbol}</span>
                </div>
              </div>
              <div className="p-1.5 bg-emerald-50/60">
                <div className="text-[10px] text-emerald-800">{receiptText.paid}</div>
                <div className="font-mono text-sm font-black text-emerald-700">
                  {order.paidAmount} <span className="text-[9px] font-normal">{currencySymbol}</span>
                </div>
              </div>
              <div className="p-1.5 bg-amber-50/60">
                <div className="text-[10px] text-amber-900">{receiptText.balance}</div>
                <div className={`font-mono text-sm font-black ${order.balanceAmount > 0 ? 'text-rose-600' : 'text-stone-800'}`}>
                  {order.balanceAmount} <span className="text-[9px] font-normal">{currencySymbol}</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-2 text-[10px] text-stone-500">
              <p>{language === 'ps' ? shopSettings.receiptFooterPs : language === 'fa' ? shopSettings.receiptFooterFa : shopSettings.receiptFooterEn}</p>
              <a href="https://rayan-tech-solution.tech" target="_blank" rel="noreferrer" className="mt-1 inline-block text-[8px] text-stone-400 underline">{receiptText.developed}</a>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="receipt-modal-footer px-5 py-3 bg-white border-t border-[#E5E5E5] flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs text-[#706E6B]">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
              order.status === 'ready' ? 'bg-emerald-500' : 
              order.status === 'in_progress' ? 'bg-blue-500' : 
              order.status === 'delivered' ? 'bg-purple-500' : 'bg-[#D4AF37]'
            }`} />
            <span className="font-bold text-[#1A1A1A]">{t[('status' + order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', '')) as keyof typeof t] || order.status}</span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(order);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-[#1A1A1A] bg-[#F9F7F2] hover:bg-stone-200 rounded-xl transition cursor-pointer border border-[#E5E5E5]"
              >
                {t.edit}
              </button>
            )}
            <button
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
