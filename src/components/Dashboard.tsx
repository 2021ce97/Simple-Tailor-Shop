import React, { useState, useMemo } from 'react';
import { 
  Order, 
  OrderStatus, 
  ShopSettings, 
  Language, 
  Customer 
} from '../types';
import { translations } from '../translations/i18n';
import { storageService } from '../services/storage';
import { 
  Search, 
  Plus, 
  Printer, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Scissors,
  Check,
  ChevronDown,
  Filter,
  Eye,
  CreditCard,
  X,
  Package,
  MessageCircle,
  PackageCheck
} from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  shopSettings: ShopSettings;
  language: Language;
  onNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onViewReceipt: (order: Order) => void;
  onSelectCustomer: (customerId: string) => void;
  onOrderUpdated: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  shopSettings,
  language,
  onNewOrder,
  onEditOrder,
  onViewReceipt,
  onSelectCustomer,
  onOrderUpdated,
}) => {
  const t = translations[language];

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Quick Payment Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [newPaidInput, setNewPaidInput] = useState<number>(0);

  // Currency
  const currencySymbol = language === 'ps' 
    ? shopSettings.currencyPs 
    : language === 'fa' 
    ? shopSettings.currencyFa 
    : shopSettings.currencyEn;

  // Filtered Orders with multi-field search:
  // (Customer name, Contact/phone, Order ID/Number, Order date, Delivery date, Fabric name)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchTerm.trim().toLowerCase();
      
      const matchesSearch = !q || (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        (order.customerWhatsApp && order.customerWhatsApp.includes(q)) ||
        (order.orderDate && order.orderDate.toLowerCase().includes(q)) ||
        (order.deliveryDate && order.deliveryDate.toLowerCase().includes(q)) ||
        (order.fabricName && order.fabricName.toLowerCase().includes(q)) ||
        (order.cabinetSlot && order.cabinetSlot.toLowerCase().includes(q))
      );

      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      // Payment filter
      const matchesPayment = 
        paymentFilter === 'all' ||
        (paymentFilter === 'paid' && order.balanceAmount === 0) ||
        (paymentFilter === 'balance' && order.balanceAmount > 0);

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  // Dashboard Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const inProgress = orders.filter(o => o.status === 'in_progress').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const totalBalance = orders.reduce((sum, o) => sum + (Number(o.balanceAmount) || 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    return { total, pending, inProgress, ready, delivered, totalBalance, totalRevenue };
  }, [orders]);

  // Quick status updater
  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    const updated: Order = {
      ...order,
      status: newStatus,
      completedDate: newStatus === 'ready' ? new Date().toISOString() : order.completedDate,
      deliveredDate: newStatus === 'delivered' ? new Date().toISOString() : order.deliveredDate,
    };
    storageService.saveOrder(updated);
    onOrderUpdated();
  };

  // Quick Payment Save
  const handleSavePaymentUpdate = () => {
    if (!paymentModalOrder) return;
    const paid = Number(newPaidInput) || 0;
    const total = Number(paymentModalOrder.totalAmount) || 0;
    const balance = Math.max(0, total - paid);

    const updated: Order = {
      ...paymentModalOrder,
      paidAmount: paid,
      balanceAmount: balance,
      paymentStatus: balance === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
    };

    storageService.saveOrder(updated);
    setPaymentModalOrder(null);
    onOrderUpdated();
  };

  const openPaymentModal = (order: Order) => {
    setPaymentModalOrder(order);
    setNewPaidInput(order.paidAmount);
  };

  const handleDeleteOrder = (order: Order) => {
    if (window.confirm(`${t.confirmDelete} (${t.orderNumber}: ${order.orderNumber})`)) {
      storageService.deleteOrder(order.id);
      onOrderUpdated();
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-7 bg-[#D4AF37] rounded-full inline-block shrink-0" />
          <div>
            <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight">
              {t.dashboard}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {orders.length} {t.totalOrders} • {language === 'fa' ? 'مدیریت، فیلتر و جستجوی سریع سفارشات' : language === 'ps' ? 'د فرمایشونو چټکه پلټنه او فلټر' : 'Fast search, status filtering and order tracking'}
            </p>
          </div>
        </div>

        <button
          onClick={onNewOrder}
          id="dashboard-new-order-btn"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#C29E2E] active:scale-98 text-[#1A1A1A] font-black rounded-xl text-sm transition cursor-pointer shadow-xs"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>{t.newOrder}</span>
        </button>
      </div>

      {/* Metrics Row - Bento Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs flex items-center justify-between group hover:border-[#D4AF37]/50 transition">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold block">{t.totalOrders}</span>
            <span className="text-2xl font-black text-[#1A1A1A] font-mono mt-1 block">{metrics.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-[#D4AF37]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Ready for Pickup */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs flex items-center justify-between group hover:border-emerald-300 transition">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold block">{t.readyOrders}</span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{metrics.ready}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: In Stitching / Pending */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs flex items-center justify-between group hover:border-[#D4AF37]/50 transition">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-amber-900 font-bold block">{t.inProgressOrders} / {t.statusPending}</span>
            <span className="text-2xl font-black text-[#D4AF37] font-mono mt-1 block">
              {metrics.inProgress + metrics.pending}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B39025] flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Total Uncollected Balance */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs flex items-center justify-between group hover:border-rose-300 transition">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-rose-800 font-bold block">{t.totalBalanceDue}</span>
            <div className="text-xl font-black text-rose-600 font-mono mt-1 flex items-baseline gap-1">
              <span>{metrics.totalBalance.toLocaleString()}</span>
              <span className="text-xs text-stone-500 font-sans font-normal">{currencySymbol}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input: Order #, Contact Number, Customer Name, Date, Fabric */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full ps-10 pe-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs with Counts */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl overflow-x-auto pb-1 md:pb-1">
            {[
              { id: 'all', label: t.all, count: metrics.total },
              { id: 'pending', label: t.statusPending, count: metrics.pending },
              { id: 'in_progress', label: t.statusInProgress, count: metrics.inProgress },
              { id: 'ready', label: t.statusReady, count: metrics.ready },
              { id: 'delivered', label: t.statusDelivered, count: metrics.delivered },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-[#1A1A1A] text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.id ? 'bg-[#D4AF37] text-[#1A1A1A] font-bold' : 'bg-stone-200 text-stone-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 outline-hidden focus:border-[#D4AF37]"
          >
            <option value="all">{t.paymentStatus}: {t.all}</option>
            <option value="paid">{t.paid}</option>
            <option value="balance">{t.balanceRemaining} ({t.partial})</option>
          </select>
        </div>
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E5E5E5] shadow-xs">
          <div className="w-16 h-16 rounded-full bg-stone-100 border border-stone-200 mx-auto flex items-center justify-center text-[#D4AF37] mb-3">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">{t.noDataFound}</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {searchTerm 
              ? (language === 'fa' ? 'هیچ سفارشی با این مشخصات یافت نشد. جستجوی دیگری را امتحان کنید.' : 'No orders matched your search criteria.') 
              : (language === 'fa' ? 'هنوز فرمایشی ثبت نشده است.' : 'No orders registered yet.')}
          </p>
          {searchTerm ? (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPaymentFilter('all'); }}
              className="mt-4 px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {language === 'fa' ? 'پاک کردن فیلترها' : 'Clear Filters'}
            </button>
          ) : (
            <button
              onClick={onNewOrder}
              className="mt-4 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#C29E2E] text-[#1A1A1A] rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
            >
              + {t.newOrder}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Responsive Card Layout for Mobile, Table Layout for Desktop */}
          <div className="hidden lg:block bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-xs">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-[#E5E5E5] text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 text-start">{t.orderNumber}</th>
                  <th className="py-3.5 px-4 text-start">{t.customerDetails}</th>
                  <th className="py-3.5 px-4 text-start">{t.garmentType} & {t.fabric}</th>
                  <th className="py-3.5 px-4 text-start">{t.dates}</th>
                  <th className="py-3.5 px-4 text-start">{t.orderStatus}</th>
                  <th className="py-3.5 px-4 text-start">{t.paymentStatus}</th>
                  <th className="py-3.5 px-4 text-end">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {filteredOrders.map(order => {
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-amber-50/40 transition group"
                    >
                      {/* Order Number & Cabinet */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-black text-sm text-[#1A1A1A] tracking-wider">
                            № {order.orderNumber}
                          </span>
                          {order.cabinetSlot && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#D4AF37] bg-stone-900 px-2 py-0.5 rounded-md w-fit">
                              📦 {order.cabinetSlot}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4 align-middle">
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => onSelectCustomer(order.customerId)}
                            className="font-extrabold text-[#1A1A1A] hover:text-[#B39025] transition text-start block"
                          >
                            {order.customerName}
                          </button>
                          <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
                            <span>{order.customerPhone}</span>
                            {order.customerWhatsApp && (
                              <a
                                href={`https://wa.me/${order.customerWhatsApp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Garment Type & Fabric */}
                      <td className="py-3 px-4 align-middle">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#1A1A1A] block">{order.garmentType}</span>
                          <span className="text-[11px] text-stone-500 block truncate max-w-[180px]">
                            {order.fabricName ? `🧵 ${order.fabricName}` : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 align-middle font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <div className="text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{order.orderDate.slice(0, 10)}</span>
                          </div>
                          <div className="text-[#1A1A1A] font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#D4AF37]" />
                            <span>{order.deliveryDate}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4 align-middle">
                        <select
                          value={order.status}
                          onChange={e => handleUpdateStatus(order, e.target.value as OrderStatus)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border outline-hidden cursor-pointer ${
                            order.status === 'ready'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : order.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : order.status === 'delivered'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="pending">⏳ {t.statusPending}</option>
                          <option value="in_progress">✂️ {t.statusInProgress}</option>
                          <option value="ready">✅ {t.statusReady}</option>
                          <option value="delivered">📦 {t.statusDelivered}</option>
                        </select>
                      </td>

                      {/* Payment Status & Balance */}
                      <td className="py-3 px-4 align-middle">
                        <button
                          type="button"
                          onClick={() => openPaymentModal(order)}
                          className="text-start hover:opacity-80 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.balanceAmount === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paidAmount > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {order.balanceAmount === 0 ? t.paid : order.paidAmount > 0 ? t.partial : t.unpaid}
                            </span>
                          </div>
                          <div className="font-mono text-xs">
                            <span className="font-bold text-[#1A1A1A]">{order.totalAmount}</span>
                            {order.balanceAmount > 0 && (
                              <span className="text-rose-600 font-bold block text-[11px]">
                                ({t.balanceRemaining}: {order.balanceAmount})
                              </span>
                            )}
                          </div>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-middle text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewReceipt(order)}
                            title={t.printReceipt}
                            className="p-1.5 bg-[#D4AF37] hover:bg-[#C29E2E] text-[#1A1A1A] rounded-lg transition cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditOrder(order)}
                            title={t.edit}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            title={t.delete}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Friendly Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3.5">
            {filteredOrders.map(order => {
              return (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs space-y-3"
                >
                  {/* Card Top: Order Number & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#1A1A1A]">
                        № {order.orderNumber}
                      </span>
                      {order.cabinetSlot && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-stone-900 text-[#D4AF37] rounded-md">
                          📦 {order.cabinetSlot}
                        </span>
                      )}
                    </div>

                    <select
                      value={order.status}
                      onChange={e => handleUpdateStatus(order, e.target.value as OrderStatus)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border outline-hidden ${
                        order.status === 'ready'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : order.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : order.status === 'delivered'
                          ? 'bg-purple-50 text-purple-800 border-purple-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="pending">⏳ {t.statusPending}</option>
                      <option value="in_progress">✂️ {t.statusInProgress}</option>
                      <option value="ready">✅ {t.statusReady}</option>
                      <option value="delivered">📦 {t.statusDelivered}</option>
                    </select>
                  </div>

                  {/* Customer & Garment */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#1A1A1A]">
                        {order.customerName}
                      </h3>
                      <p className="text-xs text-stone-500 font-mono mt-0.5">{order.customerPhone}</p>
                    </div>
                    <div className="text-end">
                      <span className="text-xs font-bold text-stone-800 block">{order.garmentType}</span>
                      {order.fabricName && (
                        <span className="text-[11px] text-stone-500 block truncate max-w-[140px]">
                          🧵 {order.fabricName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Balance Info */}
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone-500 text-[11px] block">{t.totalAmount}</span>
                      <span className="font-mono font-bold text-[#1A1A1A]">{order.totalAmount} {currencySymbol}</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 text-[11px] block">{t.paidAmount}</span>
                      <span className="font-mono font-bold text-emerald-800">{order.paidAmount} {currencySymbol}</span>
                    </div>
                    <div>
                      <span className="text-rose-600 text-[11px] block">{t.balanceRemaining}</span>
                      <span className="font-mono font-bold text-rose-600">{order.balanceAmount} {currencySymbol}</span>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{order.deliveryDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(order)}
                        className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#C29E2E] text-[#1A1A1A] rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{t.receipt}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-sm text-[#1A1A1A] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.paymentStatus} (№ {paymentModalOrder.orderNumber})</span>
              </h3>
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">{t.totalAmount}:</span>
                <span className="font-mono font-bold">{paymentModalOrder.totalAmount} {currencySymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t.balanceRemaining}:</span>
                <span className="font-mono font-bold text-rose-600">{paymentModalOrder.balanceAmount} {currencySymbol}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1">
                {t.paidAmount} ({currencySymbol})
              </label>
              <input
                type="number"
                value={newPaidInput}
                onChange={e => setNewPaidInput(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-bold focus:outline-hidden focus:border-[#D4AF37]"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNewPaidInput(paymentModalOrder.totalAmount)}
                  className="text-[11px] text-emerald-700 font-bold hover:underline"
                >
                  {language === 'fa' ? 'تسویه کامل' : 'Full Paid'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSavePaymentUpdate}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C29E2E] rounded-xl text-xs font-black text-[#1A1A1A]"
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
