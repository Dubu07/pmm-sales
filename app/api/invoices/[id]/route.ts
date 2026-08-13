import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPaymentStatus } from "@/lib/constants";
import { isValidYmd } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: { invoiceType: true, items: { orderBy: { sortOrder: "asc" } }, customer: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);
    const body = await request.json();
    const invoiceDate = String(body.invoiceDate ?? "");
    const paymentStatus = body.paymentStatus;
    const terms = String(body.terms ?? "").trim();
    const note = String(body.note ?? "").trim() || null;
    const profitCents = parseMoneyToCents(body.profit, "Profit");
    const discountCents = parseMoneyToCents(body.discount ?? "0", "Discount");
    if (!isValidYmd(invoiceDate)) throw new Error("A valid invoice date is required.");
    if (!isPaymentStatus(paymentStatus)) throw new Error("A valid payment status is required.");
    if (!terms) throw new Error("Terms are required.");
    if (discountCents < 0) throw new Error("Discount cannot be negative.");

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) throw new Error("Add at least one invoice item.");
    const items = rawItems.map((item: any, index: number) => {
      const description = String(item.description ?? "").trim();
      const quantity = Number(item.quantity);
      const unitPriceCents = parseMoneyToCents(item.unitPrice, `Item ${index + 1} unit price`);
      if (!description) throw new Error(`Item ${index + 1} description is required.`);
      if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Item ${index + 1} quantity must be a positive whole number.`);
      if (unitPriceCents < 0) throw new Error(`Item ${index + 1} unit price cannot be negative.`);
      return { description, quantity, unitPriceCents, lineTotalCents: quantity * unitPriceCents, sortOrder: index };
    });
    const subtotalCents = items.reduce((sum: number, item: { lineTotalCents: number }) => sum + item.lineTotalCents, 0);
    if (discountCents > subtotalCents) throw new Error("Discount cannot exceed the subtotal.");
    const totalCents = subtotalCents - discountCents;

    const updated = await prisma.$transaction(async (tx) => {
      const exists = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!exists) throw new Error("Invoice not found.");
      await tx.invoiceItem.deleteMany({ where: { invoiceId } });
      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceDate,
          subtotalCents,
          discountCents,
          totalCents,
          profitCents,
          paymentStatus,
          terms,
          note,
          items: { create: items },
        },
        include: { items: { orderBy: { sortOrder: "asc" } }, invoiceType: true },
      });
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update invoice." }, { status: 400 });
  }
}
