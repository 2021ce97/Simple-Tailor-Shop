import React, { useState, useMemo } from 'react';
import { 
  Customer, 
  Order, 
  MeasurementField, 
  ShopSettings, 
  Language 
} from '../types';
import { translations } from '../translations/i18n';
import { storageService } from '../services/storage';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Scissors, 
  Calendar, 
  Edit3, 
  Trash2, 
  History, 
  FileText, 
  Printer, 
  UserCheck, 
  X, 
  Save, 
  ChevronRight,
  ArrowRight,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  measurementFields: MeasurementField[];
  shopSettings: ShopSettings;
  language: Language;
  selectedCustomerId?: string | null;
  onNewOrderForCustomer: (customer: Customer) => void;
  onViewReceipt: (order: Order) => void;
  onCustomerUpdated: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  measurementFields,
  shopSettings,
  language,
  selectedCustomerId,
  onNewOrderForCustomer,
  onViewReceipt,
  onCustomerUpdated,
}) => {
  const t = translations[language];

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(
    selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) || null : null
  );
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Currency
  const currencySymbol = language === 'ps' 
    ? shopSettings.currencyPs 
    : language === 'fa' 
    ? shopSettings.currencyFa 
    : shopSettings.currencyEn;

  // Filtered Customers: search by Name, Phone, or Past Order Number!
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers;

    // Find order numbers matching search term to also find associated customer IDs
    const matchedCustomerIdsFromOrders = new Set(
      orders
        .filter(o => o.orderNumber.toLowerCase().includes(q))
        .map(o => o.customerId)
    );

    return customers.filter(cust => {
      const matchName = cust.name.toLowerCase().includes(q);
      const matchPhone = cust.phone.includes(q);
      const matchOrder = matchedCustomerIdsFromOrders.has(cust.id);
      const matchNotes = cust.notes && cust.notes.toLowerCase().includes(q);

      return matchName || matchPhone || matchOrder || matchNotes;
    });
  }, [customers, orders, searchTerm]);

  // Customer orders
  const activeCustomerOrders = useMemo(() => {
    if (!activeCustomer) return [];
    return orders.filter(o => o.customerId === activeCustomer.id || o.customerPhone === activeCustomer.phone);
  }, [orders, activeCustomer]);

  // Open Edit/Add Modal
  const handleOpenEditModal = (cust?: Customer) => {
    if (cust) {
      setEditingCustomer({ ...cust });
    } else {
      setEditingCustomer({
        id: 'cust_' + Date.now(),
        name: '',
        phone: '',
        whatsapp: '',
        address: '',
        notes: '',
        standardMeasurements: {},
        preferredGarmentType: 'perahanTunban',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setIsEditingModalOpen(true);
  };

  // Save Customer (from edit modal)
  const handleSaveCustomer = () => {
    if (!editingCustomer || !editingCustomer.name.trim()) {
      alert(language === 'fa' ? 'لطفاً نام مشتری را وارد نمایید' : 'Please enter customer name');
      return;
    }

    storageService.saveCustomer(editingCustomer);
    setIsEditingModalOpen(false);
    setActiveCustomer(editingCustomer);
    onCustomerUpdated();
  };

  // Delete Customer
  const handleDeleteCustomer = (cust: Customer) => {
    if (window.confirm(`${t.confirmDelete} (${cust.name})`)) {
      storageService.deleteCustomer(cust.id);
      if (activeCustomer?.id === cust.id) {
        setActiveCustomer(null);
      }
      onCustomerUpdated();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner - Bento Style */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
            <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight">
              {t.customers}
            </h1>
          </div>
          <p className="text-xs text-[#706E6B] mt-0.5">
            {customers.length} {t.customersList} • {t.newCustomerAutoSaved}
          </p>
        </div>

        <button
          onClick={() => handleOpenEditModal()}
          id="add-new-customer-btn"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#B39025] active:scale-98 text-[#1A1A1A] font-black rounded-xl text-sm transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.addNewCustomer}</span>
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Customer Search & List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search Box */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t.searchCustomersPlaceholder}
                className="w-full pl-9 pr-4 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs focus:bg-white focus:border-[#D4AF37] outline-hidden font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Customers Cards List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-2xl border border-[#E5E5E5] text-xs text-[#706E6B]">
                {t.noDataFound}
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const isSelected = activeCustomer?.id === cust.id;
                const custOrders = orders.filter(o => o.customerId === cust.id || o.customerPhone === cust.phone);

                return (
                  <div
                    key={cust.id}
                    onClick={() => setActiveCustomer(cust)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#F9F7F2] border-[#D4AF37] shadow-xs ring-1 ring-[#D4AF37]'
                        : 'bg-white border-[#E5E5E5] hover:bg-[#F9F7F2]/60 shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#1A1A1A] truncate">{cust.name}</h3>
                        {cust.preferredGarmentType && (
                          <span className="text-[9px] bg-[#F9F7F2] text-[#706E6B] px-2 py-0.5 rounded-md font-medium border border-[#E5E5E5]">
                            {cust.preferredGarmentType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#706E6B] mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{cust.phone || '---'}</span>
                        </span>
                        <span>•</span>
                        <span>{custOrders.length} {language === 'fa' ? 'سفارش' : 'Orders'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewOrderForCustomer(cust);
                        }}
                        className="p-1.5 text-[#1A1A1A] bg-[#D4AF37] hover:bg-[#B39025] rounded-lg transition shadow-2xs cursor-pointer"
                        title={t.createNewOrderForCustomer}
                      >
                        <Scissors className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Customer Details & Saved Measurements (7 Cols) */}
        <div className="lg:col-span-7">
          {activeCustomer ? (
            <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xs p-6 space-y-6">
              {/* Profile Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#1A1A1A] flex items-center justify-center text-[#D4AF37] font-black text-lg">
                    {activeCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#1A1A1A]">
                      {activeCustomer.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-[#706E6B] font-mono mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{activeCustomer.phone}</span>
                      {activeCustomer.whatsapp && activeCustomer.whatsapp !== activeCustomer.phone && (
                        <span className="text-emerald-700 font-semibold">WA: {activeCustomer.whatsapp}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNewOrderForCustomer(activeCustomer)}
                    id="new-order-from-profile-btn"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#B39025] active:scale-98 text-[#1A1A1A] font-black rounded-xl text-xs transition cursor-pointer shadow-xs"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>{t.createNewOrderForCustomer}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(activeCustomer)}
                    className="p-1.5 text-[#1A1A1A] hover:text-black bg-[#F9F7F2] hover:bg-stone-200 rounded-lg transition border border-[#E5E5E5] cursor-pointer"
                    title={t.edit}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteCustomer(activeCustomer)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 bg-[#F9F7F2] hover:bg-rose-50 rounded-lg transition border border-[#E5E5E5] cursor-pointer"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Saved Measurements Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
                    <Scissors className="w-4 h-4 text-[#D4AF37]" />
                    <span>{t.savedMeasurements} ({t.unitInches})</span>
                  </h3>
                  <span className="text-xs text-[#706E6B]">
                    {language === 'fa' ? 'اندازه‌های استاندارد این مشتری' : 'Standard measurements profile'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {measurementFields.map(field => {
                    const label = language === 'ps' 
                      ? field.labelPs 
                      : language === 'fa' 
                      ? field.labelFa 
                      : field.labelEn;
                    const val = activeCustomer.standardMeasurements?.[field.key];

                    return (
                      <div 
                        key={field.id} 
                        className="p-2 bg-[#F9F7F2] rounded-xl border border-[#E5E5E5] text-center"
                      >
                        <span className="text-[11px] font-semibold text-[#706E6B] block">
                          {label}
                        </span>
                        <span className="font-mono font-black text-sm text-[#1A1A1A] mt-0.5 block">
                          {val !== undefined && val !== '' ? val : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes & Address */}
              {(activeCustomer.notes || activeCustomer.address) && (
                <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#E5E5E5] text-xs space-y-1">
                  {activeCustomer.address && (
                    <p className="text-[#2D2926]">
                      <b className="text-[#1A1A1A]">{t.shopAddress}:</b> {activeCustomer.address}
                    </p>
                  )}
                  {activeCustomer.notes && (
                    <p className="text-[#2D2926]">
                      <b className="text-[#1A1A1A]">{t.notes}:</b> {activeCustomer.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Customer Order History */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-1.5">
                  <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
                  <History className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.customerHistory} ({activeCustomerOrders.length})</span>
                </h3>

                {activeCustomerOrders.length === 0 ? (
                  <p className="text-xs text-[#706E6B] italic">
                    {language === 'fa' ? 'هنوز سفارشی ثبت نشده است.' : 'No orders in history.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeCustomerOrders.map(ord => (
                      <div 
                        key={ord.id}
                        className="p-3 bg-[#F9F7F2] hover:bg-stone-200/50 rounded-xl border border-[#E5E5E5] flex items-center justify-between gap-3 text-xs transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[#1A1A1A]">#{ord.orderNumber}</span>
                            <span className="font-semibold text-[#1A1A1A]">{ord.garmentType}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ord.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                              ord.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              ord.status === 'delivered' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t[('status' + ord.status.charAt(0).toUpperCase() + ord.status.slice(1).replace('_', '')) as keyof typeof t] || ord.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[#706E6B] mt-1 font-mono">
                            <span>{ord.orderDate}</span>
                            <span>•</span>
                            <span>{ord.totalAmount} {currencySymbol}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onViewReceipt(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-stone-100 border border-[#E5E5E5] rounded-lg text-[11px] font-bold text-[#1A1A1A] transition cursor-pointer shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{t.print}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xs p-12 text-center text-[#706E6B]">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-40 text-[#D4AF37]" />
              <p className="text-sm font-bold text-[#1A1A1A]">{t.customerProfile}</p>
              <p className="text-xs mt-1">
                {language === 'fa' ? 'لطفاً یک مشتری را از لیست سمت چپ انتخاب کنید' : 'Please select a customer from the left list'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isEditingModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E5E5E5] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#D4AF37] rounded-full inline-block" />
                <h3 className="font-bold text-base text-[#1A1A1A]">
                  {editingCustomer.id.startsWith('cust_') && !customers.find(c => c.id === editingCustomer.id) 
                    ? t.addNewCustomer 
                    : t.editCustomer}
                </h3>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#706E6B] uppercase tracking-wider mb-1">{t.customerName} *</label>
                  <input
                    type="text"
                    value={editingCustomer.name}
                    onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#706E6B] uppercase tracking-wider mb-1">{t.contactNumber} *</label>
                  <input
                    type="text"
                    value={editingCustomer.phone}
                    onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* WhatsApp & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#706E6B] uppercase tracking-wider mb-1">{t.whatsappNumber}</label>
                  <input
                    type="text"
                    value={editingCustomer.whatsapp || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, whatsapp: e.target.value })}
                    placeholder="0782207308..."
                    className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#706E6B] uppercase tracking-wider mb-1">{t.shopAddress}</label>
                  <input
                    type="text"
                    value={editingCustomer.address || ''}
                    onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    placeholder="Kabul, Afghanistan..."
                    className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs focus:outline-hidden focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Standard Measurements Grid */}
              <div className="border-t border-[#E5E5E5] pt-3">
                <label className="block font-bold text-[#1A1A1A] mb-2">
                  {t.savedMeasurements} ({t.unitInches})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {measurementFields.map(field => {
                    const label = language === 'ps' ? field.labelPs : language === 'fa' ? field.labelFa : field.labelEn;
                    const val = editingCustomer.standardMeasurements?.[field.key] || '';

                    return (
                      <div key={field.id} className="p-2 bg-[#F9F7F2] rounded-lg border border-[#E5E5E5]">
                        <span className="text-[10px] font-bold text-[#706E6B] block">{label}</span>
                        <input
                          type="text"
                          value={val}
                          onChange={e => {
                            const newM = { ...(editingCustomer.standardMeasurements || {}), [field.key]: e.target.value };
                            setEditingCustomer({ ...editingCustomer, standardMeasurements: newM });
                          }}
                          placeholder="0.0"
                          className="w-full mt-1 px-1.5 py-1 bg-white border border-[#E5E5E5] rounded text-xs font-mono font-bold text-center focus:outline-hidden focus:border-[#D4AF37]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-[#706E6B] uppercase tracking-wider mb-1">{t.notes}</label>
                <textarea
                  rows={2}
                  value={editingCustomer.notes || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="Special instructions or fitting preferences..."
                  className="w-full p-2.5 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs focus:outline-hidden focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] pt-3">
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="px-4 py-2 bg-[#F9F7F2] hover:bg-stone-200 text-[#706E6B] text-xs font-bold rounded-xl border border-[#E5E5E5] cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-5 py-2 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] text-xs font-black rounded-xl shadow-xs cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
