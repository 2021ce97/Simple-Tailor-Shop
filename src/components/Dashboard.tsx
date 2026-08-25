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
  X
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

  // Filtered Orders with multi-field search (Order Number, Customer Name, Contact Number)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchTerm.trim().toLowerCase();
      
      // Search matching Order #, Name, Phone, Cabinet
      const matchesSearch = !q || (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
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

  // Delete Order
  const handleDeleteOrder = (order: Order) => {
    if (window.confirm(`${t.confirmDelete} (#${order.orderNumber} - ${order.customerName})`)) {
      storageService.deleteOrder(order.id);
      onOrderUpdated();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Actions - Bento Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-7 bg-[#D4AF37] rounded-full inline-block shrink-0" />
          <div>
            <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight">
              {t.dashboard}
            </h1>
            <p className="text-xs text-[#706E6B] mt-0.5">
              {orders.length} {t.totalOrders} • {language === 'fa' ? 'مدیریت و جستجوی سریع سفارشات' : language === 'ps' ? 'د فرمایشونو چټکه پلټنه او مدیریت' : 'Fast search and order tracking'}
            </p>
          </div>
        </div>

        <button
          onClick={onNewOrder}
          id="dashboard-new-order-btn"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#B39025] active:scale-98 text-[#1A1A1A] font-black rounded-xl text-sm transition cursor-pointer shadow-xs"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>{t.newOrder}</span>
        </button>
      </div>

      {/* Metrics Row - Bento Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Orders */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] shadow-xs flex items-center justify-between group hover:border-[#D4AF37]/50 transition">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#706E6B] font-bold block">{t.totalOrders}</span>
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
              <span>{metrics.totalBalance}</span>
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
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Main Search Input: Order #, Contact Number, Customer Name */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-sm focus:bg-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-hidden font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F9F7F2] p-1 rounded-xl border border-[#E5E5E5]">
            {[
              { id: 'all', label: t.all },
              { id: 'pending', label: t.statusPending },
              { id: 'in_progress', label: t.statusInProgress },
              { id: 'ready', label: t.statusReady },
              { id: 'delivered', label: t.statusDelivered },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-2xs font-black'
                    : 'text-[#706E6B] hover:text-[#1A1A1A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-[#F9F7F2] border border-[#E5E5E5] rounded-xl text-xs font-semibold text-stone-700 outline-hidden focus:border-[#D4AF37]"
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
          <div className="w-16 h-16 rounded-full bg-[#F9F7F2] border border-[#E5E5E5] mx-auto flex items-center justify-center text-[#D4AF37] mb-3">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-800">{t.noDataFound}</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {searchTerm 
              ? (language === 'fa' ? 'هیچ سفارشی با این مشخصات یافت نشد. جستجوی دیگری را امتحان کنید.' : 'No orders matched your search criteria.') 
              : (language === 'fa' ? 'هنوز فرمایشی ثبت نشده است.' : 'No orders registered yet.')}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {language === 'fa' ? 'پاک کردن فیلترها' : 'Clear search'}
            </button>
          ) : (
            <button
              onClick={onNewOrder}
              className="mt-4 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] text-xs font-black rounded-xl transition cursor-pointer"
            >
              {t.newOrder}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-[#F9F7F2] border-b border-[#E5E5E5] text-[11px] font-bold text-[#706E6B] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t.orderNumber}</th>
                  <th className="py-3.5 px-4">{t.customerName} & {t.contactNumber}</th>
                  <th className="py-3.5 px-4">{t.garmentType}</th>
                  <th className="py-3.5 px-4">{t.deliveryDate}</th>
                  <th className="py-3.5 px-4">{t.status}</th>
                  <th className="py-3.5 px-4">{t.totalAmount} / {t.paidAmount} / {t.balanceRemaining}</th>
                  <th className="py-3.5 px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map(order => {
                  const isPaid = order.balanceAmount === 0;

                  return (
                    <tr key={order.id} className="hover:bg-[#F9F7F2]/60 transition">
                      {/* Order Number & Cabinet */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-[#1A1A1A] text-sm">
                          #{order.orderNumber}
                        </div>
                        {order.cabinetSlot && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md font-mono text-[10px] font-semibold border border-stone-200">
                            {order.cabinetSlot}
                          </span>
                        )}
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(order.customerId)}
                          className="font-bold text-stone-900 hover:text-[#B39025] hover:underline text-left block truncate max-w-[170px]"
                        >
                          {order.customerName}
                        </button>
                        <span className="font-mono text-stone-500 text-[11px] block mt-0.5">
                          {order.customerPhone}
                        </span>
                      </td>

                      {/* Garment & Quantity */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-stone-800">{order.garmentType}</span>
                        <span className="text-[11px] text-stone-500 block font-mono">
                          {order.quantity || 1} {language === 'fa' ? 'دست' : 'pair'}
                        </span>
                      </td>

                      {/* Delivery Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{order.deliveryDate}</span>
                        </div>
                      </td>

                      {/* Status Dropdown / Pill */}
                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          onChange={e => handleUpdateStatus(order, e.target.value as OrderStatus)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border outline-hidden transition cursor-pointer ${
                            order.status === 'ready'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : order.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : order.status === 'delivered'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          <option value="pending">{t.statusPending}</option>
                          <option value="in_progress">{t.statusInProgress}</option>
                          <option value="ready">{t.statusReady}</option>
                          <option value="delivered">{t.statusDelivered}</option>
                        </select>
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs">
                          <span className="font-bold text-stone-900">{order.totalAmount}</span>
                          <span className="text-stone-400 mx-1">/</span>
                          <span className="text-emerald-700 font-semibold">{order.paidAmount}</span>
                          <span className="text-stone-400 mx-1">/</span>
                          <span className={`font-black ${order.balanceAmount > 0 ? 'text-rose-600' : 'text-stone-500'}`}>
                            {order.balanceAmount}
                          </span>
                          <span className="text-[10px] text-stone-500 ml-1">{currencySymbol}</span>
                        </div>
                        <span className={`inline-block mt-0.5 text-[10px] font-bold ${
                          isPaid ? 'text-emerald-600' : 'text-amber-700'
                        }`}>
                          {isPaid ? t.paid : `${t.balanceRemaining}: ${order.balanceAmount} ${currencySymbol}`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          {/* Print / View Slip */}
                          <button
                            onClick={() => onViewReceipt(order)}
                            className="p-1.5 text-stone-700 hover:text-[#B39025] hover:bg-[#F9F7F2] rounded-lg transition cursor-pointer"
                            title={t.print}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Quick Payment Update */}
                          <button
                            onClick={() => {
                              setPaymentModalOrder(order);
                              setNewPaidInput(order.paidAmount);
                            }}
                            className="p-1.5 text-stone-700 hover:text-emerald-600 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                            title={t.updatePayment}
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditOrder(order)}
                            className="p-1.5 text-stone-700 hover:text-blue-600 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                            title={t.edit}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={t.delete}
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
        </div>
      )}

      {/* Quick Payment Modal */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-bold text-sm text-stone-900">
                {t.updatePayment} - #{paymentModalOrder.orderNumber}
              </h3>
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F9F7F2] rounded-xl space-y-1 border border-[#E5E5E5]">
                <div className="flex justify-between text-stone-600">
                  <span>{t.customerName}:</span>
                  <b className="text-stone-900">{paymentModalOrder.customerName}</b>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>{t.totalAmount}:</span>
                  <b className="font-mono text-stone-900">{paymentModalOrder.totalAmount} {currencySymbol}</b>
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
                  className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl font-mono text-base font-black text-emerald-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#F9F7F2] rounded-lg border border-[#E5E5E5]">
                <span className="font-semibold text-stone-600">{t.balanceRemaining}:</span>
                <span className="font-mono font-black text-rose-600">
                  {Math.max(0, paymentModalOrder.totalAmount - newPaidInput)} {currencySymbol}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSavePaymentUpdate}
                className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#B39025] text-[#1A1A1A] text-xs font-black rounded-lg"
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
