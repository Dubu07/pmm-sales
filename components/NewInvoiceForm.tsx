"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { buttonDanger, buttonPrimary, buttonSecondary, inputClass, labelClass } from "@/components/ui";

type InvoiceTypeOption = { id: number; name: string; prefix: string; nextNumber: number; padding: number; documentTitle: string };
type CustomerOption = { id: number; name: string; address: string; contactPerson: string | null; phone: string | null };
type Line = { description: string; quantity: string; unitPrice: string };

function n(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function rm(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

export function NewInvoiceForm({ invoiceTypes, customers, defaultTerms }: { invoiceTypes: InvoiceTypeOption[]; customers: CustomerOption[]; defaultTerms: string }) {
  const router = useRouter();
  const [invoiceTypeId, setInvoiceTypeId] = useState(String(invoiceTypes[0]?.id ?? ""));
  const [invoiceDate, setInvoiceDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(customers.length ? "existing" : "new");
  const [customerId, setCustomerId] = useState(String(customers[0]?.id ?? ""));
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", address: "", contactPerson: "", phone: "" });
  const [items, setItems] = useState<Line[]>([{ description: "", quantity: "1", unitPrice: "0.00" }]);
  const [discount, setDiscount] = useState("0.00");
  const [profit, setProfit] = useState("0.00");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [terms, setTerms] = useState(defaultTerms || "Payment received");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.contactPerson || "", c.phone || ""].some((v) => v.toLowerCase().includes(q));
  });
  const selectedType = invoiceTypes.find((type) => String(type.id) === invoiceTypeId);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Math.max(0, Math.trunc(n(item.quantity))) * Math.max(0, n(item.unitPrice)), 0), [items]);
  const total = Math.max(0, subtotal - Math.max(0, n(discount)));

  function updateItem(index: number, patch: Partial<Line>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceTypeId,
          invoiceDate,
          customerMode,
          customerId: customerMode === "existing" ? customerId : undefined,
          newCustomer: customerMode === "new" ? newCustomer : undefined,
          items,
          discount,
          profit,
          paymentStatus,
          terms,
          note,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save invoice.");
      router.push(`/sales/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save invoice.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Invoice</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <label><span className={labelClass}>Invoice Type</span><select className={inputClass} value={invoiceTypeId} onChange={(e) => setInvoiceTypeId(e.target.value)} required>{invoiceTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
          <label><span className={labelClass}>Invoice Date</span><input className={inputClass} type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required /></label>
          <div><span className={labelClass}>Invoice Number</span><div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">Assigned when saved {selectedType ? `(next: ${selectedType.prefix}${String(selectedType.nextNumber).padStart(selectedType.padding, "0")})` : ""}</div></div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Customer</h2>
          <div className="flex rounded-lg border border-slate-300 p-1 text-sm">
            <button type="button" onClick={() => setCustomerMode("existing")} className={`rounded-md px-3 py-1.5 font-medium ${customerMode === "existing" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Existing</button>
            <button type="button" onClick={() => setCustomerMode("new")} className={`rounded-md px-3 py-1.5 font-medium ${customerMode === "new" ? "bg-slate-900 text-white" : "text-slate-600"}`}>New</button>
          </div>
        </div>
        {customerMode === "existing" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <label><span className={labelClass}>Search saved customers</span><input className={inputClass} value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Name, contact person or phone" /></label>
              <label><span className={labelClass}>Customer</span><select className={inputClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>{filteredCustomers.length ? filteredCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>) : <option value="">No matching customer</option>}</select></label>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              {selectedCustomer ? <><div className="font-semibold text-slate-900">{selectedCustomer.name}</div><div className="mt-2 whitespace-pre-line text-slate-600">{selectedCustomer.address}</div><div className="mt-3 grid gap-1 text-slate-600"><div><span className="font-medium text-slate-700">Contact:</span> {selectedCustomer.contactPerson || "-"}</div><div><span className="font-medium text-slate-700">Phone:</span> {selectedCustomer.phone || "-"}</div></div></> : <span className="text-slate-500">Select a customer to load their saved details.</span>}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className={labelClass}>Customer Name *</span><input className={inputClass} value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} required /></label>
            <label><span className={labelClass}>Contact Person</span><input className={inputClass} value={newCustomer.contactPerson} onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })} /></label>
            <label className="md:col-span-2"><span className={labelClass}>Address *</span><textarea className={`${inputClass} min-h-24`} value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} required /></label>
            <label><span className={labelClass}>Phone Number</span><input className={inputClass} value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></label>
            <div className="flex items-end text-sm text-slate-500">The new customer will be saved automatically for future invoices.</div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Invoice Items</h2><button type="button" className={buttonSecondary} onClick={() => setItems((current) => [...current, { description: "", quantity: "1", unitPrice: "0.00" }])}>+ Add Item</button></div>
        <div className="space-y-3">
          {items.map((item, index) => {
            const lineTotal = Math.max(0, Math.trunc(n(item.quantity))) * Math.max(0, n(item.unitPrice));
            return <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[minmax(220px,1fr)_110px_150px_150px_auto] md:items-end">
              <label><span className={labelClass}>Description</span><input className={inputClass} value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder="e.g. Soundbar M6p" required /></label>
              <label><span className={labelClass}>Qty</span><input className={inputClass} type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} required /></label>
              <label><span className={labelClass}>Unit Price (RM)</span><input className={inputClass} inputMode="decimal" value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: e.target.value })} required /></label>
              <div><span className={labelClass}>Line Total</span><div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold">{rm(lineTotal)}</div></div>
              <button type="button" className={buttonDanger} onClick={() => setItems((current) => current.filter((_, i) => i !== index))} disabled={items.length === 1}>Remove</button>
            </div>;
          })}
        </div>
        <div className="mt-5 ml-auto max-w-sm space-y-3 rounded-lg bg-slate-50 p-4">
          <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><strong>{rm(subtotal)}</strong></div>
          <label><span className={labelClass}>Discount (RM)</span><input className={inputClass} inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
          <div className="border-t border-slate-200 pt-3 flex justify-between"><span className="font-semibold">Invoice Total</span><strong className="text-lg">{rm(total)}</strong></div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Internal & Payment Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className={labelClass}>Profit (Internal Only)</span><input className={inputClass} inputMode="decimal" value={profit} onChange={(e) => setProfit(e.target.value)} required /><span className="mt-1 block text-xs text-slate-500">Profit is stored for reporting and is not shown on the customer invoice.</span></label>
          <label><span className={labelClass}>Payment Status</span><select className={inputClass} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>{PAYMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="md:col-span-2"><span className={labelClass}>Terms</span><input className={inputClass} value={terms} onChange={(e) => setTerms(e.target.value)} required /></label>
          <label className="md:col-span-2"><span className={labelClass}>Note</span><textarea className={`${inputClass} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. FOC 1 unit" /></label>
        </div>
      </section>

      <div className="flex justify-end"><button className={buttonPrimary} type="submit" disabled={saving}>{saving ? "Saving..." : "Save Sale & Generate Invoice"}</button></div>
    </form>
  );
}
