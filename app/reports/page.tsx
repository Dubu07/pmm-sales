import { prisma } from "@/lib/prisma";
import { currentMonthRange, isValidYmd } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { PageHeader, Card, buttonPrimary, inputClass } from "@/components/ui";

export const dynamic = "force-dynamic";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const month = currentMonthRange();
  const fromParam = one(params.from) || month.from;
  const toParam = one(params.to) || month.to;
  const from = isValidYmd(fromParam) ? fromParam : month.from;
  const to = isValidYmd(toParam) && toParam >= from ? toParam : month.to;
  const invoices = await prisma.invoice.findMany({ where: { invoiceDate: { gte: from, lte: to } }, include: { invoiceType: true, _count: { select: { items: true } } }, orderBy: [{ invoiceDate: "asc" }, { id: "asc" }] });
  const active = invoices.filter((i) => i.paymentStatus !== "Cancelled");
  const sales = active.reduce((s, i) => s + i.totalCents, 0);
  const profit = active.reduce((s, i) => s + i.profitCents, 0);
  const margin = sales === 0 ? 0 : (profit / sales) * 100;
  return <>
    <PageHeader title="Reports" description="Date-range sales and profit reporting. Cancelled invoices remain visible but are excluded from totals." actions={<a className={buttonPrimary} href={`/api/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}>Export Excel</a>} />
    <Card className="mb-5"><form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input className={inputClass} type="date" name="from" defaultValue={from} required /><input className={inputClass} type="date" name="to" defaultValue={to} required /><button className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white">Generate</button></form></Card>
    <div className="grid gap-4 md:grid-cols-4"><Card><div className="text-sm text-slate-500">Total Sales</div><div className="mt-2 text-xl font-semibold">{formatMoney(sales)}</div></Card><Card><div className="text-sm text-slate-500">Total Profit</div><div className="mt-2 text-xl font-semibold">{formatMoney(profit)}</div></Card><Card><div className="text-sm text-slate-500">Profit Margin</div><div className="mt-2 text-xl font-semibold">{margin.toFixed(2)}%</div></Card><Card><div className="text-sm text-slate-500">Active Invoices</div><div className="mt-2 text-xl font-semibold">{active.length}</div></Card></div>
    <Card className="mt-5"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4 text-center">Items</th><th className="py-2 pr-4 text-right">Sales</th><th className="py-2 pr-4 text-right">Profit</th><th className="py-2">Status</th></tr></thead><tbody>{invoices.length ? invoices.map((invoice) => <tr key={invoice.id} className={`border-b border-slate-100 last:border-0 ${invoice.paymentStatus === "Cancelled" ? "bg-slate-50 text-slate-500" : ""}`}><td className="py-3 pr-4">{invoice.invoiceDate}</td><td className="py-3 pr-4 font-semibold">{invoice.invoiceNumber}</td><td className="py-3 pr-4">{invoice.customerNameSnapshot}</td><td className="py-3 pr-4 text-center">{invoice._count.items}</td><td className="py-3 pr-4 text-right">{formatMoney(invoice.totalCents)}</td><td className="py-3 pr-4 text-right">{formatMoney(invoice.profitCents)}</td><td className="py-3">{invoice.paymentStatus}</td></tr>) : <tr><td colSpan={7} className="py-10 text-center text-slate-500">No invoices in this date range.</td></tr>}</tbody></table></div></Card>
  </>;
}
