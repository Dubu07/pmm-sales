import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { moneyInputValue } from "@/lib/money";
import { PageHeader } from "@/components/ui";
import { EditInvoiceForm } from "@/components/EditInvoiceForm";

export const dynamic = "force-dynamic";

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(id) }, include: { items: { orderBy: { sortOrder: "asc" } } } });
  if (!invoice) notFound();
  return <><PageHeader title={`Edit ${invoice.invoiceNumber}`} description="Edit financial details and line items. Customer snapshot and invoice number remain fixed." /><EditInvoiceForm invoice={{ id: invoice.id, invoiceNumber: invoice.invoiceNumber, invoiceDate: invoice.invoiceDate, customerNameSnapshot: invoice.customerNameSnapshot, paymentStatus: invoice.paymentStatus, terms: invoice.terms, note: invoice.note, discount: moneyInputValue(invoice.discountCents), profit: moneyInputValue(invoice.profitCents), items: invoice.items.map((item) => ({ description: item.description, quantity: String(item.quantity), unitPrice: moneyInputValue(item.unitPriceCents) })) }} /></>;
}
