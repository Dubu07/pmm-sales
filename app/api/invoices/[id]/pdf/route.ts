import { NextResponse } from "next/server";
import { getAssetsBinding, getDb } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";
import { generateInvoicePdf } from "@/lib/invoicePdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getDb().invoice.findUnique({
    where: { id: Number(id) },
    include: { invoiceType: true, items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

  const company = await getCompanySettings();
  let logoBytes: Uint8Array | null = null;
  try {
    const assetUrl = new URL(company.logoPath || "/company-logo.png", request.url);
    const logoResponse = await getAssetsBinding().fetch(assetUrl);
    if (logoResponse.ok) logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
  } catch {
    logoBytes = null;
  }

  const bytes = await generateInvoicePdf(
    {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      documentTitle: invoice.invoiceType.documentTitle || company.defaultInvoiceTitle,
      customerName: invoice.customerNameSnapshot,
      customerAddress: invoice.customerAddressSnapshot,
      contactPerson: invoice.contactPersonSnapshot,
      phone: invoice.phoneSnapshot,
      subtotalCents: invoice.subtotalCents,
      discountCents: invoice.discountCents,
      totalCents: invoice.totalCents,
      terms: invoice.terms,
      note: invoice.note,
      items: invoice.items,
    },
    company,
    logoBytes,
  );

  const safeName = invoice.invoiceNumber.replace(/[^A-Za-z0-9_-]/g, "_");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
