import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getDb().customer.findUnique({ where: { id: Number(id) } });
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const address = String(body.address ?? "").trim();
    const contactPerson = String(body.contactPerson ?? "").trim() || null;
    const phone = String(body.phone ?? "").trim() || null;
    if (!name) throw new Error("Customer name is required.");
    if (!address) throw new Error("Customer address is required.");
    const customer = await getDb().customer.update({
      where: { id: Number(id) },
      data: { name, address, contactPerson, phone },
    });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update customer." }, { status: 400 });
  }
}
