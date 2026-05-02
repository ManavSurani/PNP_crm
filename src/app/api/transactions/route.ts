import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const leadId = req.nextUrl.searchParams.get("leadId");
    const type = req.nextUrl.searchParams.get("type") as "RECEIVED" | "EXPENSE" | null;
    
    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (type) where.type = type;

    const transactions = await prisma.leadTransaction.findMany({
      where,
      include: {
        lead: {
          select: { customerName: true }
        }
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { leadId, type, amount, date, paidTo, category, paymentMode, description } = body;

    if (!leadId || !type || !amount || !date || !paidTo || !category || !paymentMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: "Invalid amount format" }, { status: 400 });
    }

    const transaction = await prisma.leadTransaction.create({
      data: {
        leadId,
        type,
        amount: parsedAmount,
        date: new Date(date),
        paidTo,
        category,
        paymentMode,
        description: description || null,
      },
    });
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
