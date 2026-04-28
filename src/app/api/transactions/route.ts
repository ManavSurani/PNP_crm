import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/transactions?leadId=xxx&type=RECEIVED|EXPENSE
export async function GET(req: NextRequest) {
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
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId, type, amount, date, paidTo, category, paymentMode, description } = body;
  if (!leadId || !type || !amount || !date || !paidTo || !category || !paymentMode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const transaction = await prisma.leadTransaction.create({
    data: {
      leadId,
      type,
      amount: parseFloat(amount),
      date: new Date(date),
      paidTo,
      category,
      paymentMode,
      description: description || null,
    },
  });
  return NextResponse.json(transaction, { status: 201 });
}
