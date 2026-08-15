import Link from "next/link";
import { getDb } from "@/lib/prisma";
import { PageHeader, Card, buttonPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getDb().customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { _count: { select: { invoices: true } } } });
  return <><PageHeader title="Customers" description="Saved customer details are reused during sale entry. Historical invoices retain their original customer snapshot." actions={<Link className={buttonPrimary} href="/new-sale">New Sale / Customer</Link>} /><Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Contact</th><th className="py-2 pr-4">Phone</th><th className="py-2 pr-4">Address</th><th className="py-2 pr-4 text-center">Invoices</th><th className="py-2">Action</th></tr></thead><tbody>{customers.length ? customers.map((c) => <tr key={c.id} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-4 font-medium">{c.name}</td><td className="py-3 pr-4">{c.contactPerson || "-"}</td><td className="py-3 pr-4">{c.phone || "-"}</td><td className="max-w-sm py-3 pr-4 text-slate-600">{c.address}</td><td className="py-3 pr-4 text-center">{c._count.invoices}</td><td className="py-3"><Link href={`/customers/${c.id}`} className="font-medium text-slate-700 hover:underline">Edit</Link></td></tr>) : <tr><td colSpan={6} className="py-10 text-center text-slate-500">No saved customers yet. New customers entered in New Sale will appear here.</td></tr>}</tbody></table></div></Card></>;
}
