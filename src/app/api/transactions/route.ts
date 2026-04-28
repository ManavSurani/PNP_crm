import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, type, category, amount, date, notes, addedBy } = body;

    if (!leadId || !type || !category || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transaction = await prisma.customerTransaction.create({
      data: {
        leadId,
        type, // 'INCOMING' | 'OUTGOING'
        category,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        notes,
        addedBy,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json(
      { error: "Internal Error", details: error.message },
      { status: 500 }
    );
  }
}
