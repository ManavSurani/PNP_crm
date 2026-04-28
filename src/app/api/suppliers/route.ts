import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("[SUPPLIERS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, contactPerson, phone, gstNumber, address } = body;

    if (!name || !phone) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const supplier = await prisma.supplier.create({
      data: {
        name,
        phone,
        address
      }
    });

    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
