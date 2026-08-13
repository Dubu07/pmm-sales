import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildInvoiceNumber } from "@/lib/invoiceNumber";
import { isPaymentStatus } from "@/lib/constants";
import { isValidYmd } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q")?.trim() || undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(from || to ? { invoiceDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      ...(status ? { paymentStatus: status } : {}),
      ...(q ? { OR: [{ invoiceNumber: { contains: q } }, { customerNameSnapshot: { contains: q } }] } : {}),
    },
    include: { invoiceType: true, items: true },
    orderBy: [{ invoiceDate: "desc" }, { id: "desc" }],
  });
  return NextResponse.json(invoices);
}

type CreateItemInput = { description?: unknown; quantity?: unknown; unitPrice?: unknown };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const invoiceTypeId = Number(body.invoiceTypeId);
    const invoiceDate = String(body.invoiceDate ?? "");
    const paymentStatus = body.paymentStatus;
    const terms = String(body.terms ?? "").trim();
    const note = String(body.note ?? "").trim() || null;
    const profitCents = parseMoneyToCents(body.profit, "Profit");
    const discountCents = parseMoneyToCents(body.discount ?? "0", "Discount");

    if (!Number.isInteger(invoiceTypeId) || invoiceTypeId < 1) throw new Error("Invoice type is required.");
    if (!isValidYmd(invoiceDate)) throw new Error("A valid invoice date is required.");
    if (!isPaymentStatus(paymentStatus)) throw new Error("A valid payment status is required.");
    if (!terms) throw new Error("Terms are required.");
    if (discountCents < 0) throw new Error("Discount cannot be negative.");

    const rawItems: CreateItemInput[] = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) throw new Error("Add at least one invoice item.");
    const items = rawItems.map((item, index) => {
      const description = String(item.description ?? "").trim();
      const quantity = Number(item.quantity);
      const unitPriceCents = parseMoneyToCents(item.unitPrice, `Item ${index + 1} unit price`);
      if (!description) throw new Error(`Item ${index + 1} description is required.`);
      if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Item ${index + 1} quantity must be a positive whole number.`);
      if (unitPriceCents < 0) throw new Error(`Item ${index + 1} unit price cannot be negative.`);
      const lineTotalCents = quantity * unitPriceCents;
      if (!Number.isSafeInteger(lineTotalCents)) throw new Error(`Item ${index + 1} total is too large.`);
      return { description, quantity, unitPriceCents, lineTotalCents, sortOrder: index };
    });
    const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    if (discountCents > subtotalCents) throw new Error("Discount cannot exceed the subtotal.");
    const totalCents = subtotalCents - discountCents;

    const customerMode = String(body.customerMode ?? "existing");
    const created = await prisma.$transaction(async (tx) => {
      const invoiceType = await tx.invoiceType.findUnique({ where: { id: invoiceTypeId } });
      if (!invoiceType || !invoiceType.isActive) throw new Error("Selected invoice type is unavailable.");

      let customer;
      if (customerMode === "new") {
        const name = String(body.newCustomer?.name ?? "").trim();
        const address = String(body.newCustomer?.address ?? "").trim();
        const contactPerson = String(body.newCustomer?.contactPerson ?? "").trim() || null;
        const phone = String(body.newCustomer?.phone ?? "").trim() || null;
        if (!name) throw new Error("New customer name is required.");
        if (!address) throw new Error("New customer address is required.");
        customer = await tx.customer.create({ data: { name, address, contactPerson, phone } });
      } else {
        const customerId = Number(body.customerId);
        if (!Number.isInteger(customerId) || customerId < 1) throw new Error("Select an existing customer.");
        customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (!customer || !customer.isActive) throw new Error("Selected customer is unavailable.");
      }

      const invoiceNumber = buildInvoiceNumber(invoiceType.prefix, invoiceType.nextNumber, invoiceType.padding);
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          invoiceDate,
          invoiceTypeId,
          customerId: customer.id,
          customerNameSnapshot: customer.name,
          customerAddressSnapshot: customer.address,
          contactPersonSnapshot: customer.contactPerson,
          phoneSnapshot: customer.phone,
          subtotalCents,
          discountCents,
          totalCents,
          profitCents,
          paymentStatus,
          terms,
          note,
          items: { create: items },
        },
        include: { invoiceType: true, items: true },
      });
      await tx.invoiceType.update({ where: { id: invoiceTypeId }, data: { nextNumber: { increment: 1 } } });
      return invoice;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create invoice." }, { status: 400 });
  }
}
