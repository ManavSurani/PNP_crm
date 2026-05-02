import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log(`[SUPPLIERS_GET] Fetching for user: ${session.user?.email}`);
    
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" }
    });
    
    console.log(`[SUPPLIERS_GET] Successfully found ${suppliers.length} vendors.`);
    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("[SUPPLIERS_GET] CRITICAL_FAILURE:", error);
    return NextResponse.json({ 
      error: "Failed to fetch suppliers",
      details: error.message || "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, contactPerson, phone, gstNumber, address } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and Phone are required" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson: contactPerson || null,
        phone,
        gstNumber: gstNumber || null,
        address: address || null
      }
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("[SUPPLIERS_POST]", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
