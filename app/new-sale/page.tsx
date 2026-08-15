import { getDb } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";
import { PageHeader } from "@/components/ui";
import { NewInvoiceForm } from "@/components/NewInvoiceForm";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const [invoiceTypes, customers, company] = await Promise.all([
    getDb().invoiceType.findMany({ where: { isActive: true }, orderBy: { id: "asc" }, select: { id: true, name: true, prefix: true, nextNumber: true, padding: true, documentTitle: true } }),
    getDb().customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, address: true, contactPerson: true, phone: true } }),
    getCompanySettings(),
  ]);
  return <><PageHeader title="New Sale" description="Create a sale, save customer details and generate a customer invoice." /><NewInvoiceForm invoiceTypes={invoiceTypes} customers={customers} defaultTerms={company.defaultTerms} /></>;
}
