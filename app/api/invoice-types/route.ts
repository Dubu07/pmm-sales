import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json(await getDb().invoiceType.findMany({ where: { isActive: true }, orderBy: { id: "asc" } }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const prefix = String(body.prefix ?? "").trim().toUpperCase();
    const documentTitle = String(body.documentTitle ?? "").trim();
    const nextNumber = Number(body.nextNumber ?? 1);
    const padding = Number(body.padding ?? 4);
    if (!name || !prefix || !documentTitle) throw new Error("Name, prefix and document title are required.");
    if (!/^[A-Z0-9-]+$/.test(prefix)) throw new Error("Prefix may contain only letters, numbers and hyphens.");
    if (!Number.isInteger(nextNumber) || nextNumber < 1) throw new Error("Next number must be at least 1.");
    if (!Number.isInteger(padding) || padding < 1 || padding > 10) throw new Error("Padding must be between 1 and 10.");
    const duplicate = await getDb().invoiceType.findUnique({ where: { prefix } });
    if (duplicate) throw new Error("That invoice prefix is already in use.");
    const result = await getDb().invoiceType.create({ data: { name, prefix, documentTitle, nextNumber, padding } });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create invoice type." }, { status: 400 });
  }
}
