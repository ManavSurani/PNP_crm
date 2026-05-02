import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customers = await prisma.lead.findMany({
      where: { status: "WON_ORDER" },
      include: {
        orders: true,
        transactions: {
          orderBy: { date: 'desc' }
        },
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("[FINANCIALS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 });
  }
}
