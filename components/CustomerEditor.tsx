"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonPrimary, inputClass, labelClass } from "@/components/ui";

export function CustomerEditor({ customer }: { customer: { id: number; name: string; address: string; contactPerson: string | null; phone: string | null } }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: customer.name, address: customer.address, contactPerson: customer.contactPerson || "", phone: customer.phone || "" });
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); setMessage(""); const res = await fetch(`/api/customers/${customer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await res.json(); if (!res.ok) { setMessage(data.error || "Unable to save customer."); setSaving(false); return; } setMessage("Customer updated. Existing invoices keep their original customer snapshot."); setSaving(false); router.refresh(); }
  return <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{message ? <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div> : null}<label><span className={labelClass}>Customer Name</span><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label><span className={labelClass}>Address</span><textarea className={`${inputClass} min-h-28`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></label><div className="grid gap-4 md:grid-cols-2"><label><span className={labelClass}>Contact Person</span><input className={inputClass} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></label><label><span className={labelClass}>Phone</span><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label></div><button className={buttonPrimary} disabled={saving}>{saving ? "Saving..." : "Save Customer"}</button></form>;
}
