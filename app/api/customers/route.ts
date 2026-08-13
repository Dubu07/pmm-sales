import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      ...(q ? { OR: [{ name: { contains: q } }, { contactPerson: { contains: q } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { name: "asc" },
    take: 100,
  });
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const address = String(body.address ?? "").trim();
    const contactPerson = String(body.contactPerson ?? "").trim() || null;
    const phone = String(body.phone ?? "").trim() || null;
    if (!name) throw new Error("Customer name is required.");
    if (!address) throw new Error("Customer address is required.");
    const customer = await prisma.customer.create({ data: { name, address, contactPerson, phone } });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create customer." }, { status: 400 });
  }
}
