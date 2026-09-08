import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Scissors, Search, Shirt, XCircle } from 'lucide-react';
import { Language } from '../types';

type PublicOrder = {
  orderNumber: string;
  garmentType: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered';
  orderDate: string;
  deliveryDate: string;
  completedDate?: string | null;
  deliveredDate?: string | null;
};

const statusMeta = {
  pending: { label: 'Received', description: 'Your order is registered and waiting to enter production.', icon: Clock3, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  in_progress: { label: 'In production', description: 'Your cloth is being cut or stitched by our team.', icon: Scissors, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  ready: { label: 'Ready for collection', description: 'Your cloth is ready. Please bring your order slip when collecting it.', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  delivered: { label: 'Collected', description: 'This order has been collected from Mujeeb Afghan Tailor Shop.', icon: CheckCircle2, color: 'text-stone-700 bg-stone-100 border-stone-300' },
};

export const PublicTrackingView: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [lookup, setLookup] = useState('');
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = lookup.trim();
    if (!value) return;

    setError('');
    setOrders([]);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/public/orders?lookup=${encodeURIComponent(value)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Order not found');
      setOrders(data.orders || []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Order not found');
    } finally {
      setIsLoading(false);
    }
  };

  const copy = {
    en: { staff: 'Staff login', title: 'Find your order.', description: 'Search your orders by Order ID or contact number to see the latest production status.', label: 'Order ID or contact number', placeholder: 'e.g. 16308 or 0749592404', button: 'Find order', checking: 'Searching...', clothId: 'Order ID', garment: 'Garment', quantity: 'Quantity', collection: 'Expected collection', notFound: 'No order was found for this Order ID or contact.' },
    fa: { staff: 'ورود کارمندان', title: 'سفارش خود را پیدا کنید.', description: 'برای دیدن آخرین وضعیت، سفارش‌های خود را با شماره سفارش یا شماره تماس جستجو کنید.', label: 'شماره سفارش یا تماس', placeholder: 'مثلاً 16308 یا 0749592404', button: 'پیدا کردن سفارش', checking: 'در حال جستجو...', clothId: 'شماره سفارش', garment: 'نوع لباس', quantity: 'تعداد', collection: 'تاریخ تسلیمی', notFound: 'برای این شماره سفارش یا تماس سفارشی یافت نشد.' },
    ps: { staff: 'د کارکوونکو ننوتل', title: 'خپل فرمایش پیدا کړئ.', description: 'د وروستي حالت لپاره خپل فرمایشونه د فرمایش شمېرې یا اړیکې شمېرې له لارې ولټوئ.', label: 'د فرمایش شمېره یا اړیکه', placeholder: 'لکه 16308 یا 0749592404', button: 'فرمایش پیدا کړئ', checking: 'لټون کېږي...', clothId: 'د فرمایش شمېره', garment: 'د جامو ډول', quantity: 'تعداد', collection: 'د اخیستلو نېټه', notFound: 'د دې فرمایش یا اړیکې شمېرې لپاره فرمایش ونه موندل شو.' },
  }[language];
  const isRtl = language !== 'en';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f4f1ea] text-[#1c2421] px-4 py-6 sm:py-10">
      <main className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <a href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-[#1c2421]">
            <ArrowLeft className="h-4 w-4" /> {copy.staff}
          </a>
          <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1 text-xs font-bold">
            {(['en', 'fa', 'ps'] as Language[]).map(option => <button key={option} type="button" onClick={() => setLanguage(option)} className={`rounded-lg px-2.5 py-1.5 ${language === option ? 'bg-[#173b3b] text-white' : 'text-stone-500 hover:bg-stone-100'}`}>{option === 'en' ? 'English' : option === 'fa' ? 'دری' : 'پښتو'}</button>)}
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl shadow-stone-900/5">
          <div className="bg-[#173b3b] px-6 py-10 text-white sm:px-10">
            <div className="flex items-center gap-3 text-[#e4bd63]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4bd63] text-[#173b3b]"><Scissors className="h-6 w-6 -rotate-45" /></div>
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Mujeeb Afghan Tailor Shop</span>
            </div>
            <h1 className="mt-8 max-w-lg text-3xl font-black tracking-tight sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-teal-50/80">{copy.description}</p>
          </div>

          <div className="p-6 sm:p-10">
            <form onSubmit={handleSearch} className="space-y-3">
              <label htmlFor="order-lookup" className="text-xs font-bold uppercase tracking-wider text-stone-500">{copy.label}</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input id="order-lookup" type="search" autoComplete="off" value={lookup} onChange={event => setLookup(event.target.value)} placeholder={copy.placeholder} aria-label={copy.label} className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 font-mono text-base outline-none transition focus:border-[#173b3b] focus:ring-2 focus:ring-[#173b3b]/15" />
                <button type="submit" disabled={isLoading || !lookup.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e4bd63] px-5 py-3 font-black text-[#173b3b] transition hover:bg-[#d6aa45] disabled:cursor-not-allowed disabled:opacity-50">
                  <Search className="h-4 w-4" /> {isLoading ? copy.checking : copy.button}
                </button>
              </div>
            </form>

            {error && <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><XCircle className="h-5 w-5 shrink-0" /> {error === 'No order was found for this Order ID or contact' ? copy.notFound : error}</div>}

            {orders.length > 0 && (
              <div className="mt-8 space-y-4 border-t border-stone-200 pt-8">
                {orders.map(order => {
                  const meta = statusMeta[order.status] || statusMeta.pending;
                  const StatusIcon = meta.icon || Shirt;
                  return (
              <div key={order.orderNumber} className="rounded-2xl border border-stone-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{copy.clothId}</p>
                    <p className="mt-1 font-mono text-2xl font-black">{order.orderNumber}</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black ${meta.color}`}><StatusIcon className="h-4 w-4" /> {meta.label}</div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">{copy.garment}</p><p className="mt-1 font-bold">{order.garmentType}</p></div>
                  <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">{copy.quantity}</p><p className="mt-1 font-bold">{order.quantity}</p></div>
                  <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">{copy.collection}</p><p className="mt-1 font-bold">{order.deliveryDate || 'To be confirmed'}</p></div>
                </div>
                <div className="mt-4 rounded-xl border border-stone-200 p-4 text-sm leading-6 text-stone-600">{meta.description}</div>
              </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-stone-500">Char Rahi Buth Khak · چهار راهی بتخاک، کابل افغانستان · 0749592404<br />Developed by Rayan Tech Solutions · rayan-tech-solution.tech</footer>
      </main>
    </div>
  );
};
