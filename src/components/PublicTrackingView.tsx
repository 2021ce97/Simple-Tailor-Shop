import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Scissors, Search, Shirt, XCircle } from 'lucide-react';

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
  const [clothId, setClothId] = useState('');
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = clothId.trim();
    if (!id) return;

    setError('');
    setOrder(null);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/public/orders/${encodeURIComponent(id)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Order not found');
      setOrder(data);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Order not found');
    } finally {
      setIsLoading(false);
    }
  };

  const meta = order ? statusMeta[order.status] || statusMeta.pending : null;
  const StatusIcon = meta?.icon || Shirt;

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1c2421] px-4 py-6 sm:py-10">
      <main className="mx-auto max-w-2xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-[#1c2421]">
          <ArrowLeft className="h-4 w-4" /> Staff login
        </a>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl shadow-stone-900/5">
          <div className="bg-[#173b3b] px-6 py-10 text-white sm:px-10">
            <div className="flex items-center gap-3 text-[#e4bd63]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4bd63] text-[#173b3b]"><Scissors className="h-6 w-6 -rotate-45" /></div>
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Mujeeb Afghan Tailor Shop</span>
            </div>
            <h1 className="mt-8 max-w-lg text-3xl font-black tracking-tight sm:text-5xl">Check your cloth progress.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-teal-50/80">Enter the Cloth ID from your receipt to see the latest production status. This page shows only your order progress.</p>
          </div>

          <div className="p-6 sm:p-10">
            <form onSubmit={handleSearch} className="space-y-3">
              <label htmlFor="cloth-id" className="text-xs font-bold uppercase tracking-wider text-stone-500">Cloth ID</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input id="cloth-id" value={clothId} onChange={event => setClothId(event.target.value)} placeholder="e.g. 16308" className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 font-mono text-base outline-none transition focus:border-[#173b3b] focus:ring-2 focus:ring-[#173b3b]/15" />
                <button type="submit" disabled={isLoading || !clothId.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e4bd63] px-5 py-3 font-black text-[#173b3b] transition hover:bg-[#d6aa45] disabled:cursor-not-allowed disabled:opacity-50">
                  <Search className="h-4 w-4" /> {isLoading ? 'Checking...' : 'Check status'}
                </button>
              </div>
            </form>

            {error && <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"><XCircle className="h-5 w-5 shrink-0" /> {error}</div>}

            {order && meta && (
              <div className="mt-8 border-t border-stone-200 pt-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Cloth ID</p>
                    <p className="mt-1 font-mono text-2xl font-black">{order.orderNumber}</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-black ${meta.color}`}><StatusIcon className="h-4 w-4" /> {meta.label}</div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Garment</p><p className="mt-1 font-bold">{order.garmentType}</p></div>
                  <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Quantity</p><p className="mt-1 font-bold">{order.quantity}</p></div>
                  <div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Expected collection</p><p className="mt-1 font-bold">{order.deliveryDate || 'To be confirmed'}</p></div>
                </div>
                <div className="mt-4 rounded-xl border border-stone-200 p-4 text-sm leading-6 text-stone-600">{meta.description}</div>
              </div>
            )}
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-stone-500">Char Rahi Buth Khak · چهار راهی بتخاک، کابل افغانستان · 0749592404<br />Developed by Rayan Tech Solutions · rayan-tech-solution.tech</footer>
      </main>
    </div>
  );
};
