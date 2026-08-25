import React, { useState, useEffect } from 'react';
import { 
  Order, 
  Customer, 
  MeasurementField, 
  DesignCategory, 
  ShopSettings, 
  Language, 
  OrderStatus,
  PaymentStatus 
} from '../types';
import { translations } from '../translations/i18n';
import { storageService } from '../services/storage';
import { 
  Scissors, 
  User, 
  Phone, 
  Sparkles, 
  Save, 
  Printer, 
  Check, 
  Calendar, 
  Clock, 
  Tag, 
  DollarSign, 
  Layers, 
  RotateCcw,
  Search,
  CheckCircle2,
  FileText,
  Plus,
  Minus
} from 'lucide-react';

interface OrderFormProps {
  initialOrder?: Order | null;
  prefilledCustomer?: Customer | null;
  measurementFields: MeasurementField[];
  designCategories: DesignCategory[];
  shopSettings: ShopSettings;
  language: Language;
  onSave: (order: Order, shouldPrint: boolean) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialOrder,
  prefilledCustomer,
  measurementFields,
  designCategories,
  shopSettings,
  language,
  onSave,
  onCancel,
}) => {
  const t = translations[language];

  // Form State
  const [orderNumber, setOrderNumber] = useState<string>(
    initialOrder?.orderNumber || storageService.generateNextOrderNumber()
  );
  const [customerName, setCustomerName] = useState<string>(
    initialOrder?.customerName || prefilledCustomer?.name || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialOrder?.customerPhone || prefilledCustomer?.phone || ''
  );
  const [customerWhatsApp, setCustomerWhatsApp] = useState<string>(
    initialOrder?.customerWhatsApp || prefilledCustomer?.whatsapp || ''
  );
  const [customerId, setCustomerId] = useState<string>(
    initialOrder?.customerId || prefilledCustomer?.id || ''
  );

  const [garmentType, setGarmentType] = useState<string>(
    initialOrder?.garmentType || prefilledCustomer?.preferredGarmentType || 'پیراهن و تنبان (Perahan Tunban)'
  );
  const [quantity, setQuantity] = useState<number>(initialOrder?.quantity || 1);
  
  // Measurements
  const [measurements, setMeasurements] = useState<Record<string, string | number>>(
    initialOrder?.measurements || prefilledCustomer?.standardMeasurements || {}
  );

  // Design Selections
  const [designSelections, setDesignSelections] = useState<Record<string, string>>(
    initialOrder?.designSelections || {}
  );

  // Notes & Cabinet
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    initialOrder?.specialInstructions || ''
  );
  const [cabinetSlot, setCabinetSlot] = useState<string>(
    initialOrder?.cabinetSlot || ''
  );

  // Pricing & Payment
  const [totalAmount, setTotalAmount] = useState<number>(initialOrder?.totalAmount || 1800);
  const [paidAmount, setPaidAmount] = useState<number>(initialOrder?.paidAmount || 1800);
  const [status, setStatus] = useState<OrderStatus>(initialOrder?.status || 'pending');

  // Dates
  const [orderDate, setOrderDate] = useState<string>(
    initialOrder?.orderDate || new Date().toISOString().slice(0, 16).replace('T', ' ')
  );
  
  // Delivery date default to +5 days
  const defaultDelivery = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  };
  const [deliveryDate, setDeliveryDate] = useState<string>(
    initialOrder?.deliveryDate || defaultDelivery()
  );

  // Autocomplete / Search for existing customers
  const [matchingCustomers, setMatchingCustomers] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [matchedExistingCustomer, setMatchedExistingCustomer] = useState<Customer | null>(
    prefilledCustomer || null
  );

  // Currency label
  const currencySymbol = language === 'ps' 
    ? shopSettings.currencyPs 
    : language === 'fa' 
    ? shopSettings.currencyFa 
    : shopSettings.currencyEn;

  // Real-time balance
  const balanceAmount = Math.max(0, (Number(totalAmount) || 0) - (Number(paidAmount) || 0));
  const paymentStatus: PaymentStatus = 
    balanceAmount === 0 ? 'paid' : (Number(paidAmount) || 0) > 0 ? 'partial' : 'unpaid';

  // Check matching customers on phone/name change
  useEffect(() => {
    if (customerPhone.trim().length >= 3 || customerName.trim().length >= 2) {
      const allCust = storageService.getCustomers();
      const phoneQ = customerPhone.trim().toLowerCase();
      const nameQ = customerName.trim().toLowerCase();

      const matches = allCust.filter(c => 
        (phoneQ && c.phone.includes(phoneQ)) || 
        (nameQ && c.name.toLowerCase().includes(nameQ))
      );
      setMatchingCustomers(matches.slice(0, 4));

      // Direct exact match
      const exact = matches.find(c => c.phone.trim() === phoneQ);
      if (exact) {
        setMatchedExistingCustomer(exact);
      }
    } else {
      setMatchingCustomers([]);
    }
  }, [customerPhone, customerName]);

  // Load a customer's profile & measurements
  const selectCustomer = (cust: Customer) => {
    setCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    if (cust.whatsapp) setCustomerWhatsApp(cust.whatsapp);
    if (cust.standardMeasurements && Object.keys(cust.standardMeasurements).length > 0) {
      setMeasurements(cust.standardMeasurements);
    }
    if (cust.preferredGarmentType) {
      setGarmentType(cust.preferredGarmentType);
    }
    setMatchedExistingCustomer(cust);
    setShowCustomerSuggestions(false);
  };

  // Quick load measurements button handler
  const handleLoadSavedMeasurements = () => {
    if (matchedExistingCustomer?.standardMeasurements) {
      setMeasurements({ ...matchedExistingCustomer.standardMeasurements });
    }
  };

  // Quick measurement adjustment (+0.25, +0.5, -0.25, -0.5)
  const adjustMeasurement = (key: string, delta: number) => {
    const currentVal = parseFloat(String(measurements[key] || 0)) || 0;
    const newVal = Math.max(0, Math.round((currentVal + delta) * 100) / 100);
    setMeasurements(prev => ({ ...prev, [key]: newVal.toString() }));
  };

  // Set quick delivery date preset
  const setQuickDeliveryDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDeliveryDate(d.toISOString().slice(0, 10));
  };

  // Garment Presets
  const garmentOptions = [
    { key: 'perahanTunban', label: t.perahanTunban },
    { key: 'waistcoat', label: t.waistcoat },
    { key: 'suit', label: t.suit },
    { key: 'coatKorti', label: t.coatKorti },
    { key: 'kameezShalwar', label: t.kameezShalwar },
    { key: 'kurta', label: t.kurta },
  ];

  // Save handler
  const handleSave = (shouldPrint: boolean) => {
    if (!customerName.trim()) {
      alert(language === 'fa' ? 'لطفاً نام مشتری را وارد نمایید' : language === 'ps' ? 'مهرباني وکړئ د مشتري نوم ولیکئ' : 'Please enter customer name');
      return;
    }

    const orderData: Order = {
      id: initialOrder?.id || 'ord_' + Date.now(),
      orderNumber: orderNumber || storageService.generateNextOrderNumber(),
      customerId: customerId || 'cust_' + Date.now(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerWhatsApp: customerWhatsApp.trim() || customerPhone.trim(),
      garmentType,
      quantity: Number(quantity) || 1,
      measurements,
      designSelections,
      specialInstructions,
      cabinetSlot,
      items: [],
      totalAmount: Number(totalAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      balanceAmount,
      paymentStatus,
      status,
      orderDate,
      deliveryDate,
      createdAt: initialOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(orderData, shouldPrint);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Banner & Header - Bento Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-[#D4AF37]">
            <Scissors className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
              <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight">
                {initialOrder ? `${t.edit}: #${initialOrder.orderNumber}` : t.newOrder}
              </h1>
            </div>
            <p className="text-xs text-[#706E6B] mt-0.5">
              {initialOrder ? t.orderSummary : t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-[#706E6B] bg-[#F9F7F2] hover:bg-stone-200 rounded-xl transition cursor-pointer border border-[#E5E5E5]"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            id="save-order-only-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1A1A1A] hover:bg-black rounded-xl transition cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4 text-[#D4AF37]" />
            <span>{t.saveOrder}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            id="save-and-print-btn"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-[#1A1A1A] bg-[#D4AF37] hover:bg-[#B39025] active:scale-98 rounded-xl transition cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{t.saveAndPrint}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Customer Info, Garment & Measurements (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Customer Information Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs relative">
            <div className="flex items-center justify-between mb-4 border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-sm">
                <span className="w-1 h-4 bg-[#D4AF37] rounded-full inline-block" />
                <User className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.customerInfo}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#706E6B]">{t.orderNumber}:</span>
                <span className="font-black bg-[#F9F7F2] px-2.5 py-1 rounded-lg text-[#1A1A1A] border border-[#E5E5E5]">
                  {orderNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Phone (with auto lookup) */}
              <div className="relative">
                <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                  {t.contactNumber} *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => {
                      setCustomerPhone(e.target.value);
                      setShowCustomerSuggestions(true);
                    }}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    placeholder="0793710008..."
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-sm focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden font-mono"
                  />
                </div>

                {/* Customer Autocomplete Dropdown */}
                {showCustomerSuggestions && matchingCustomers.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-[#E5E5E5] overflow-hidden">
                    <div className="p-2 bg-[#F9F7F2] border-b border-[#E5E5E5] text-[10px] font-bold text-[#706E6B]">
                      {language === 'fa' ? 'مشتریان قبلی یافت شده (برای بارگذاری کلیک کنید):' : language === 'ps' ? 'موندل شوي پخواني مشتریان:' : 'Found previous customers:'}
                    </div>
                    {matchingCustomers.map(cust => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => selectCustomer(cust)}
                        className="w-full text-left p-2.5 hover:bg-[#F9F7F2] border-b border-stone-100 last:border-0 flex items-center justify-between text-xs transition cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-[#1A1A1A]">{cust.name}</span>
                          <span className="text-[#706E6B] font-mono block text-[11px]">{cust.phone}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                            {cust.totalOrdersCount || 1} {language === 'fa' ? 'فرمایش قبلی' : 'Orders'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                  {t.customerName} *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={language === 'fa' ? 'مثال: فرهاد یا شکیل خان' : language === 'ps' ? 'مثال: فرهاد یا شکیل خان' : 'e.g. Farhad or Shakil Khan'}
                  className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-sm focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Existing Customer Detected Banner */}
            {matchedExistingCustomer && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-900 font-medium">
                    {t.existingCustomerFound} (<b>{matchedExistingCustomer.name}</b>)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSavedMeasurements}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  {t.loadCustomerMeasurements}
                </button>
              </div>
            )}
          </div>

          {/* 2. Garment Selection Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-[#E5E5E5] pb-2">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-sm">
                <span className="w-1 h-4 bg-[#D4AF37] rounded-full inline-block" />
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.garmentType} & {t.quantity}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <div className="sm:col-span-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {garmentOptions.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setGarmentType(opt.label)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                        garmentType === opt.label
                          ? 'bg-[#D4AF37] text-[#1A1A1A] border-[#D4AF37] shadow-xs font-black'
                          : 'bg-[#F9F7F2] text-[#2D2926] border-[#E5E5E5] hover:bg-stone-200/70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="bg-[#F9F7F2] p-2.5 rounded-xl border border-[#E5E5E5] text-center">
                <label className="block text-[11px] font-bold text-[#706E6B] mb-1 uppercase tracking-wider">
                  {t.quantity}
                </label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 bg-white border border-[#E5E5E5] rounded-lg font-bold text-stone-700 hover:bg-stone-100 flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-base text-[#1A1A1A] w-6">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 bg-white border border-[#E5E5E5] rounded-lg font-bold text-stone-700 hover:bg-stone-100 flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Afghan Tailoring Measurements Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-sm">
                <span className="w-1 h-4 bg-[#D4AF37] rounded-full inline-block" />
                <Scissors className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.measurements}</span>
              </div>
              <span className="text-xs text-[#706E6B] font-mono">
                {language === 'fa' ? 'واحد به انچ (Inches)' : language === 'ps' ? 'واحد په انچ (Inches)' : 'Unit: Inches'}
              </span>
            </div>

            {/* Measurement Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {measurementFields.map(field => {
                const label = language === 'ps' 
                  ? field.labelPs 
                  : language === 'fa' 
                  ? field.labelFa 
                  : field.labelEn;
                const value = measurements[field.key] !== undefined ? measurements[field.key] : '';

                return (
                  <div 
                    key={field.id} 
                    className="p-2.5 bg-[#F9F7F2] rounded-xl border border-[#E5E5E5] focus-within:border-[#D4AF37] focus-within:bg-white transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#1A1A1A]">
                        {label}
                      </label>
                      <span className="text-[10px] text-stone-400 font-mono">in</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={value}
                        onChange={e => {
                          const val = e.target.value;
                          setMeasurements(prev => ({ ...prev, [field.key]: val }));
                        }}
                        placeholder="0.0"
                        className="w-full py-1 px-2 bg-white border border-[#E5E5E5] rounded-lg text-sm font-mono font-bold text-[#1A1A1A] text-center focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden"
                      />
                    </div>

                    {/* Quick increment buttons for speed */}
                    <div className="flex items-center justify-between gap-1 mt-1.5">
                      <button
                        type="button"
                        onClick={() => adjustMeasurement(field.key, -0.5)}
                        className="flex-1 py-0.5 text-[10px] font-mono font-semibold bg-stone-200/80 hover:bg-stone-300 rounded text-stone-700 transition"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustMeasurement(field.key, 0.25)}
                        className="flex-1 py-0.5 text-[10px] font-mono font-semibold bg-stone-200/80 hover:bg-stone-300 rounded text-stone-700 transition"
                      >
                        +¼
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustMeasurement(field.key, 0.5)}
                        className="flex-1 py-0.5 text-[10px] font-mono font-semibold bg-stone-200/80 hover:bg-stone-300 rounded text-stone-700 transition"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Design & Style Selection Options */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-sm">
                <span className="w-1 h-4 bg-[#D4AF37] rounded-full inline-block" />
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.designAndStyle}</span>
              </div>
              <span className="text-xs text-[#706E6B]">
                {language === 'fa' ? 'قابل تنظیم در صفحه طرح‌ها' : language === 'ps' ? 'د ډیزاینونو په برخه کې د بدلون وړ' : 'Customizable in Design Settings'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {designCategories.map(category => {
                const catTitle = language === 'ps' 
                  ? category.titlePs 
                  : language === 'fa' 
                  ? category.titleFa 
                  : category.titleEn;
                const currentSelection = designSelections[category.key] || '';

                return (
                  <div key={category.id} className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#1A1A1A]">
                      {catTitle}
                    </label>
                    <select
                      value={currentSelection}
                      onChange={e => {
                        const val = e.target.value;
                        setDesignSelections(prev => ({ ...prev, [category.key]: val }));
                      }}
                      className="w-full p-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-[#D4AF37] outline-hidden"
                    >
                      <option value="">-- {language === 'fa' ? 'انتخاب مدل' : language === 'ps' ? 'د موډل انتخاب' : 'Select'} --</option>
                      {category.options.map(opt => {
                        const optName = language === 'ps' 
                          ? opt.namePs 
                          : language === 'fa' 
                          ? opt.nameFa 
                          : opt.nameEn;
                        return (
                          <option key={opt.id} value={optName}>
                            {optName}
                          </option>
                        );
                      })}
                    </select>

                    {/* Optional custom free text override */}
                    {category.allowCustomInput && (
                      <input
                        type="text"
                        value={currentSelection}
                        onChange={e => {
                          const val = e.target.value;
                          setDesignSelections(prev => ({ ...prev, [category.key]: val }));
                        }}
                        placeholder={language === 'fa' ? 'یا تایپ دلخواه...' : 'or custom note...'}
                        className="w-full px-2 py-1 bg-transparent border-b border-[#E5E5E5] text-[11px] text-stone-600 focus:border-[#D4AF37] outline-hidden"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dates, Notes, Financials & Actions (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Dates & Cabinet Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-sm border-b border-[#E5E5E5] pb-2">
              <span className="w-1 h-4 bg-[#D4AF37] rounded-full inline-block" />
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.date} & {t.deliveryDate}</span>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.deliveryDate} (تاریخ واپسی) *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-sm font-mono font-bold text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] outline-hidden"
              />

              {/* Quick delivery date buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-stone-400">{t.quickFill}:</span>
                <button
                  type="button"
                  onClick={() => setQuickDeliveryDays(3)}
                  className="px-2 py-0.5 bg-[#F9F7F2] hover:bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md transition border border-[#E5E5E5]"
                >
                  +3 {language === 'fa' ? 'روز' : 'days'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeliveryDays(5)}
                  className="px-2 py-0.5 bg-[#F9F7F2] hover:bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md transition border border-[#E5E5E5]"
                >
                  +5 {language === 'fa' ? 'روز' : 'days'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeliveryDays(7)}
                  className="px-2 py-0.5 bg-[#F9F7F2] hover:bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md transition border border-[#E5E5E5]"
                >
                  +1 {language === 'fa' ? 'هفته' : 'week'}
                </button>
              </div>
            </div>

            {/* Cabinet / Slot tag */}
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.cabinetSlot} (e.g. D1, C4)
              </label>
              <input
                type="text"
                value={cabinetSlot}
                onChange={e => setCabinetSlot(e.target.value)}
                placeholder="D1, C4..."
                className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-sm font-mono text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] outline-hidden"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.status}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as OrderStatus)}
                className="w-full p-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] outline-hidden"
              >
                <option value="pending">{t.statusPending}</option>
                <option value="in_progress">{t.statusInProgress}</option>
                <option value="ready">{t.statusReady}</option>
                <option value="delivered">{t.statusDelivered}</option>
              </select>
            </div>
          </div>

          {/* 2. Special Instructions & Notes */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-sm border-b border-[#E5E5E5] pb-2">
              <span className="w-1 h-4 bg-[#D4AF37] rounded-full inline-block" />
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.specialNotes}</span>
            </div>
            <textarea
              rows={3}
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder={language === 'fa' ? 'مثال: کالر یی 1.75 راشی، دوخت زنجیری...' : language === 'ps' ? 'مثال: کالر یی 1.75 راشی، تنګ دوخت...' : 'e.g. Collar 1.75 inch, soft fusing...'}
              className="w-full p-3 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs focus:bg-white focus:border-[#D4AF37] outline-hidden"
            />
          </div>

          {/* 3. Pricing, Advance & Balance Card - Bento Highlight Card */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#1A1A1A] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-black text-sm">
                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.paymentStatus}</span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                paymentStatus === 'paid' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : paymentStatus === 'partial' 
                  ? 'bg-amber-100 text-amber-900' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {t[paymentStatus]}
              </span>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-bold text-[#706E6B] uppercase tracking-wider mb-1">
                {t.totalAmount} (جمله)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalAmount}
                  onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-base font-mono font-black text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#706E6B] font-bold">
                  {currencySymbol}
                </span>
              </div>
            </div>

            {/* Paid / Advance */}
            <div>
              <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                {t.paidAmount} (رسید)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={paidAmount}
                  onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-base font-mono font-black text-emerald-900 focus:bg-white focus:border-emerald-500 outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-bold">
                  {currencySymbol}
                </span>
              </div>
              {/* Quick full paid button */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPaidAmount(totalAmount)}
                  className="text-[10px] text-emerald-700 hover:underline font-bold"
                >
                  {language === 'fa' ? 'تسویه کامل (رسید کامل)' : 'Mark full paid'}
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={() => setPaidAmount(0)}
                  className="text-[10px] text-[#706E6B] hover:underline font-medium"
                >
                  {language === 'fa' ? 'بدون پیش‌پرداخت' : 'Zero advance'}
                </button>
              </div>
            </div>

            {/* Balance Remaining Display */}
            <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1A1A1A]">
                {t.balanceRemaining} (باقیات):
              </span>
              <span className={`font-mono text-lg font-black ${balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {balanceAmount} <span className="text-xs font-normal text-[#706E6B]">{currencySymbol}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="w-full py-3.5 px-4 bg-[#D4AF37] hover:bg-[#B39025] active:scale-98 text-[#1A1A1A] font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              <span>{t.saveAndPrint}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="w-full py-2.5 px-4 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.saveOrder}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
