import React, { useMemo, useRef, useState } from 'react';
import { CreditCard, Printer, Search, X } from 'lucide-react';
import { Language, Order, ShopSettings } from '../types';
import { storageService } from '../services/storage';
import { printReceiptElement } from '../services/printService';
import { textIncludes } from '../lib/search';

interface GroupPaymentModalProps {
  orders: Order[];
  shopSettings: ShopSettings;
  language: Language;
  onClose: () => void;
  onSaved: () => void;
}

type Allocation = { order: Order; amount: number; previousPaid: number; updated: Order };

export const GroupPaymentModal: React.FC<GroupPaymentModalProps> = ({
  orders, shopSettings, language, onClose, onSaved,
}) => {
  const [search, setSearch] = useState('');
  const [payerName, setPayerName] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [receiptRows, setReceiptRows] = useState<Allocation[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const currency = language === 'ps'
    ? shopSettings.currencyPs || 'افغانۍ'
    : language === 'fa'
      ? shopSettings.currencyFa || 'افغانی'
      : shopSettings.currencySymbol || shopSettings.currencyEn || 'AFN';
  const shopName = language === 'ps'
    ? shopSettings.shopNamePs || shopSettings.shopNameEn
    : language === 'fa'
      ? shopSettings.shopNameFa || shopSettings.shopNameEn
      : shopSettings.shopNameEn;

  const availableOrders = useMemo(() => orders.filter(order => {
    if (Number(order.balanceAmount) <= 0) return false;
    const q = search.trim();
    return !q || textIncludes(order.orderNumber, q) || textIncludes(order.customerName, q) || textIncludes(order.customerPhone, q);
  }), [orders, search]);

  const selectedOrders = orders.filter(order => selected[order.id]);
  const allocatedTotal = selectedOrders.reduce((sum, order) => sum + (Number(amounts[order.id]) || 0), 0);

  const savePayments = async () => {
    setError('');
    if (selectedOrders.length < 2) {
      setError(language === 'fa' ? 'حداقل دو فرمایش را انتخاب کنید.' : 'Select at least two orders.');
      return;
    }
    const invalid = selectedOrders.find(order => {
      const amount = Number(amounts[order.id]) || 0;
      return amount <= 0 || amount > Number(order.balanceAmount);
    });
    if (invalid) {
      setError(language === 'fa' ? `مبلغ پرداخت برای فرمایش ${invalid.orderNumber} درست نیست.` : `Enter a valid payment for order ${invalid.orderNumber}.`);
      return;
    }

    const rows: Allocation[] = selectedOrders.map(order => {
      const amount = Number(amounts[order.id]) || 0;
      const previousPaid = Number(order.paidAmount) || 0;
      const paidAmount = previousPaid + amount;
      const balanceAmount = Math.max(0, Number(order.totalAmount) - paidAmount);
      return {
        order,
        amount,
        previousPaid,
        updated: {
          ...order,
          paidAmount,
          balanceAmount,
          paymentStatus: balanceAmount === 0 ? 'paid' : 'partial',
          updatedAt: new Date().toISOString(),
        },
      };
    });

    try {
      setSaving(true);
      await storageService.saveOrderPaymentsAsync(rows.map(row => row.updated));
      setReceiptRows(rows);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  const printReceipt = async () => {
    if (!receiptRef.current) return;
    await printReceiptElement(receiptRef.current, {
      title: `Group Payment ${new Date().toISOString().slice(0, 10)}`,
      pageFormat: shopSettings.receiptFormat || 'a5',
      dir: language === 'en' ? 'ltr' : 'rtl',
    });
  };

  const receiptTotal = receiptRows?.reduce((sum, row) => sum + Number(row.updated.totalAmount), 0) || 0;
  const receiptPrevious = receiptRows?.reduce((sum, row) => sum + row.previousPaid, 0) || 0;
  const receiptPayment = receiptRows?.reduce((sum, row) => sum + row.amount, 0) || 0;
  const receiptBalance = receiptRows?.reduce((sum, row) => sum + Number(row.updated.balanceAmount), 0) || 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3 no-print">
          <h2 className="flex items-center gap-2 text-sm font-black text-stone-900">
            <CreditCard className="h-4 w-4 text-amber-600" />
            {receiptRows ? (language === 'fa' ? 'رسید پرداخت گروهی' : 'Combined Payment Receipt') : (language === 'fa' ? 'پرداخت چند فرمایش' : 'Group Payment')}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200"><X className="h-4 w-4" /></button>
        </div>

        {receiptRows ? (
          <>
            <div className="overflow-y-auto bg-stone-100 p-3 sm:p-5">
              <div ref={receiptRef} className="mx-auto max-w-2xl border-2 border-stone-900 bg-white p-5 text-xs text-stone-950">
                <div className="border-b-2 border-stone-900 pb-3 text-center">
                  <h1 className="text-lg font-black">{shopName}</h1>
                  <p className="mt-1 font-bold">{language === 'fa' ? 'رسید پرداخت چند فرمایش' : 'Combined Order Payment Receipt'}</p>
                  <p className="mt-1 text-[11px]">{new Date().toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-b border-stone-400 py-3">
                  <div><span className="text-stone-500">{language === 'fa' ? 'پرداخت کننده:' : 'Paid by:'}</span> <strong>{payerName || '-'}</strong></div>
                  <div><span className="text-stone-500">{language === 'fa' ? 'تعداد فرمایش:' : 'Orders:'}</span> <strong>{receiptRows.length}</strong></div>
                </div>
                <table className="my-3 w-full border-collapse text-[11px]">
                  <thead><tr className="border-y border-stone-900 bg-stone-100"><th className="p-2 text-start">#</th><th className="p-2 text-start">{language === 'fa' ? 'مشتری' : 'Customer'}</th><th className="p-2 text-end">{language === 'fa' ? 'این پرداخت' : 'This payment'}</th><th className="p-2 text-end">{language === 'fa' ? 'باقی' : 'Balance'}</th></tr></thead>
                  <tbody>{receiptRows.map(row => <tr key={row.order.id} className="border-b border-stone-300"><td className="p-2 font-mono font-bold">{row.order.orderNumber}</td><td className="p-2">{row.order.customerName}</td><td className="p-2 text-end font-mono font-bold">{row.amount} {currency}</td><td className="p-2 text-end font-mono">{row.updated.balanceAmount} {currency}</td></tr>)}</tbody>
                </table>
                <div className="ms-auto w-full max-w-xs space-y-1.5 border-t-2 border-stone-900 pt-3">
                  <div className="flex justify-between"><span>{language === 'fa' ? 'مجموع بل‌ها' : 'Combined total'}</span><strong>{receiptTotal} {currency}</strong></div>
                  <div className="flex justify-between"><span>{language === 'fa' ? 'پرداخت قبلی' : 'Previously paid'}</span><strong>{receiptPrevious} {currency}</strong></div>
                  <div className="flex justify-between text-emerald-800"><span>{language === 'fa' ? 'پرداخت امروز' : 'Payment received'}</span><strong>{receiptPayment} {currency}</strong></div>
                  <div className="flex justify-between text-rose-700"><span>{language === 'fa' ? 'مجموع باقیات' : 'Remaining balance'}</span><strong>{receiptBalance} {currency}</strong></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-200 p-3 no-print">
              <button type="button" onClick={onClose} className="rounded-xl bg-stone-100 px-4 py-2 text-xs font-bold">{language === 'fa' ? 'بستن' : 'Close'}</button>
              <button type="button" onClick={printReceipt} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-stone-950"><Printer className="h-4 w-4" />{language === 'fa' ? 'چاپ رسید' : 'Print Receipt'}</button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 overflow-y-auto p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={payerName} onChange={event => setPayerName(event.target.value)} placeholder={language === 'fa' ? 'نام پرداخت کننده' : 'Payer name'} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500" />
                <div className="relative"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={language === 'fa' ? 'جستجوی نام، شماره یا بل' : 'Search name, phone, or order'} className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pe-3 ps-9 text-xs outline-none focus:border-amber-500" /></div>
              </div>
              {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
              <div className="space-y-2">
                {availableOrders.map(order => {
                  const isSelected = !!selected[order.id];
                  return <div key={order.id} className={`grid items-center gap-3 rounded-xl border p-3 sm:grid-cols-[auto_1fr_150px] ${isSelected ? 'border-amber-400 bg-amber-50' : 'border-stone-200'}`}>
                    <input type="checkbox" checked={isSelected} onChange={event => setSelected(current => ({ ...current, [order.id]: event.target.checked }))} className="h-4 w-4 accent-amber-600" />
                    <div><div className="font-bold text-stone-900">{order.customerName} <span className="font-mono text-stone-500">#{order.orderNumber}</span></div><div className="mt-0.5 text-[11px] text-stone-500">{order.customerPhone} · {language === 'fa' ? 'باقی' : 'Balance'}: <strong className="text-rose-600">{order.balanceAmount} {currency}</strong></div></div>
                    <input type="number" min="0" max={order.balanceAmount} disabled={!isSelected} value={amounts[order.id] || ''} onChange={event => setAmounts(current => ({ ...current, [order.id]: Number(event.target.value) }))} placeholder={language === 'fa' ? 'مبلغ پرداخت' : 'Payment amount'} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-end font-mono text-xs font-bold disabled:bg-stone-100" />
                  </div>;
                })}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 p-3">
              <div className="text-xs">{language === 'fa' ? 'مجموع پرداخت:' : 'Payment total:'} <strong className="font-mono text-emerald-700">{allocatedTotal} {currency}</strong></div>
              <div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-xl bg-stone-200 px-4 py-2 text-xs font-bold">{language === 'fa' ? 'لغو' : 'Cancel'}</button><button type="button" disabled={saving} onClick={savePayments} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-stone-950 disabled:opacity-50">{saving ? (language === 'fa' ? 'در حال ذخیره...' : 'Saving...') : (language === 'fa' ? 'ذخیره و ساخت رسید' : 'Save & Create Receipt')}</button></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
