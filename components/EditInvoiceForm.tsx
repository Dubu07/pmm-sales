"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { buttonDanger, buttonPrimary, buttonSecondary, inputClass, labelClass } from "@/components/ui";

type Line = { description: string; quantity: string; unitPrice: string };
type Props = {
  invoice: {
    id: number;
    invoiceNumber: string;
    invoiceDate: string;
    customerNameSnapshot: string;
    paymentStatus: string;
    terms: string;
    note: string | null;
    discount: string;
    profit: string;
    items: Line[];
  };
};
const num = (v: string) => Number.isFinite(Number(v)) ? Number(v) : 0;
const rm = (v: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(v);

export function EditInvoiceForm({ invoice }: Props) {
  const router = useRouter();
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoiceDate);
  const [items, setItems] = useState<Line[]>(invoice.items);
  const [discount, setDiscount] = useState(invoice.discount);
  const [profit, setProfit] = useState(invoice.profit);
  const [paymentStatus, setPaymentStatus] = useState(invoice.paymentStatus);
  const [terms, setTerms] = useState(invoice.terms);
  const [note, setNote] = useState(invoice.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const subtotal = useMemo(() => items.reduce((s, i) => s + Math.max(0, Math.trunc(num(i.quantity))) * Math.max(0, num(i.unitPrice)), 0), [items]);
  const total = Math.max(0, subtotal - Math.max(0, num(discount)));
  const update = (index: number, patch: Partial<Line>) => setItems((all) => all.map((item, i) => i === index ? { ...item, ...patch } : item));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceDate, items, discount, profit, paymentStatus, terms, note }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update invoice.");
      router.push(`/sales/${invoice.id}`); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update invoice."); setSaving(false); }
  }

  return <form onSubmit={submit} className="space-y-6">
    {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-3"><div><span className={labelClass}>Invoice Number</span><div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold">{invoice.invoiceNumber}</div></div><div><span className={labelClass}>Customer</span><div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">{invoice.customerNameSnapshot}</div></div><label><span className={labelClass}>Invoice Date</span><input className={inputClass} type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required /></label></div><p className="mt-3 text-xs text-slate-500">Invoice number, invoice type and historical customer snapshot are locked after creation.</p></section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex justify-between"><h2 className="font-semibold">Invoice Items</h2><button className={buttonSecondary} type="button" onClick={() => setItems((a) => [...a, { description: "", quantity: "1", unitPrice: "0.00" }])}>+ Add Item</button></div><div className="space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_100px_150px_150px_auto] md:items-end"><label><span className={labelClass}>Description</span><input className={inputClass} value={item.description} onChange={(e) => update(index, { description: e.target.value })} required /></label><label><span className={labelClass}>Qty</span><input className={inputClass} type="number" min="1" step="1" value={item.quantity} onChange={(e) => update(index, { quantity: e.target.value })} required /></label><label><span className={labelClass}>Unit Price (RM)</span><input className={inputClass} value={item.unitPrice} onChange={(e) => update(index, { unitPrice: e.target.value })} required /></label><div><span className={labelClass}>Line Total</span><div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold">{rm(Math.max(0, Math.trunc(num(item.quantity))) * Math.max(0, num(item.unitPrice)))}</div></div><button type="button" className={buttonDanger} onClick={() => setItems((a) => a.filter((_, i) => i !== index))} disabled={items.length === 1}>Remove</button></div>)}</div><div className="ml-auto mt-5 max-w-sm space-y-3 rounded-lg bg-slate-50 p-4"><div className="flex justify-between text-sm"><span>Subtotal</span><strong>{rm(subtotal)}</strong></div><label><span className={labelClass}>Discount (RM)</span><input className={inputClass} value={discount} onChange={(e) => setDiscount(e.target.value)} /></label><div className="flex justify-between border-t border-slate-200 pt-3 font-semibold"><span>Total</span><strong>{rm(total)}</strong></div></div></section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><label><span className={labelClass}>Profit (Internal Only)</span><input className={inputClass} value={profit} onChange={(e) => setProfit(e.target.value)} required /></label><label><span className={labelClass}>Payment Status</span><select className={inputClass} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>{PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label><label className="md:col-span-2"><span className={labelClass}>Terms</span><input className={inputClass} value={terms} onChange={(e) => setTerms(e.target.value)} required /></label><label className="md:col-span-2"><span className={labelClass}>Note</span><textarea className={`${inputClass} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} /></label></div></section>
    <div className="flex justify-end"><button className={buttonPrimary} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div>
  </form>;
}
