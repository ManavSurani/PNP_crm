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

    const { fieldId, name, phone } = await request.json();
    if (!fieldId || !name || !phone) {
      return NextResponse.json({ error: "Field ID, Name, and Phone are required" }, { status: 400 });
    }

    const vendor = await prisma.projectVendor.create({
      data: { fieldId, name, phone }
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("[VENDORS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
