import { getDb } from "@/lib/prisma";

export async function getCompanySettings() {
  return getDb().companySettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: "Premium 88 Machine Enterprise",
      tin: "D 60658890060",
      bankName: "Alliance Bank",
      bankAccount: "070390013037129",
      defaultTerms: "Payment received",
      defaultInvoiceTitle: "Sales Invoice",
      logoPath: "/company-logo.png",
    },
  });
}
