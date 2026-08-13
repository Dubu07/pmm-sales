import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentMonthRange, todayYmd } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Card, PageHeader, buttonPrimary, buttonSecondary } from "@/components/ui";

export const dynamic = "force-dynamic";

async function totals(from: string, to: string) {
  const invoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: from, lte: to }, paymentStatus: { not: "Cancelled" } },
    select: { totalCents: true, profitCents: true },
  });
  return {
    sales: invoices.reduce((s, i) => s + i.totalCents, 0),
    profit: invoices.reduce((s, i) => s + i.profitCents, 0),
    count: invoices.length,
  };
}

export default async function DashboardPage() {
  const today = todayYmd();
  const month = currentMonthRange();
  const [todayStats, monthStats, recent] = await Promise.all([
    totals(today, today),
    totals(month.from, month.to),
    prisma.invoice.findMany({ include: { invoiceType: true }, orderBy: { id: "desc" }, take: 6 }),
  ]);
  return (
    <>
      <PageHeader title="Dashboard" description="Local sales and invoice overview." actions={<><Link className={buttonSecondary} href="/reports">Reports</Link><Link className={buttonPrimary} href="/new-sale">+ New Sale</Link></>} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><div className="text-sm text-slate-500">Today Sales</div><div className="mt-2 text-2xl font-semibold">{formatMoney(todayStats.sales)}</div><div className="mt-1 text-xs text-slate-500">{todayStats.count} active invoice(s)</div></Card>
        <Card><div className="text-sm text-slate-500">Today Profit</div><div className="mt-2 text-2xl font-semibold">{formatMoney(todayStats.profit)}</div><div className="mt-1 text-xs text-slate-500">Internal reporting figure</div></Card>
        <Card><div className="text-sm text-slate-500">This Month Sales</div><div className="mt-2 text-2xl font-semibold">{formatMoney(monthStats.sales)}</div><div className="mt-1 text-xs text-slate-500">Profit {formatMoney(monthStats.profit)}</div></Card>
      </div>
      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent Invoices</h2><Link href="/sales" className="text-sm font-medium text-slate-600 hover:text-slate-950">View all</Link></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4 text-right">Total</th><th className="py-2">Status</th></tr></thead><tbody>
            {recent.length ? recent.map((invoice) => <tr key={invoice.id} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-4"><Link className="font-semibold hover:underline" href={`/sales/${invoice.id}`}>{invoice.invoiceNumber}</Link></td><td className="py-3 pr-4">{invoice.invoiceDate}</td><td className="py-3 pr-4">{invoice.customerNameSnapshot}</td><td className="py-3 pr-4 text-right">{formatMoney(invoice.totalCents)}</td><td className="py-3">{invoice.paymentStatus}</td></tr>) : <tr><td colSpan={5} className="py-8 text-center text-slate-500">No invoices yet. Create the first sale.</td></tr>}
          </tbody></table>
        </div>
      </Card>
    </>
  );
}
