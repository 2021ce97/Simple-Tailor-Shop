import React, { useState, useEffect, useMemo } from 'react';
import { 
  Order, 
  Customer, 
  MeasurementField, 
  DesignCategory, 
  ShopSettings, 
  Language, 
  OrderStatus,
  PaymentStatus,
  Fabric,
  GarmentTypeConfig
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
  Minus,
  AlertCircle,
  PackageCheck,
  Filter,
  Shirt
} from 'lucide-react';

interface OrderFormProps {
  initialOrder?: Order | null;
  prefilledCustomer?: Customer | null;
  prefilledFabric?: Fabric | null;
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
  prefilledFabric,
  measurementFields,
  designCategories,
  shopSettings,
  language,
  onSave,
  onCancel,
}) => {
  const t = translations[language];

  // Available Fabrics in Inventory
  const [fabricsList] = useState<Fabric[]>(() => storageService.getFabrics());

  // Garment Types from Storage
  const [garmentTypes] = useState<GarmentTypeConfig[]>(() => storageService.getGarmentTypes());

  // Form State
  const [orderNumber] = useState<string>(
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

  // Selected Garment Type State
  const defaultGarmentName = () => {
    if (initialOrder?.garmentType) return initialOrder.garmentType;
    if (prefilledCustomer?.preferredGarmentType) return prefilledCustomer.preferredGarmentType;
    const first = garmentTypes[0];
    if (first) {
      return language === 'ps' ? first.namePs : language === 'fa' ? first.nameFa : first.nameEn;
    }
    return 'پیراهن و تنبان (Perahan Tunban)';
  };

  const [garmentType, setGarmentType] = useState<string>(defaultGarmentName);
  const [quantity, setQuantity] = useState<number>(initialOrder?.quantity || 1);

  // Toggle to see all fields or only garment-specific fields
  const [showAllFields, setShowAllFields] = useState<boolean>(false);
  
  // Fabric Inventory Selection State
  const [isCustomerFabric, setIsCustomerFabric] = useState<boolean>(
    initialOrder?.isCustomerFabric ?? (!prefilledFabric && !initialOrder?.fabricId)
  );
  const [selectedFabricId, setSelectedFabricId] = useState<string>(
    initialOrder?.fabricId || prefilledFabric?.id || ''
  );
  const selectedFabric = fabricsList.find(f => f.id === selectedFabricId);
  const [fabricName, setFabricName] = useState<string>(
    initialOrder?.fabricName || prefilledFabric?.name || ''
  );
  const [fabricColor, setFabricColor] = useState<string>(
    initialOrder?.fabricColor || prefilledFabric?.color || ''
  );
  const [fabricMeters, setFabricMeters] = useState<number>(
    initialOrder?.fabricMeters || 4
  );

  // Measurements
  const [measurements, setMeasurements] = useState<Record<string, string | number>>(
    initialOrder?.measurements || prefilledCustomer?.standardMeasurements || {}
  );

  // Design Selections
  const [designSelections, setDesignSelections] = useState<Record<string, string>>(
    initialOrder?.designSelections || {}
  );

  // Notes & Storage Location
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    initialOrder?.specialInstructions || ''
  );
  const [cabinetSlot, setCabinetSlot] = useState<string>(
    initialOrder?.cabinetSlot || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Pricing & Payment
  const [totalAmount, setTotalAmount] = useState<number>(initialOrder?.totalAmount || 1800);
  const [paidAmount, setPaidAmount] = useState<number>(initialOrder?.paidAmount || 1800);
  const [status, setStatus] = useState<OrderStatus>(initialOrder?.status || 'pending');

  // Dates
  const [orderDate] = useState<string>(
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

  // Determine active garment category key
  const activeGarmentKey = useMemo(() => {
    const match = garmentTypes.find(g => 
      g.nameEn === garmentType ||
      g.nameFa === garmentType ||
      g.namePs === garmentType ||
      garmentType.toLowerCase().includes(g.key.toLowerCase()) ||
      garmentType.toLowerCase().includes(g.nameEn.toLowerCase())
    );
    return match ? match.key : 'perahan_tunban';
  }, [garmentType, garmentTypes]);

  // Filtered Measurement Fields based on Selected Garment
  const filteredMeasurementFields = useMemo(() => {
    if (showAllFields) return measurementFields;
    const list = measurementFields.filter(f => 
      !f.garmentCategory || 
      f.garmentCategory === 'all' || 
      f.garmentCategory === activeGarmentKey
    );
    return list.length > 0 ? list : measurementFields;
  }, [measurementFields, activeGarmentKey, showAllFields]);

  // Filtered Design Categories based on Selected Garment
  const filteredDesignCategories = useMemo(() => {
    if (showAllFields) return designCategories;
    const list = designCategories.filter(c => 
      !c.garmentCategory || 
      c.garmentCategory === 'all' || 
      c.garmentCategory === activeGarmentKey
    );
    return list.length > 0 ? list : designCategories;
  }, [designCategories, activeGarmentKey, showAllFields]);

  // Check matching customers on phone/name change
  useEffect(() => {
    if (customerPhone.trim().length >= 3 || customerName.trim().length >= 2) {
      const allCust = storageService.getCustomers() || [];
      const phoneQ = customerPhone.trim().toLowerCase();
      const nameQ = customerName.trim().toLowerCase();

      const matches = allCust.filter(c => 
        (phoneQ && c.phone.includes(phoneQ)) || 
        (nameQ && c.name.toLowerCase().includes(nameQ))
      );
      setMatchingCustomers(matches.slice(0, 4));

      // Direct exact match
      const exact = (matches || []).find(c => c.phone.trim() === phoneQ);
      if (exact) {
        setMatchedExistingCustomer(exact);
      }
    } else {
      setMatchingCustomers([]);
    }
  }, [customerPhone, customerName]);

  // Handle fabric selection
  const handleSelectShopFabric = (fab: Fabric) => {
    setSelectedFabricId(fab.id);
    setFabricName(fab.name);
    setFabricColor(fab.color);
    setIsCustomerFabric(false);
  };

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

  // Save handler
  const handleSave = async (shouldPrint: boolean) => {
    if (!customerName.trim()) {
      alert(language === 'fa' ? 'لطفاً نام مشتری را وارد نمایید' : language === 'ps' ? 'مهرباني وکړئ د مشتري نوم ولیکئ' : 'Please enter customer name');
      return;
    }

    setIsSaving(true);
    try {
      const orderData: Order = {
        id: initialOrder?.id || 'ord_' + Date.now(),
        orderNumber: orderNumber || storageService.generateNextOrderNumber(),
        customerId: customerId || 'cust_' + Date.now(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerWhatsApp: customerWhatsApp.trim() || customerPhone.trim(),
        garmentType,
        quantity: Number(quantity) || 1,
        fabricId: isCustomerFabric ? undefined : selectedFabricId,
        fabricName: isCustomerFabric ? (fabricName || 'رخت از خود مشتری') : fabricName,
        fabricColor: fabricColor,
        fabricMeters: isCustomerFabric ? undefined : Number(fabricMeters) || 0,
        isCustomerFabric: isCustomerFabric,
        measurements,
        designSelections,
        specialInstructions,
        cabinetSlot: cabinetSlot.trim() || undefined,
        items: initialOrder?.items || [],
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

      await onSave(orderData, shouldPrint);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-[#D4AF37] shadow-xs">
            <Scissors className="w-6 h-6 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight">
                {initialOrder ? t.editOrder : t.newOrder}
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#D4AF37]/20 text-[#1A1A1A] rounded-md border border-[#D4AF37]/30">
                {orderNumber}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {language === 'fa' 
                ? 'ثبت دقیق اندازه‌ها، انتخاب رخت، دیزاین و مشخصات سفارش بر اساس نوع لباس' 
                : language === 'ps' 
                ? 'د کالي د ډول پر بنسټ د فرمایش، رخت، ډیزاین او اندازو ثبت' 
                : 'Complete Afghan tailoring order slip, fabric & measurements per garment type'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1A1A1A] hover:bg-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4 text-[#D4AF37]" />
            <span>{t.saveOrder}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-5 py-2 text-xs font-black text-[#1A1A1A] bg-[#D4AF37] hover:bg-[#C29E2E] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{t.saveAndPrint}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns on Desktop, 1 Column on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Customer Info, Garment Selection, Fabric, Measurements & Designs */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Customer Information Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-extrabold text-sm">
                <span className="w-1.5 h-5 bg-[#D4AF37] rounded-full inline-block" />
                <User className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.customerDetails}</span>
              </div>

              {matchedExistingCustomer && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.existingCustomer} ({matchedExistingCustomer.name})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLoadSavedMeasurements}
                    className="text-[11px] text-[#B39025] hover:underline font-bold"
                  >
                    {language === 'fa' ? 'بارگذاری اندازه‌های قبلی' : 'Load Saved Measurements'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              {/* Customer Name */}
              <div className="relative">
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  {t.customerName} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => {
                      setCustomerName(e.target.value);
                      setShowCustomerSuggestions(true);
                    }}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    placeholder="e.g. احمد، فرهاد، شکیل خان..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute end-3 top-2.5" />
                </div>

                {/* Suggestions Dropdown */}
                {showCustomerSuggestions && matchingCustomers.length > 0 && (
                  <div className="absolute top-full start-0 end-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-30 p-1.5 space-y-1">
                    <div className="text-[10px] font-bold text-stone-400 px-2 py-0.5">
                      {language === 'fa' ? 'مشتریان موجود (کلیک برای انتخاب):' : 'Matching Customers:'}
                    </div>
                    {matchingCustomers.map(cust => (
                      <button
                        key={cust.id}
                        type="button"
                        onClick={() => selectCustomer(cust)}
                        className="w-full text-start p-2 rounded-lg hover:bg-amber-50 text-xs flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="font-bold text-[#1A1A1A]">{cust.name}</span>
                        <span className="font-mono text-stone-500 text-[11px]">{cust.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  {t.customerPhone} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => {
                      setCustomerPhone(e.target.value);
                      setShowCustomerSuggestions(true);
                    }}
                    placeholder="0772559881"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-medium text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden"
                  />
                  <Phone className="w-4 h-4 text-stone-400 absolute end-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Garment Selection Bar (Interactive Pills from Garment Categories) */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{t.garmentType} (انتخاب نوع لباس برای اندازه و دیزاین)</span>
                </label>
                <span className="text-[10px] text-stone-400">
                  {garmentTypes.length} {language === 'fa' ? 'نوع لباس فعال' : 'Active types'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {garmentTypes.map(g => {
                  const localizedName = language === 'ps' ? g.namePs : language === 'fa' ? g.nameFa : g.nameEn;
                  const isSelected = garmentType === localizedName || garmentType === g.nameEn || garmentType === g.nameFa || garmentType === g.namePs;

                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setGarmentType(localizedName)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-[#D4AF37] font-black ring-2 ring-[#D4AF37]'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      <span className="text-sm">{g.icon || '✂️'}</span>
                      <span>{localizedName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quantity */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">
                  {t.quantity} (تعداد دست لباس):
                </span>
                <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 hover:bg-stone-200 text-stone-600 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center bg-transparent text-xs font-mono font-bold text-[#1A1A1A] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 hover:bg-stone-200 text-stone-600 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Fabric Inventory Selection */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-extrabold text-sm">
                <span className="w-1.5 h-5 bg-[#D4AF37] rounded-full inline-block" />
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.selectFabric}</span>
              </div>

              {/* Radio Toggle: Shop Fabric vs Customer Fabric */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsCustomerFabric(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    !isCustomerFabric
                      ? 'bg-white text-[#1A1A1A] shadow-xs font-black'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {t.shopFabric}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerFabric(true);
                    setSelectedFabricId('');
                    setFabricName('رخت از خود مشتری');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isCustomerFabric
                      ? 'bg-white text-[#1A1A1A] shadow-xs font-black'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {t.customerFabric}
                </button>
              </div>
            </div>

            {/* Mode A: Select from Inventory Dropdown */}
            {!isCustomerFabric ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {language === 'fa' ? 'انتخاب رخت از لیست گدام (Dropdown):' : language === 'ps' ? 'له ګدام څخه د رخت ټاکل:' : 'Select Fabric from Inventory (Dropdown):'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFabricId}
                      onChange={e => {
                        const fab = fabricsList.find(f => f.id === e.target.value);
                        if (fab) {
                          handleSelectShopFabric(fab);
                        } else {
                          setSelectedFabricId('');
                          setFabricName('');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-hidden cursor-pointer"
                    >
                      <option value="">
                        {language === 'fa' 
                          ? '-- لطفاً رخت مورد نظر را از گدام انتخاب نمایید --' 
                          : language === 'ps'
                          ? '-- مهرباني وکړئ له زېرمې څخه رخت وټاکئ --'
                          : '-- Select fabric from inventory --'}
                      </option>
                      {fabricsList.map(fab => {
                        const stock = Number(fab.stockMeters) || 0;
                        return (
                          <option key={fab.id} value={fab.id}>
                            [{fab.code}] {fab.name} — {fab.color} ({stock} {t.meters} موجود) — {fab.pricePerMeter} {currencySymbol}/{t.meters}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Selected Fabric Banner / Detail */}
                {selectedFabricId && (
                  <div className="p-3 bg-amber-50/70 border border-[#D4AF37]/40 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-[#1A1A1A] flex items-center gap-2">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#B39025] rounded font-black">
                          {selectedFabric?.code}
                        </span>
                        <span>{selectedFabric?.name}</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        {selectedFabric?.color} • {selectedFabric?.type} • 
                        <span className="font-bold text-stone-800 ms-1">
                          {selectedFabric?.pricePerMeter} {currencySymbol}/{t.meters}
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="text-[10px] text-stone-700 block">{t.stockMeters}:</span>
                      <span className={`font-mono font-black text-sm ${(selectedFabric?.stockMeters || 0) < 15 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {selectedFabric?.stockMeters} {t.meters}
                      </span>
                    </div>
                  </div>
                )}

                {/* Fabric Name & Fabric Meters Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      {t.fabricName}
                    </label>
                    <input
                      type="text"
                      value={fabricName}
                      onChange={e => setFabricName(e.target.value)}
                      placeholder="e.g. لته سفید اعلا"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#D4AF37] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      {t.fabricMeters} ({t.meters})
                    </label>
                    <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setFabricMeters(Math.max(0.5, fabricMeters - 0.5))}
                        className="p-2 hover:bg-stone-200 text-stone-600 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        step="0.25"
                        min="0.5"
                        value={fabricMeters}
                        onChange={e => setFabricMeters(Math.max(0.5, parseFloat(e.target.value) || 4))}
                        className="w-full text-center bg-transparent text-xs font-mono font-bold text-[#1A1A1A] focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setFabricMeters(fabricMeters + 0.5)}
                        className="p-2 hover:bg-stone-200 text-stone-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Meters chips */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {[3.5, 4.0, 4.25, 4.5, 5.0].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFabricMeters(m)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition cursor-pointer ${
                            fabricMeters === m
                              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border-stone-200'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Mode B: Customer Provided Their Own Fabric */
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs space-y-3">
                <div className="flex items-center gap-2 text-[#B39025] font-bold">
                  <Scissors className="w-4 h-4" />
                  <span>
                    {language === 'fa' 
                      ? 'رخت توسط خود مشتری آورده شده است (تکه شخصی مشتری)' 
                      : language === 'ps'
                      ? 'رخت د پېرودونکي له خوا راوړل شوی دی'
                      : 'Customer Provided Their Own Fabric'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {language === 'fa' ? 'مشخصات / نوعیت یا رنگ رخت مشتری:' : 'Customer Fabric Details & Color:'}
                    </label>
                    <input
                      type="text"
                      value={fabricName}
                      onChange={e => setFabricName(e.target.value)}
                      placeholder="مثال: تکه نخی کرمی آورده شد..."
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t.fabricMeters} ({t.meters}):
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.5"
                      value={fabricMeters}
                      onChange={e => setFabricMeters(Math.max(0.5, parseFloat(e.target.value) || 4))}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Measurement Fields Grid (DYNAMIC FOR SELECTED GARMENT) */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-[#E5E5E5] pb-3 gap-2">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-extrabold text-sm">
                <span className="w-1.5 h-5 bg-[#D4AF37] rounded-full inline-block" />
                <Scissors className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.bodyMeasurements}</span>
                <span className="px-2 py-0.5 bg-amber-50 text-[#B39025] rounded-md text-xs font-bold border border-[#D4AF37]/30">
                  {garmentType}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllFields(!showAllFields)}
                  className="text-[11px] font-bold text-stone-600 hover:text-[#B39025] flex items-center gap-1 cursor-pointer transition"
                >
                  <Filter className="w-3 h-3 text-[#D4AF37]" />
                  <span>
                    {showAllFields 
                      ? (language === 'fa' ? 'فقط اندازه‌های این لباس' : 'Show Only Garment Fields')
                      : (language === 'fa' ? 'نمایش همه اندازه‌ها' : 'Show All Fields')}
                  </span>
                </button>
                <span className="text-[11px] font-mono text-stone-500 font-semibold">
                  {t.unitInch} (in)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredMeasurementFields.map(field => {
                const label = language === 'ps' 
                  ? field.labelPs 
                  : language === 'fa' 
                  ? field.labelFa 
                  : field.labelEn;

                const val = measurements[field.key] !== undefined ? String(measurements[field.key]) : '';

                return (
                  <div 
                    key={field.id}
                    className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 hover:border-[#D4AF37]/50 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span>{label}</span>
                      <span className="text-[10px] font-mono text-stone-400">{field.unit || 'in'}</span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={val}
                        onChange={e => {
                          const v = e.target.value;
                          setMeasurements(prev => ({ ...prev, [field.key]: v }));
                        }}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-sm font-mono font-black text-center text-[#1A1A1A] focus:outline-hidden focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>

                    {/* Step +/- Adjustment Pills */}
                    <div className="flex items-center justify-center gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => adjustMeasurement(field.key, -0.5)}
                        className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-[10px] font-mono font-bold text-stone-700 cursor-pointer"
                      >
                        -0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustMeasurement(field.key, -0.25)}
                        className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-[10px] font-mono font-bold text-stone-700 cursor-pointer"
                      >
                        -0.25
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustMeasurement(field.key, 0.25)}
                        className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-[10px] font-mono font-bold text-stone-700 cursor-pointer"
                      >
                        +0.25
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustMeasurement(field.key, 0.5)}
                        className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 rounded text-[10px] font-mono font-bold text-stone-700 cursor-pointer"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Garment Design Options (DYNAMIC FOR SELECTED GARMENT) */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2 text-[#1A1A1A] font-extrabold text-sm">
                <span className="w-1.5 h-5 bg-[#D4AF37] rounded-full inline-block" />
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.garmentDesign}</span>
                <span className="px-2 py-0.5 bg-amber-50 text-[#B39025] rounded-md text-xs font-bold border border-[#D4AF37]/30">
                  {garmentType}
                </span>
              </div>
              <span className="text-xs text-stone-400">
                {filteredDesignCategories.length} {language === 'fa' ? 'گزینه دیزاین' : 'options'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDesignCategories.map(cat => {
                const title = language === 'ps' 
                  ? cat.titlePs 
                  : language === 'fa' 
                  ? cat.titleFa 
                  : cat.titleEn;

                const currentVal = designSelections[cat.key] || '';

                return (
                  <div key={cat.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <label className="block text-xs font-bold text-stone-700">
                      {title}
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                      {cat.options.map(opt => {
                        const optName = language === 'ps' 
                          ? opt.namePs 
                          : language === 'fa' 
                          ? opt.nameFa 
                          : opt.nameEn;

                        const isSelected = currentVal === optName;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setDesignSelections(prev => ({
                              ...prev,
                              [cat.key]: optName
                            }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#D4AF37] text-[#1A1A1A] font-bold shadow-xs'
                                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {optName}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom input if needed */}
                    {cat.allowCustomInput && (
                      <input
                        type="text"
                        value={currentVal}
                        onChange={e => setDesignSelections(prev => ({
                          ...prev,
                          [cat.key]: e.target.value
                        }))}
                        placeholder={language === 'fa' ? 'یا تایپ دیزاین خاص...' : 'Or type custom style...'}
                        className="w-full px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs focus:outline-hidden focus:border-[#D4AF37]"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Status, Dates, Pricing & Quick Actions */}
        <div className="space-y-6">
          {/* 1. Order Status Field */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#1A1A1A] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#1A1A1A] font-extrabold text-sm border-b border-[#E5E5E5] pb-2">
              <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
              <PackageCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.orderStatus}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  status === 'pending'
                    ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500 font-extrabold'
                    : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>⏳</span>
                <span>{t.statusPending}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('in_progress')}
                className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  status === 'in_progress'
                    ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-500 font-extrabold'
                    : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>✂️</span>
                <span>{t.statusInProgress}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('ready')}
                className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  status === 'ready'
                    ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500 font-extrabold'
                    : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>✅</span>
                <span>{t.statusReady}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('delivered')}
                className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  status === 'delivered'
                    ? 'bg-purple-100 text-purple-900 ring-2 ring-purple-500 font-extrabold'
                    : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>📦</span>
                <span>{t.statusDelivered}</span>
              </button>
            </div>
          </div>

          {/* 2. Delivery date */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#1A1A1A] font-extrabold text-sm border-b border-[#E5E5E5] pb-2">
              <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.dates}</span>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                {t.deliveryDate} (تاریخ وعده)
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] outline-hidden"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setQuickDeliveryDays(3)}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-stone-700 cursor-pointer"
                >
                  +3 {language === 'fa' ? 'روز' : 'Days'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeliveryDays(5)}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-stone-700 cursor-pointer"
                >
                  +5 {language === 'fa' ? 'روز' : 'Days'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeliveryDays(7)}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-stone-700 cursor-pointer"
                >
                  +7 {language === 'fa' ? 'روز' : 'Days'}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Special Instructions & Storage Location */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#1A1A1A] font-extrabold text-sm border-b border-[#E5E5E5] pb-2">
              <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>{t.specialNotes}</span>
            </div>
            <textarea
              rows={3}
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder={language === 'fa' ? 'مثال: کالر یی 1.75 راشی، دوخت زنجیری...' : language === 'ps' ? 'مثال: کالر یی 1.75 راشی، تنګ دوخت...' : 'e.g. Collar 1.75 inch, soft fusing...'}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:border-[#D4AF37] outline-hidden"
            />

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                {language === 'fa' ? 'شماره الماری / رف نگهداری لباس (اختیاری)' : language === 'ps' ? 'د المارۍ یا د کالیو د ایښودلو ځای شمېره' : 'Cabinet / Shelf Storage Slot (Optional)'}
              </label>
              <input
                type="text"
                value={cabinetSlot}
                onChange={e => setCabinetSlot(e.target.value)}
                placeholder={language === 'fa' ? 'مثال: A-05 یا الماری ۲' : 'e.g. A-05, Shelf 2'}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] outline-hidden"
              />
            </div>
          </div>

          {/* 4. Pricing, Advance & Balance Card */}
          <div className="bg-white p-5 rounded-2xl border-2 border-[#1A1A1A] shadow-md space-y-4">
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
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
                {t.totalAmount} (جمله)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalAmount}
                  onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base font-mono font-black text-[#1A1A1A] focus:bg-white focus:border-[#D4AF37] outline-hidden"
                />
                <span className="absolute end-3 top-3 text-xs text-stone-500 font-bold">
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
                  className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-base font-mono font-black text-emerald-900 focus:bg-white focus:border-emerald-500 outline-hidden"
                />
                <span className="absolute end-3 top-3 text-xs text-emerald-600 font-bold">
                  {currencySymbol}
                </span>
              </div>
              {/* Quick full paid button */}
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setPaidAmount(totalAmount)}
                  className="text-[11px] text-emerald-700 hover:underline font-bold"
                >
                  {language === 'fa' ? 'تسویه کامل (رسید کامل)' : 'Mark full paid'}
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={() => setPaidAmount(0)}
                  className="text-[11px] text-stone-500 hover:underline font-medium"
                >
                  {language === 'fa' ? 'بدون پیش‌پرداخت' : 'Zero advance'}
                </button>
              </div>
            </div>

            {/* Balance Remaining Display */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold text-[#1A1A1A]">
                {t.balanceRemaining} (باقیات):
              </span>
              <span className={`font-mono text-lg font-black ${balanceAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {balanceAmount} <span className="text-xs font-normal text-stone-500">{currencySymbol}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="w-full py-3.5 px-4 bg-[#D4AF37] hover:bg-[#C29E2E] active:scale-98 text-[#1A1A1A] font-black rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Printer className="w-5 h-5" />
              )}
              <span>{isSaving ? (language === 'fa' ? 'در حال ثبت در دیتابیس...' : 'Saving to Database...') : t.saveAndPrint}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="w-full py-3 px-4 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span>{isSaving ? (language === 'fa' ? 'در حال ثبت در دیتابیس...' : 'Saving to Database...') : t.saveOrder}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
