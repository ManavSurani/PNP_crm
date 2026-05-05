import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("field_id");

    const vendors = await prisma.projectVendor.findMany({
      where: fieldId ? { fieldId } : {},
      include: { 
        field: { select: { name: true } },
        contacts: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("[VENDORS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    const { fieldId, name, contacts } = body;
    
    if (!fieldId || !name || !contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "Field ID, Vendor Name, and at least one contact are required" }, { status: 400 });
    }

    // The first contact becomes the primary phone number on the Vendor record itself
    const primaryContact = contacts[0];
    
    // Any remaining contacts go into the ProjectVendorContact table
    const additionalContacts = contacts.slice(1);

    const vendor = await prisma.projectVendor.create({
      data: { 
        fieldId, 
        name, 
        phone: primaryContact.phone,
        contacts: {
          create: additionalContacts.map((c: any) => ({
            name: c.name || null,
            phone: c.phone
          }))
        }
      },
      include: {
        contacts: true
      }
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("[VENDORS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
