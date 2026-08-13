import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { CustomerEditor } from "@/components/CustomerEditor";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const customer = await prisma.customer.findUnique({ where: { id: Number(id) } }); if (!customer) notFound();
  return <><PageHeader title={customer.name} description="Edit the customer master record. Existing invoice snapshots will not be changed." /><CustomerEditor customer={customer} /></>;
}
