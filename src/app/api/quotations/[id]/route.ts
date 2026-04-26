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
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        lead: true,
        items: true
      }
    });

    if (!quotation) return new NextResponse("Quotation not found", { status: 404 });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("[QUOTATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
