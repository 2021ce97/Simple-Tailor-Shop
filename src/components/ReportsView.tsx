import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, CheckCircle2, Clock3, Package, Scissors, TrendingUp } from 'lucide-react';
import { Fabric, Language, Order, Product, ProductSale, ShopSettings } from '../types';

interface ReportsViewProps {
  orders: Order[];
  products: Product[];
  fabrics: Fabric[];
  productSales: ProductSale[];
  shopSettings: ShopSettings;
  language: Language;
}

type Period = 'daily' | 'weekly' | 'monthly';

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, products, fabrics, productSales, shopSettings, language }) => {
  const [period, setPeriod] = useState<Period>('daily');
  const currency = language === 'ps' ? shopSettings.currencyPs : language === 'fa' ? shopSettings.currencyFa : shopSettings.currencyEn;
  const periodStart = useMemo(() => {
    const now = new Date();
    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    now.setDate(now.getDate() - days + 1);
    now.setHours(0, 0, 0, 0);
    return now;
  }, [period]);
  const recentOrders = orders.filter(order => new Date(order.orderDate).getTime() >= periodStart.getTime());
  const recentSales = productSales.filter(sale => new Date(sale.saleDate).getTime() >= periodStart.getTime());
  const orderRevenue = recentOrders.reduce((total, order) => total + Number(order.totalAmount || 0), 0);
  const productRevenue = recentSales.reduce((total, sale) => total + Number(sale.totalAmount || 0), 0);
  const delivered = recentOrders.filter(order => order.status === 'delivered').length;
  const inProduction = orders.filter(order => order.status === 'in_progress').length;
  const lowStockProducts = products.filter(product => product.stockQuantity <= (product.lowStockThreshold ?? 5)).length;
  const lowStockFabrics = fabrics.filter(fabric => fabric.stockMeters <= 15).length;

  const cards = [
    { label: 'Tailoring revenue', value: `${orderRevenue.toLocaleString()} ${currency}`, detail: `${recentOrders.length} clothes`, icon: Scissors, tone: 'text-[#9c6b16] bg-amber-50 border-amber-200' },
    { label: 'Product revenue', value: `${productRevenue.toLocaleString()} ${currency}`, detail: `${recentSales.length} sales`, icon: TrendingUp, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: 'Completed orders', value: delivered.toLocaleString(), detail: `${inProduction} in production`, icon: CheckCircle2, tone: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: 'Stock alerts', value: (lowStockProducts + lowStockFabrics).toLocaleString(), detail: `${lowStockProducts} products · ${lowStockFabrics} fabrics`, icon: Package, tone: 'text-rose-700 bg-rose-50 border-rose-200' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173b3b] text-[#e4bd63]"><BarChart3 className="h-5 w-5" /></div><div><h1 className="text-xl font-black text-[#1a1a1a]">Reports</h1><p className="text-xs text-stone-500">Clothes, products, revenue, fulfilment, and inventory health.</p></div></div>
        <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
          {(['daily', 'weekly', 'monthly'] as Period[]).map(option => <button key={option} type="button" onClick={() => setPeriod(option)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${period === option ? 'bg-[#173b3b] text-white' : 'text-stone-600 hover:bg-white'}`}><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{option}</button>)}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => { const Icon = card.icon; return <div key={card.label} className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-xs"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{card.label}</p><p className="mt-2 text-xl font-black text-[#1a1a1a]">{card.value}</p><p className="mt-1 text-xs text-stone-500">{card.detail}</p></div><div className={`rounded-xl border p-2 ${card.tone}`}><Icon className="h-5 w-5" /></div></div></div>; })}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs"><h2 className="flex items-center gap-2 text-sm font-black"><Clock3 className="h-4 w-4 text-[#9c6b16]" /> Current tailoring workload</h2><div className="mt-5 space-y-3">{(['pending', 'in_progress', 'ready', 'delivered'] as const).map(status => { const count = orders.filter(order => order.status === status).length; const labels = { pending: 'Received', in_progress: 'Cutting / stitching', ready: 'Ready for collection', delivered: 'Collected' }; return <div key={status} className="flex items-center gap-3"><span className="w-36 text-xs font-semibold text-stone-600">{labels[status]}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[#173b3b]" style={{ width: `${orders.length ? Math.max(4, count / orders.length * 100) : 0}%` }} /></div><span className="w-8 text-right font-mono text-xs font-bold">{count}</span></div>; })}</div></section>
        <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs"><h2 className="flex items-center gap-2 text-sm font-black"><Package className="h-4 w-4 text-emerald-700" /> Inventory watchlist</h2><div className="mt-5 divide-y divide-stone-100">{products.filter(product => product.stockQuantity <= (product.lowStockThreshold ?? 5)).slice(0, 4).map(product => <div key={product.id} className="flex items-center justify-between py-3 text-xs"><span className="font-semibold">{product.name}</span><span className="font-mono font-black text-rose-600">{product.stockQuantity} left</span></div>)}{fabrics.filter(fabric => fabric.stockMeters <= 15).slice(0, 4).map(fabric => <div key={fabric.id} className="flex items-center justify-between py-3 text-xs"><span className="font-semibold">{fabric.name}</span><span className="font-mono font-black text-amber-700">{fabric.stockMeters} m</span></div>)}{lowStockProducts + lowStockFabrics === 0 && <p className="py-3 text-xs text-stone-500">No stock alerts right now.</p>}</div></section>
      </div>
    </div>
  );
};
