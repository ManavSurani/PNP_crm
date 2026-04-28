import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
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
  } catch (error: any) {
    console.error("[FINANCIALS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
