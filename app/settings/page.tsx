import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";
import { PageHeader } from "@/components/ui";
import { SettingsPanel } from "@/components/SettingsPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [company, types] = await Promise.all([getCompanySettings(), prisma.invoiceType.findMany({ where: { isActive: true }, orderBy: { id: "asc" } })]);
  return <><PageHeader title="Settings" description="Company invoice details, numbering sequences and local database backup." /><SettingsPanel initialCompany={{ companyName: company.companyName, tin: company.tin, bankName: company.bankName, bankAccount: company.bankAccount, defaultTerms: company.defaultTerms, defaultInvoiceTitle: company.defaultInvoiceTitle, logoPath: company.logoPath }} initialTypes={types.map((t) => ({ id: t.id, name: t.name, prefix: t.prefix, nextNumber: t.nextNumber, padding: t.padding, documentTitle: t.documentTitle }))} /></>;
}
