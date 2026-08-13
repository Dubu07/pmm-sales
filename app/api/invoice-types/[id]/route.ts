import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceTypeId = Number(id);
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const prefix = String(body.prefix ?? "").trim().toUpperCase();
    const documentTitle = String(body.documentTitle ?? "").trim();
    const nextNumber = Number(body.nextNumber);
    const padding = Number(body.padding);
    if (!name || !prefix || !documentTitle) throw new Error("Name, prefix and document title are required.");
    if (!/^[A-Z0-9-]+$/.test(prefix)) throw new Error("Prefix may contain only letters, numbers and hyphens.");
    if (!Number.isInteger(nextNumber) || nextNumber < 1) throw new Error("Next number must be at least 1.");
    if (!Number.isInteger(padding) || padding < 1 || padding > 10) throw new Error("Padding must be between 1 and 10.");
    const duplicate = await prisma.invoiceType.findFirst({ where: { prefix, id: { not: invoiceTypeId } } });
    if (duplicate) throw new Error("That invoice prefix is already in use.");
    const result = await prisma.invoiceType.update({
      where: { id: invoiceTypeId },
      data: { name, prefix, documentTitle, nextNumber, padding },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update invoice type." }, { status: 400 });
  }
}
