import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { PageHeader, Card, buttonPrimary, inputClass } from "@/components/ui";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;

export default async function SalesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const from = one(params.from) || "";
  const to = one(params.to) || "";
  const q = one(params.q)?.trim() || "";
  const status = one(params.status) || "";
  const invoices = await prisma.invoice.findMany({
    where: {
      ...(from || to ? { invoiceDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      ...(status ? { paymentStatus: status } : {}),
      ...(q ? { OR: [{ invoiceNumber: { contains: q } }, { customerNameSnapshot: { contains: q } }] } : {}),
    },
    include: { invoiceType: true, _count: { select: { items: true } } },
    orderBy: [{ invoiceDate: "desc" }, { id: "desc" }],
  });
  return (
    <>
      <PageHeader title="Sales Records" description="Search invoices, open sale details, edit records or regenerate invoice PDFs." actions={<Link href="/new-sale" className={buttonPrimary}>+ New Sale</Link>} />
      <Card className="mb-5">
        <form className="grid gap-3 md:grid-cols-5">
          <input className={inputClass} name="q" defaultValue={q} placeholder="Invoice or customer" />
          <input className={inputClass} type="date" name="from" defaultValue={from} />
          <input className={inputClass} type="date" name="to" defaultValue={to} />
          <select className={inputClass} name="status" defaultValue={status}><option value="">All statuses</option>{PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4 text-center">Items</th><th className="py-2 pr-4 text-right">Total</th><th className="py-2 pr-4 text-right">Profit</th><th className="py-2 pr-4">Status</th><th className="py-2">Actions</th></tr></thead>
            <tbody>{invoices.length ? invoices.map((invoice) => <tr key={invoice.id} className={`border-b border-slate-100 last:border-0 ${invoice.paymentStatus === "Cancelled" ? "bg-slate-50 text-slate-500" : ""}`}><td className="py-3 pr-4">{invoice.invoiceDate}</td><td className="py-3 pr-4 font-semibold">{invoice.invoiceNumber}</td><td className="py-3 pr-4">{invoice.customerNameSnapshot}</td><td className="py-3 pr-4 text-center">{invoice._count.items}</td><td className="py-3 pr-4 text-right">{formatMoney(invoice.totalCents)}</td><td className="py-3 pr-4 text-right">{formatMoney(invoice.profitCents)}</td><td className="py-3 pr-4">{invoice.paymentStatus}</td><td className="py-3"><div className="flex flex-wrap gap-2"><Link className="font-medium text-slate-700 hover:underline" href={`/sales/${invoice.id}`}>View</Link><Link className="font-medium text-slate-700 hover:underline" href={`/sales/${invoice.id}/invoice`}>Invoice</Link></div></td></tr>) : <tr><td colSpan={8} className="py-10 text-center text-slate-500">No sales records match the filters.</td></tr>}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
