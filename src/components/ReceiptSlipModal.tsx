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

interface ReceiptSlipModalProps {
  order: Order;
  shopSettings: ShopSettings;
  measurementFields: MeasurementField[];
  designCategories: DesignCategory[];
  language: Language;
  onClose: () => void;
  onEdit?: (order: Order) => void;
}

export const ReceiptSlipModal: React.FC<ReceiptSlipModalProps> = ({
  order,
  shopSettings,
  measurementFields,
  designCategories,
  language,
  onClose,
  onEdit,
}) => {
  const t = translations[language];
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Generator using html-to-image and jsPDF (safe from oklch parser errors)
  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const element = receiptRef.current;
      
      const dataUrl = await toPng(element, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      // Initialize PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 12; // 12mm margins
      const printableWidth = pdfWidth - (margin * 2);
      
      // Calculate aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgHeight = (img.naturalHeight * printableWidth) / img.naturalWidth;
      
      pdf.addImage(dataUrl, 'PNG', margin, margin, printableWidth, imgHeight);
      
      const safeCustomerName = order.customerName ? order.customerName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') : 'Customer';
      pdf.save(`Rayan_Tailors_Receipt_${order.orderNumber || 'Order'}_${safeCustomerName}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
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
  const activeMeasurements = measurementFields
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
      const cat = designCategories.find(c => c.key === catKey);
      const catTitle = cat 
        ? (language === 'ps' ? cat.titlePs : language === 'fa' ? cat.titleFa : cat.titleEn)
        : catKey;
      return {
        key: catKey,
        title: catTitle,
        titleFa: cat ? cat.titleFa : catKey,
        value,
      };
    })
    .filter(d => Boolean(d.value));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
      <div 
        id="receipt-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border border-[#E5E5E5]"
      >
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1A1A1A] text-white border-b border-black">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
            <Scissors className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-bold tracking-wide">
              {t.tailorReceipt} - #{order.orderNumber}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
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
            dir="rtl"
            className="w-full max-w-[380px] bg-white border border-[#E5E5E5] shadow-xs p-4 text-[#1A1A1A] text-sm font-sans relative select-text rounded-xl"
            style={{ minHeight: '520px' }}
          >
            {/* Top Header with Seal and Contacts */}
            <div className="text-center pb-3 border-b-2 border-stone-900">
              <div className="flex items-center justify-center gap-2 mb-1">
                {/* Traditional Tailor Emblem */}
                <div className="w-10 h-10 rounded-full border-2 border-stone-800 flex items-center justify-center p-1 bg-stone-50">
                  <Scissors className="w-6 h-6 text-stone-800 transform -rotate-45" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-stone-950 font-serif leading-tight">
                    {shopSettings.shopNamePs || shopSettings.shopNameFa || 'افغان صدر خیاطی او رخت پلورنځی'}
                  </h1>
                </div>
              </div>

              {/* Contacts row */}
              <div className="flex justify-between items-center text-[11px] font-semibold text-stone-800 px-1 mt-1 border-t border-dotted border-stone-300 pt-1">
                <span className="flex items-center gap-1">
                  <span>WhatsApp:</span>
                  <b className="font-mono">{shopSettings.whatsapp || '0782207308'}</b>
                </span>
                <span className="flex items-center gap-1">
                  <span>شماره تماس:</span>
                  <b className="font-mono">{shopSettings.phone1 || '0793710008'}</b>
                </span>
              </div>

              {/* Address */}
              <p className="text-[10px] text-stone-600 mt-1 leading-snug px-2">
                <b>آدرس:</b> {shopSettings.addressFa || shopSettings.addressPs || 'ارزان قیمت چهارراهی محبس المدینه و احمدزی مارکیت منزل دوم افغان صدر خیاطی و رخت فروشی'}
              </p>
            </div>

            {/* Order Info & Customer Strip */}
            <div className="grid grid-cols-2 border-b-2 border-stone-900 text-xs font-bold bg-stone-50">
              <div className="p-2 border-l border-stone-900 flex items-center justify-between">
                <span className="text-stone-600">شماره / بِل:</span>
                <span className="text-base font-black font-mono text-stone-950">{order.orderNumber}</span>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-stone-600">مشتری:</span>
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
                        <span className="text-stone-500 font-medium text-[10px]">{item.titleFa}:</span>
                        <span className="font-bold text-stone-900 text-left">{String(item.value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-stone-400 text-center italic text-[10px]">
                      استایل ساده / نارمل
                    </div>
                  )}
                </div>

                {/* Special Tailor Instructions / Note */}
                {order.specialInstructions && (
                  <div className="p-2 bg-amber-50/70 border-t border-stone-300 text-[11px] font-semibold text-stone-900 mt-auto">
                    <span className="text-[10px] text-amber-800 block">نوټ / سپارښتنه:</span>
                    <span>{order.specialInstructions}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Measurements Table (قد, شانه, آستین, یخن, چاتی, etc.) */}
              <div className="divide-y divide-stone-300 text-xs">
                {activeMeasurements.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center px-2.5 py-1 hover:bg-stone-50">
                    <span className="font-semibold text-stone-700">{m.labelFa || m.label}:</span>
                    <span className="font-mono font-black text-stone-950 text-sm">{m.value}</span>
                  </div>
                ))}
                {activeMeasurements.length === 0 && (
                  <div className="p-4 text-stone-400 text-center text-xs">
                    اندازه‌ای ثبت نشده
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Date & Time section */}
            <div className="p-2 border-b border-dashed border-stone-400 bg-stone-50/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-stone-500 block">تاریخ تسلیمی (واپسی):</span>
                <span className="font-black text-stone-950 font-mono">{order.deliveryDate}</span>
              </div>
              <div className="text-left font-mono text-[11px] text-stone-600">
                <span className="text-[10px] text-stone-400 block">ثبت فرمایش:</span>
                <span>{order.orderDate || new Date().toISOString().slice(0, 10)}</span>
              </div>
            </div>

            {/* Barcodes Row (Contact Barcode & Order Barcode) as shown in uploaded photos */}
            <div className="py-2 px-1 border-b border-dashed border-stone-400 flex items-center justify-between">
              {/* Phone Barcode */}
              <div className="flex-1 text-center">
                <BarcodeView 
                  value={order.customerPhone || '0780000000'} 
                  height={28}
                  width={1.2}
                  fontSize={9}
                />
                <span className="text-[9px] text-stone-500 block">بارکود تماس</span>
              </div>

              {/* Order Number Barcode */}
              <div className="flex-1 text-center">
                <BarcodeView 
                  value={order.orderNumber} 
                  height={28}
                  width={1.4}
                  fontSize={9}
                />
                <span className="text-[9px] text-stone-500 block">بارکود بل</span>
              </div>
            </div>

            {/* Garment / Quantity & Cabinet/Slot Strip */}
            <div className="grid grid-cols-3 border-b border-stone-900 text-xs py-1.5 px-2 font-bold bg-stone-100/70 text-center">
              <div>
                <span className="text-[10px] text-stone-500 block">کابین / دیسک:</span>
                <span className="font-mono text-stone-900">{order.cabinetSlot || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">لباس:</span>
                <span className="text-stone-900">{order.garmentType}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">تعداد:</span>
                <span className="font-mono text-base text-stone-950">{order.quantity || 1}</span>
              </div>
            </div>

            {/* Financials Breakdown Table (جمله, جمله پرداخت, جمله باقیات) */}
            <div className="grid grid-cols-3 border-2 border-stone-950 text-center font-bold mt-2 divide-x divide-x-reverse divide-stone-950 bg-stone-50">
              <div className="p-1.5">
                <div className="text-[10px] text-stone-600">جمله (ټولې)</div>
                <div className="font-mono text-sm font-black text-stone-950">
                  {order.totalAmount} <span className="text-[9px] font-normal">{currencySymbol}</span>
                </div>
              </div>
              <div className="p-1.5 bg-emerald-50/60">
                <div className="text-[10px] text-emerald-800">رسید (پرداخت)</div>
                <div className="font-mono text-sm font-black text-emerald-700">
                  {order.paidAmount} <span className="text-[9px] font-normal">{currencySymbol}</span>
                </div>
              </div>
              <div className="p-1.5 bg-amber-50/60">
                <div className="text-[10px] text-amber-900">باقیات (پاتې)</div>
                <div className={`font-mono text-sm font-black ${order.balanceAmount > 0 ? 'text-rose-600' : 'text-stone-800'}`}>
                  {order.balanceAmount} <span className="text-[9px] font-normal">{currencySymbol}</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-2 text-[10px] text-stone-500">
              <p>{shopSettings.receiptFooterFa || 'تشکر از اعتمادتان - لطفاً هنگام تحویل بل را همراه داشته باشید'}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 bg-white border-t border-[#E5E5E5] flex items-center justify-between">
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
