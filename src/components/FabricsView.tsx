import React, { useState, useMemo } from 'react';
import { Fabric, ShopSettings, Language } from '../types';
import { translations } from '../translations/i18n';
import { storageService } from '../services/storage';
import { 
  Layers, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Scissors, 
  Check, 
  X, 
  Sparkles,
  AlertTriangle,
  Package,
  ArrowUpDown
} from 'lucide-react';

interface FabricsViewProps {
  fabrics: Fabric[];
  shopSettings: ShopSettings;
  language: Language;
  onFabricUpdated: () => void;
  onSelectFabricForOrder?: (fabric: Fabric) => void;
}

export const FabricsView: React.FC<FabricsViewProps> = ({
  fabrics,
  shopSettings,
  language,
  onFabricUpdated,
  onSelectFabricForOrder,
}) => {
  const t = translations[language];

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formType, setFormType] = useState('');
  const [formPrice, setFormPrice] = useState<number>(500);
  const [formStock, setFormStock] = useState<number>(50);
  const [formNotes, setFormNotes] = useState('');

  const currencySymbol = language === 'ps' 
    ? shopSettings.currencyPs 
    : language === 'fa' 
    ? shopSettings.currencyFa 
    : shopSettings.currencyEn;

  // Filtered Fabrics
  const filteredFabrics = useMemo(() => {
    return fabrics.filter(fabric => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q || (
        fabric.name.toLowerCase().includes(q) ||
        fabric.code.toLowerCase().includes(q) ||
        fabric.color.toLowerCase().includes(q) ||
        fabric.type.toLowerCase().includes(q) ||
        (fabric.notes && fabric.notes.toLowerCase().includes(q))
      );

      let matchesStock = true;
      const stock = Number(fabric.stockMeters) || 0;
      if (stockFilter === 'in_stock') matchesStock = stock >= 15;
      else if (stockFilter === 'low_stock') matchesStock = stock > 0 && stock < 15;
      else if (stockFilter === 'out_of_stock') matchesStock = stock <= 0;

      return matchesSearch && matchesStock;
    });
  }, [fabrics, searchTerm, stockFilter]);

  // Total stock summary
  const summary = useMemo(() => {
    const totalVarieties = fabrics.length;
    const totalMeters = fabrics.reduce((sum, f) => sum + (Number(f.stockMeters) || 0), 0);
    const lowStockCount = fabrics.filter(f => (Number(f.stockMeters) || 0) < 15 && (Number(f.stockMeters) || 0) > 0).length;
    const totalValue = fabrics.reduce((sum, f) => sum + ((Number(f.stockMeters) || 0) * (Number(f.pricePerMeter) || 0)), 0);

    return { totalVarieties, totalMeters, lowStockCount, totalValue };
  }, [fabrics]);

  const openAddModal = () => {
    const nextNum = (fabrics.length + 1).toString().padStart(3, '0');
    setEditingFabric(null);
    setFormName('');
    setFormCode(`FAB-${nextNum}`);
    setFormColor('');
    setFormType('نخی لته (Cotton Latha)');
    setFormPrice(500);
    setFormStock(50);
    setFormNotes('');
    setIsAddingNew(true);
  };

  const openEditModal = (fabric: Fabric) => {
    setEditingFabric(fabric);
    setFormName(fabric.name);
    setFormCode(fabric.code);
    setFormColor(fabric.color);
    setFormType(fabric.type);
    setFormPrice(fabric.pricePerMeter);
    setFormStock(fabric.stockMeters);
    setFormNotes(fabric.notes || '');
    setIsAddingNew(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const fabricToSave: Fabric = {
      id: editingFabric ? editingFabric.id : `fab_${Date.now()}`,
      name: formName.trim(),
      code: formCode.trim() || `FAB-${Date.now().toString().slice(-4)}`,
      color: formColor.trim() || 'سفید / White',
      type: formType.trim() || 'نخی لته',
      pricePerMeter: Number(formPrice) || 0,
      stockMeters: Number(formStock) || 0,
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: editingFabric?.createdAt || new Date().toISOString(),
    };

    storageService.saveFabric(fabricToSave);
    setIsAddingNew(false);
    setEditingFabric(null);
    onFabricUpdated();
  };

  const handleDelete = (fabric: Fabric) => {
    if (window.confirm(`${t.confirmDelete} (${fabric.name})`)) {
      storageService.deleteFabric(fabric.id);
      onFabricUpdated();
    }
  };

  // Quick preset template
  const applyPreset = (presetName: string, presetType: string, presetColor: string, defaultPrice: number) => {
    setFormName(presetName);
    setFormType(presetType);
    setFormColor(presetColor);
    setFormPrice(defaultPrice);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-7 bg-[#D4AF37] rounded-full inline-block shrink-0" />
          <div>
            <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight">
              {t.fabricInventory}
            </h1>
            <p className="text-xs text-stone-700 font-medium">
              {language === 'fa' 
                ? 'مدیریت موجودی رخت‌ها، قیمت فی متر و موجودی گدام' 
                : language === 'ps' 
                ? 'د رختونو موجودي، د متر بیه او د ذخیرې مدیریت'
                : 'Manage shop fabrics stock, meters available and price per meter'}
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          id="btn-add-new-fabric"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C29E2E] text-[#1A1A1A] rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addFabric}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#E5E5E5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-700 block">
              {language === 'fa' ? 'انواع رخت ثبت شده' : language === 'ps' ? 'د رختونو ډولونه' : 'Fabric Types'}
            </span>
            <span className="text-xl font-black text-[#1A1A1A] font-mono mt-0.5 block">
              {summary.totalVarieties}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#D4AF37]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E5E5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-700 block">
              {language === 'fa' ? 'مجموع موجودی (متر)' : language === 'ps' ? 'ټوله ذخیره (متره)' : 'Total Stock'}
            </span>
            <span className="text-xl font-black text-[#1A1A1A] font-mono mt-0.5 block">
              {summary.totalMeters.toLocaleString()} <span className="text-xs font-normal text-stone-700">{t.meters}</span>
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E5E5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-700 block">
              {language === 'fa' ? 'موجودی کم / هشدار' : language === 'ps' ? 'لږ پاتې رختونه' : 'Low Stock Warning'}
            </span>
            <span className="text-xl font-black text-amber-600 font-mono mt-0.5 block">
              {summary.lowStockCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E5E5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-stone-700 block">
              {language === 'fa' ? 'ارزش کل موجودی' : language === 'ps' ? 'د ذخیرې ټول ارزښت' : 'Inventory Value'}
            </span>
            <span className="text-xl font-black text-[#1A1A1A] font-mono mt-0.5 block">
              {summary.totalValue.toLocaleString()} <span className="text-xs font-normal text-stone-700">{currencySymbol}</span>
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-600 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t.searchFabricPlaceholder}
            className="w-full ps-10 pe-9 py-2 bg-stone-50 border border-[#E5E5E5] rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stock status pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'all'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {t.all} ({fabrics.length})
          </button>
          <button
            onClick={() => setStockFilter('in_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'in_stock'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {t.inStock}
          </button>
          <button
            onClick={() => setStockFilter('low_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'low_stock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {t.lowStock}
          </button>
        </div>
      </div>

      {/* Fabric Cards Grid */}
      {filteredFabrics.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-600 mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">{t.noDataFound}</h3>
          <p className="text-xs text-stone-700 max-w-sm mx-auto mb-4">
            {language === 'fa' 
              ? 'هیچ رختی با این مشخصات یافت نشد. می‌توانید رخت جدید ثبت نمایید.' 
              : 'No fabrics matching your search criteria.'}
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C29E2E] text-[#1A1A1A] rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addFabric}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFabrics.map(fabric => {
            const stock = Number(fabric.stockMeters) || 0;
            const isLow = stock > 0 && stock < 15;
            const isOut = stock <= 0;

            return (
              <div
                key={fabric.id}
                id={`fabric-card-${fabric.id}`}
                className="bg-white rounded-2xl border border-[#E5E5E5] p-4 shadow-xs hover:border-[#D4AF37]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Code & Stock Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                      {fabric.code}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isOut 
                        ? 'bg-rose-100 text-rose-800' 
                        : isLow 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isOut ? t.outOfStock : isLow ? t.lowStock : t.inStock}
                    </span>
                  </div>

                  {/* Fabric Name & Type */}
                  <h3 className="font-extrabold text-sm text-[#1A1A1A] leading-snug mb-1 group-hover:text-[#B39025] transition-colors">
                    {fabric.name}
                  </h3>
                  <p className="text-xs text-stone-700 font-medium mb-3">
                    {fabric.type} • <span className="text-stone-800 font-semibold">{fabric.color}</span>
                  </p>

                  {/* Stock meter visual progress */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-stone-700 font-semibold">{t.stockMeters}:</span>
                      <span className="font-mono font-black text-[#1A1A1A] text-sm">
                        {stock} <span className="text-xs font-medium text-stone-700">{t.meters}</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (stock / 60) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Price per meter */}
                  <div className="flex items-center justify-between text-xs py-1 border-b border-stone-100 mb-2">
                    <span className="text-stone-700">{t.pricePerMeter}:</span>
                    <span className="font-mono font-bold text-[#1A1A1A]">
                      {Number(fabric.pricePerMeter).toLocaleString()} {currencySymbol} / {t.meters}
                    </span>
                  </div>

                  {fabric.notes && (
                    <p className="text-[11px] text-stone-700 italic line-clamp-2 mb-2">
                      "{fabric.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 flex items-center justify-between gap-2 border-t border-stone-100">
                  {onSelectFabricForOrder && (
                    <button
                      onClick={() => onSelectFabricForOrder(fabric)}
                      className="flex-1 py-1.5 px-3 bg-amber-50 hover:bg-[#D4AF37] hover:text-[#1A1A1A] text-[#B39025] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>{language === 'fa' ? 'ثبت فرمایش با این رخت' : 'New Order with this'}</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(fabric)}
                      title={t.edit}
                      className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fabric)}
                      title={t.delete}
                      className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Fabric Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#B39025]">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-base text-[#1A1A1A]">
                  {editingFabric ? t.editFabric : t.addFabric}
                </h2>
              </div>
              <button
                onClick={() => setIsAddingNew(false)}
                className="p-1 text-stone-600 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Badges */}
            {!editingFabric && (
              <div className="px-6 pt-3 pb-1 border-b border-stone-100 bg-amber-50/50">
                <span className="text-[11px] font-bold text-stone-700 block mb-1.5">
                  {language === 'fa' ? 'انتخاب سریع از رخت‌های پرکاربرد افغانی:' : 'Quick Presets:'}
                </span>
                <div className="flex flex-wrap gap-1.5 pb-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('لته سفید اعلا (White Cotton Latha)', 'نخی لته (Cotton Latha)', 'سفید / White', 450)}
                    className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-[11px] font-semibold text-stone-700 hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition cursor-pointer"
                  >
                    لته سفید (Latha)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ابریشم بوسکی کرمی (Silk Boski Cream)', 'ابریشم بوسکی (Silk)', 'کرمی / Cream', 850)}
                    className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-[11px] font-semibold text-stone-700 hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition cursor-pointer"
                  >
                    بوسکی (Boski)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('پشم واسکتی طوسی (Charcoal Wool Blend)', 'پشم مجلسی (Wool)', 'خاکستری تیره / Charcoal', 1100)}
                    className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-[11px] font-semibold text-stone-700 hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition cursor-pointer"
                  >
                    پشم واسکتی (Wool)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('واش این ویر ضد چروک (Wash & Wear)', 'واش این ویر (Wash & Wear)', 'آبی آسمانی / Sky Blue', 550)}
                    className="px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-[11px] font-semibold text-stone-700 hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition cursor-pointer"
                  >
                    واش این ویر
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.fabricName} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. لته سفید اعلا / White Cotton Latha"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.fabricCode}
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    placeholder="e.g. FAB-001"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.fabricColor}
                  </label>
                  <input
                    type="text"
                    value={formColor}
                    onChange={e => setFormColor(e.target.value)}
                    placeholder="e.g. سفید، کرمی، سیاه، آبی..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.fabricType}
                </label>
                <input
                  type="text"
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  placeholder="e.g. نخی لته، ابریشم بوسکی، پشم، مخمل، واش این ویر"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.stockMeters} ({t.meters})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formStock}
                    onChange={e => setFormStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.pricePerMeter} ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formPrice}
                    onChange={e => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.notes}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="یادداشت‌های اضافی درباره کیفیت یا تامین کننده رخت..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:bg-white resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2.5 border border-stone-200 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#C29E2E] text-[#1A1A1A] rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
