import { NextResponse } from "next/server";
import { getCompanySettings } from "@/lib/company";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json(await getCompanySettings());
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const companyName = String(body.companyName ?? "").trim();
    const tin = String(body.tin ?? "").trim();
    const bankName = String(body.bankName ?? "").trim();
    const bankAccount = String(body.bankAccount ?? "").trim();
    const defaultTerms = String(body.defaultTerms ?? "").trim();
    const defaultInvoiceTitle = String(body.defaultInvoiceTitle ?? "").trim();
    if (!companyName || !tin || !bankName || !bankAccount || !defaultTerms || !defaultInvoiceTitle) {
      throw new Error("All company settings fields are required.");
    }
    const settings = await prisma.companySettings.upsert({
      where: { id: 1 },
      update: { companyName, tin, bankName, bankAccount, defaultTerms, defaultInvoiceTitle },
      create: { id: 1, companyName, tin, bankName, bankAccount, defaultTerms, defaultInvoiceTitle, logoPath: "/company-logo.png" },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save company settings." }, { status: 400 });
  }
}
