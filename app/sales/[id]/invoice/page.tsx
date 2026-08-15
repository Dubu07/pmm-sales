import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";
import { displayDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { buttonPrimary, buttonSecondary } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, company] = await Promise.all([
    getDb().invoice.findUnique({ where: { id: Number(id) }, include: { invoiceType: true, items: { orderBy: { sortOrder: "asc" } } } }),
    getCompanySettings(),
  ]);
  if (!invoice) notFound();
  const title = invoice.invoiceType.documentTitle || company.defaultInvoiceTitle;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3"><Link href={`/sales/${invoice.id}`} className={buttonSecondary}>← Sale Details</Link><div className="flex gap-2"><PrintButton /><a href={`/api/invoices/${invoice.id}/pdf`} className={buttonPrimary}>Download PDF</a></div></div>
      <article className="min-h-[1050px] bg-white p-8 shadow-sm print:min-h-0 print:p-0 print:shadow-none sm:p-12">
        <header className="flex items-start justify-between gap-8 border-b-2 border-amber-700 pb-7">
          <div><img src={company.logoPath} alt={company.companyName} className="h-24 w-auto object-contain" /></div>
          <div className="text-right"><h1 className="text-3xl font-bold uppercase tracking-wide text-amber-800">{title}</h1><div className="mt-5 text-sm"><div><span className="text-slate-500">Invoice No.</span> <strong className="ml-2">{invoice.invoiceNumber}</strong></div><div className="mt-1"><span className="text-slate-500">Date</span> <span className="ml-2">{displayDate(invoice.invoiceDate)}</span></div></div></div>
        </header>
        <section className="grid gap-8 border-b border-slate-200 py-7 sm:grid-cols-2">
          <div><div className="text-xs font-bold uppercase tracking-wider text-amber-800">Bill To</div><div className="mt-3 text-base font-semibold">{invoice.customerNameSnapshot}</div><div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{invoice.customerAddressSnapshot}</div><div className="mt-3 text-sm text-slate-600">Contact: {invoice.contactPersonSnapshot || "-"}</div><div className="text-sm text-slate-600">Phone: {invoice.phoneSnapshot || "-"}</div></div>
          <div className="sm:text-right"><div className="text-xs font-bold uppercase tracking-wider text-amber-800">From</div><div className="mt-3 font-semibold">{company.companyName}</div><div className="mt-2 text-sm text-slate-600">TIN: {company.tin}</div></div>
        </section>
        <section className="py-7">
          <table className="w-full text-sm"><thead><tr className="bg-slate-900 text-left text-white"><th className="px-3 py-3">Description</th><th className="px-3 py-3 text-right">Qty</th><th className="px-3 py-3 text-right">Unit Price</th><th className="px-3 py-3 text-right">Amount</th></tr></thead><tbody>{invoice.items.map((item) => <tr key={item.id} className="border-b border-slate-200"><td className="px-3 py-4">{item.description}</td><td className="px-3 py-4 text-right">{item.quantity}</td><td className="px-3 py-4 text-right">{formatMoney(item.unitPriceCents)}</td><td className="px-3 py-4 text-right font-medium">{formatMoney(item.lineTotalCents)}</td></tr>)}</tbody></table>
          <div className="ml-auto mt-6 max-w-sm space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatMoney(invoice.subtotalCents)}</span></div><div className="flex justify-between"><span className="text-slate-500">Discount</span><span>{formatMoney(invoice.discountCents)}</span></div><div className="flex justify-between border-t border-slate-300 pt-3 text-lg font-bold"><span>Total</span><span className="text-amber-800">{formatMoney(invoice.totalCents)}</span></div></div>
        </section>
        <section className="mt-4 border-t border-slate-200 pt-6 text-sm leading-6"><div className="text-xs font-bold uppercase tracking-wider text-amber-800">Payment & Terms</div><p className="mt-2"><strong>Terms:</strong> {invoice.terms}</p><p>Please bank in to: {company.companyName}</p><p>{company.bankName} account {company.bankAccount}</p>{invoice.note ? <><div className="mt-5 text-xs font-bold uppercase tracking-wider text-amber-800">Note</div><p className="mt-1 whitespace-pre-line">{invoice.note}</p></> : null}</section>
      </article>
    </div>
  );
}
