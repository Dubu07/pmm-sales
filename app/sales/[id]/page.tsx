import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { PageHeader, Card, buttonPrimary, buttonSecondary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getDb().invoice.findUnique({ where: { id: Number(id) }, include: { invoiceType: true, items: { orderBy: { sortOrder: "asc" } }, customer: true } });
  if (!invoice) notFound();
  return (
    <>
      <PageHeader title={invoice.invoiceNumber} description={`${invoice.invoiceType.name} - ${invoice.invoiceDate}`} actions={<><Link href={`/sales/${invoice.id}/invoice`} className={buttonPrimary}>Customer Invoice</Link><Link href={`/sales/${invoice.id}/edit`} className={buttonSecondary}>Edit Sale</Link></>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-semibold">Customer snapshot</h2>
          <div className="mt-3 text-sm"><div className="font-semibold">{invoice.customerNameSnapshot}</div><div className="mt-1 whitespace-pre-line text-slate-600">{invoice.customerAddressSnapshot}</div><div className="mt-3 text-slate-600">Contact: {invoice.contactPersonSnapshot || "-"}</div><div className="text-slate-600">Phone: {invoice.phoneSnapshot || "-"}</div></div>
          <p className="mt-3 text-xs text-slate-500">This invoice stores the customer details that existed when it was created. Editing the customer master record does not rewrite historical invoices.</p>
        </Card>
        <Card><h2 className="font-semibold">Internal details</h2><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Payment</dt><dd className="font-medium">{invoice.paymentStatus}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Profit</dt><dd className="font-semibold">{formatMoney(invoice.profitCents)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Created</dt><dd>{invoice.createdAt.toLocaleString()}</dd></div></dl></Card>
      </div>
      <Card className="mt-5">
        <h2 className="mb-4 font-semibold">Invoice items</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Description</th><th className="py-2 pr-4 text-right">Qty</th><th className="py-2 pr-4 text-right">Unit Price</th><th className="py-2 text-right">Total</th></tr></thead><tbody>{invoice.items.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-4">{item.description}</td><td className="py-3 pr-4 text-right">{item.quantity}</td><td className="py-3 pr-4 text-right">{formatMoney(item.unitPriceCents)}</td><td className="py-3 text-right font-medium">{formatMoney(item.lineTotalCents)}</td></tr>)}</tbody></table></div>
        <div className="ml-auto mt-5 max-w-sm space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatMoney(invoice.subtotalCents)}</span></div><div className="flex justify-between"><span className="text-slate-500">Discount</span><span>{formatMoney(invoice.discountCents)}</span></div><div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Total</span><span>{formatMoney(invoice.totalCents)}</span></div></div>
      </Card>
      <Card className="mt-5"><h2 className="font-semibold">Terms & note</h2><div className="mt-3 text-sm"><div><span className="font-medium">Terms:</span> {invoice.terms}</div><div className="mt-2"><span className="font-medium">Note:</span> {invoice.note || "-"}</div></div></Card>
    </>
  );
}
