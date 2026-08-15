import { NextResponse } from "next/server";
import { getD1, getDb } from "@/lib/prisma";
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

  const invoices = await getDb().invoice.findMany({
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

    const prisma = getDb();
    const invoiceType = await prisma.invoiceType.findUnique({ where: { id: invoiceTypeId } });
    if (!invoiceType || !invoiceType.isActive) throw new Error("Selected invoice type is unavailable.");

    const customerMode = String(body.customerMode ?? "existing");
    let customerId: number | null = null;
    let customerName: string;
    let customerAddress: string;
    let contactPerson: string | null;
    let phone: string | null;

    if (customerMode === "new") {
      customerName = String(body.newCustomer?.name ?? "").trim();
      customerAddress = String(body.newCustomer?.address ?? "").trim();
      contactPerson = String(body.newCustomer?.contactPerson ?? "").trim() || null;
      phone = String(body.newCustomer?.phone ?? "").trim() || null;
      if (!customerName) throw new Error("New customer name is required.");
      if (!customerAddress) throw new Error("New customer address is required.");
    } else {
      customerId = Number(body.customerId);
      if (!Number.isInteger(customerId) || customerId < 1) throw new Error("Select an existing customer.");
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer || !customer.isActive) throw new Error("Selected customer is unavailable.");
      customerName = customer.name;
      customerAddress = customer.address;
      contactPerson = customer.contactPerson;
      phone = customer.phone;
    }

    const invoiceNumber = buildInvoiceNumber(invoiceType.prefix, invoiceType.nextNumber, invoiceType.padding);
    const db = getD1();
    const statements: any[] = [];

    if (customerMode === "new") {
      statements.push(
        db.prepare('INSERT INTO "Customer" ("name", "address", "contactPerson", "phone", "isActive", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
          .bind(customerName, customerAddress, contactPerson, phone),
      );
    }

    const customerIdSql = customerMode === "new" ? "last_insert_rowid()" : "?";
    const invoiceSql = `INSERT INTO "Invoice" (
      "invoiceNumber", "invoiceDate", "invoiceTypeId", "customerId",
      "customerNameSnapshot", "customerAddressSnapshot", "contactPersonSnapshot", "phoneSnapshot",
      "subtotalCents", "discountCents", "totalCents", "profitCents", "paymentStatus", "terms", "note",
      "createdAt", "updatedAt"
    ) VALUES (?, ?, ?, ${customerIdSql}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

    const invoiceArgs = [
      invoiceNumber,
      invoiceDate,
      invoiceTypeId,
      ...(customerMode === "new" ? [] : [customerId]),
      customerName,
      customerAddress,
      contactPerson,
      phone,
      subtotalCents,
      discountCents,
      totalCents,
      profitCents,
      paymentStatus,
      terms,
      note,
    ];
    statements.push(db.prepare(invoiceSql).bind(...invoiceArgs));

    for (const item of items) {
      statements.push(
        db.prepare('INSERT INTO "InvoiceItem" ("invoiceId", "description", "quantity", "unitPriceCents", "lineTotalCents", "sortOrder") VALUES ((SELECT "id" FROM "Invoice" WHERE "invoiceNumber" = ?), ?, ?, ?, ?, ?)')
          .bind(invoiceNumber, item.description, item.quantity, item.unitPriceCents, item.lineTotalCents, item.sortOrder),
      );
    }

    statements.push(
      db.prepare('UPDATE "InvoiceType" SET "nextNumber" = "nextNumber" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ? AND "nextNumber" = ?')
        .bind(invoiceTypeId, invoiceType.nextNumber),
    );

    // D1 batch() is atomic: if any statement fails, the complete batch is rolled back.
    await db.batch(statements);

    const created = await getDb().invoice.findUnique({
      where: { invoiceNumber },
      include: { invoiceType: true, items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!created) throw new Error("Invoice was saved but could not be reloaded.");
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create invoice." }, { status: 400 });
  }
}
