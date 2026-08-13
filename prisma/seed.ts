import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaults = [
    { name: "Normal Invoice", prefix: "INV", nextNumber: 1, padding: 4, documentTitle: "Sales Invoice" },
    { name: "Consignment", prefix: "CS", nextNumber: 1, padding: 4, documentTitle: "Consignment Invoice" },
    { name: "Replacement", prefix: "RP", nextNumber: 1, padding: 4, documentTitle: "Replacement Invoice" },
  ];

  for (const item of defaults) {
    await prisma.invoiceType.upsert({
      where: { prefix: item.prefix },
      update: {},
      create: item,
    });
  }

  await prisma.companySettings.upsert({
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

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
