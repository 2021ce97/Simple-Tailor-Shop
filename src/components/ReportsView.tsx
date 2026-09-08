import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, CheckCircle2, Clock3, Download, Package, Printer, Scissors, TrendingUp, Users } from 'lucide-react';
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

const dateKey = (value?: string) => (value || '').slice(0, 10);
const number = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, products, fabrics, productSales, shopSettings, language }) => {
  const [period, setPeriod] = useState<Period>('daily');
  const currency = language === 'ps' ? shopSettings.currencyPs : language === 'fa' ? shopSettings.currencyFa : shopSettings.currencyEn;
  const money = (value: number) => `${number(value)} ${currency}`;

  const range = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    if (period === 'daily') start.setHours(0, 0, 0, 0);
    if (period === 'weekly') {
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      start.setHours(0, 0, 0, 0);
    }
    if (period === 'monthly') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    return { start, end };
  }, [period]);

  const report = useMemo(() => {
    const inRange = (value?: string) => {
      const date = new Date(value || '');
      return !Number.isNaN(date.getTime()) && date >= range.start && date <= range.end;
    };
    const periodOrders = orders.filter(order => inRange(order.orderDate || order.createdAt));
    const periodSales = productSales.filter(sale => inRange(sale.saleDate || sale.createdAt));
    const orderBilled = periodOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
    const orderCollected = periodOrders.reduce((sum, order) => sum + (Number(order.paidAmount) || 0), 0);
    const orderBalance = periodOrders.reduce((sum, order) => sum + (Number(order.balanceAmount) || 0), 0);
    const productRevenue = periodSales.reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
    const productCost = periodSales.reduce((sum, sale) => sum + (Number(sale.purchasePrice) || 0) * (Number(sale.quantity) || 0), 0);
    const productProfit = periodSales.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0);
    const countByStatus = (status: Order['status']) => periodOrders.filter(order => order.status === status).length;
    const countByPayment = (status: Order['paymentStatus']) => periodOrders.filter(order => order.paymentStatus === status).length;
    const aggregate = (values: Array<[string, number]>) => Object.entries(values.reduce<Record<string, number>>((result, [label, value]) => {
      result[label] = (result[label] || 0) + value;
      return result;
    }, {})).sort(([, first], [, second]) => second - first).slice(0, 5);
    const garments = aggregate(periodOrders.map(order => [order.garmentType || 'Other', Number(order.quantity) || 0]));
    const productsSold = aggregate(periodSales.map(sale => [sale.productName || 'Other', Number(sale.quantity) || 0]));
    return {
      periodOrders,
      periodSales,
      orderBilled,
      orderCollected,
      orderBalance,
      productRevenue,
      productCost,
      productProfit,
      activeCustomers: new Set(periodOrders.map(order => order.customerId).filter(Boolean)).size,
      statusCounts: { pending: countByStatus('pending'), in_progress: countByStatus('in_progress'), ready: countByStatus('ready'), delivered: countByStatus('delivered') },
      paymentCounts: { paid: countByPayment('paid'), partial: countByPayment('partial'), unpaid: countByPayment('unpaid') },
      garments,
      productsSold,
    };
  }, [orders, productSales, range]);

  const lowStockProducts = products.filter(product => product.stockQuantity <= (product.lowStockThreshold ?? 5));
  const lowStockFabrics = fabrics.filter(fabric => fabric.stockMeters <= 15);
  const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This week' : 'This month';

  const downloadCsv = () => {
    const rows: unknown[][] = [
      ['Report period', periodLabel], ['From', dateKey(range.start.toISOString())], ['To', dateKey(range.end.toISOString())], [],
      ['Metric', 'Value'], ['Tailoring orders', report.periodOrders.length], ['Tailoring billed', report.orderBilled], ['Tailoring collected', report.orderCollected],
      ['Tailoring outstanding', report.orderBalance], ['Retail sales', report.periodSales.length], ['Retail revenue', report.productRevenue], ['Retail cost', report.productCost],
      ['Retail profit', report.productProfit], ['Active customers', report.activeCustomers], [],
      ['Order ID', 'Customer', 'Contact', 'Garment', 'Status', 'Payment status', 'Total', 'Paid', 'Balance', 'Order date'],
      ...report.periodOrders.map(order => [order.orderNumber, order.customerName, order.customerPhone, order.garmentType, order.status, order.paymentStatus, order.totalAmount, order.paidAmount, order.balanceAmount, order.orderDate]),
    ];
    const blob = new Blob([rows.map(row => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `tailor-report-${period}-${dateKey(range.start.toISOString())}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const statusLabels = { pending: 'Received', in_progress: 'In production', ready: 'Ready', delivered: 'Collected' };
  const statusColors = { pending: 'bg-amber-400', in_progress: 'bg-blue-500', ready: 'bg-emerald-500', delivered: 'bg-stone-500' };
  const cards = [
    ['Collected revenue', money(report.orderCollected + report.productRevenue), `${report.periodOrders.length} orders · ${report.periodSales.length} retail sales`, Scissors, 'text-[#9c6b16] bg-amber-50 border-amber-200'],
    ['Outstanding balance', money(report.orderBalance), `${report.paymentCounts.partial} partial · ${report.paymentCounts.unpaid} unpaid`, Clock3, 'text-rose-700 bg-rose-50 border-rose-200'],
    ['Retail profit', money(report.productProfit), `${money(report.productRevenue)} revenue less ${money(report.productCost)} cost`, TrendingUp, 'text-emerald-700 bg-emerald-50 border-emerald-200'],
    ['Active customers', number(report.activeCustomers), `${report.periodOrders.reduce((sum, order) => sum + (Number(order.quantity) || 0), 0)} garments ordered`, Users, 'text-blue-700 bg-blue-50 border-blue-200'],
  ] as const;

  return <div className="space-y-6 pb-12 animate-in fade-in duration-200 print:bg-white">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173b3b] text-[#e4bd63]"><BarChart3 className="h-5 w-5" /></div><div><h1 className="text-xl font-black text-[#1a1a1a]">Reports</h1><p className="text-xs text-stone-500">Financial, order, customer, sales, and inventory performance.</p></div></div>
      <div className="flex flex-wrap items-center gap-2 no-print"><div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">{(['daily', 'weekly', 'monthly'] as Period[]).map(option => <button key={option} type="button" onClick={() => setPeriod(option)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${period === option ? 'bg-[#173b3b] text-white' : 'text-stone-600 hover:bg-white'}`}><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{option}</button>)}</div><button type="button" onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"><Download className="h-4 w-4" /> Export CSV</button><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#173b3b] px-3 py-2 text-xs font-bold text-white hover:bg-[#245454]"><Printer className="h-4 w-4" /> Print</button></div>
    </div>
    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-600">{periodLabel}: {dateKey(range.start.toISOString())} to {dateKey(range.end.toISOString())}</div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, detail, Icon, tone]) => <div key={label} className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-xs"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</p><p className="mt-2 text-xl font-black text-[#1a1a1a]">{value}</p><p className="mt-1 text-xs text-stone-500">{detail}</p></div><div className={`rounded-xl border p-2 ${tone}`}><Icon className="h-5 w-5" /></div></div></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs"><h2 className="flex items-center gap-2 text-sm font-black"><BarChart3 className="h-4 w-4 text-[#9c6b16]" /> Order status</h2><div className="mt-5 space-y-4">{(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map(status => { const count = report.statusCounts[status]; const percentage = report.periodOrders.length ? count / report.periodOrders.length * 100 : 0; return <div key={status}><div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-stone-600">{statusLabels[status]}</span><span className="font-mono font-bold">{count} ({Math.round(percentage)}%)</span></div><div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className={`h-full rounded-full ${statusColors[status]}`} style={{ width: `${percentage}%` }} /></div></div>; })}</div></section>
      <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs"><h2 className="flex items-center gap-2 text-sm font-black"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> Financial summary</h2><div className="mt-4 divide-y divide-stone-100 text-sm">{[['Tailoring billed', money(report.orderBilled)], ['Tailoring collected', money(report.orderCollected)], ['Tailoring outstanding', money(report.orderBalance)], ['Retail revenue', money(report.productRevenue)], ['Retail cost', money(report.productCost)], ['Retail profit', money(report.productProfit)]].map(([label, value]) => <div key={label} className="flex justify-between py-2.5"><span className="text-stone-600">{label}</span><span className="font-mono font-bold">{value}</span></div>)}</div></section>
    </div>
    <div className="grid gap-6 lg:grid-cols-3"><section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs"><h2 className="text-sm font-black">Payment collection</h2><div className="mt-4 space-y-3">{Object.entries(report.paymentCounts).map(([status, count]) => <div key={status} className="flex justify-between rounded-xl bg-stone-50 p-3 text-xs"><span className="capitalize text-stone-600">{status}</span><span className="font-mono font-black">{count}</span></div>)}</div></section><section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs"><h2 className="flex items-center gap-2 text-sm font-black"><Scissors className="h-4 w-4 text-[#9c6b16]" /> Top garments</h2><div className="mt-4 space-y-3">{report.garments.length ? report.garments.map(([name, quantity]) => <div key={name} className="flex justify-between text-xs"><span className="truncate pr-3 font-semibold">{name}</span><span className="font-mono font-black">{quantity}</span></div>) : <p className="text-xs text-stone-500">No orders in this period.</p>}</div></section><section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs"><h2 className="flex items-center gap-2 text-sm font-black"><Package className="h-4 w-4 text-emerald-700" /> Top products</h2><div className="mt-4 space-y-3">{report.productsSold.length ? report.productsSold.map(([name, quantity]) => <div key={name} className="flex justify-between text-xs"><span className="truncate pr-3 font-semibold">{name}</span><span className="font-mono font-black">{quantity}</span></div>) : <p className="text-xs text-stone-500">No product sales in this period.</p>}</div></section></div>
    <section className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-xs"><h2 className="flex items-center gap-2 text-sm font-black"><Package className="h-4 w-4 text-rose-700" /> Inventory alerts</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{[...lowStockProducts.map(product => `${product.name} · ${product.stockQuantity} units`), ...lowStockFabrics.map(fabric => `${fabric.name} · ${fabric.stockMeters} m`)].slice(0, 10).map(item => <div key={item} className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{item}</div>)}{lowStockProducts.length + lowStockFabrics.length === 0 && <p className="text-xs text-stone-500">No low-stock items right now.</p>}</div></section>
  </div>;
};
