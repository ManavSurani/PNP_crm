import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        lead: true,
        items: true
      }
    });

    if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

    return NextResponse.json(quotation);
  } catch (error: any) {
    console.error("[QUOTATION_GET_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to retrieve quotation profile", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
