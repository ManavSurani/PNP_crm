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

    // Log financial event
    // @ts-ignore - newly added
    await prisma.leadFinancialLog.create({
      data: {
        leadId,
        action: type === "RECEIVED" ? "INCOME_ADDED" : "EXPENSE_ADDED",
        details: `${type === "RECEIVED" ? "Income" : "Expense"} of ₹${parsedAmount.toLocaleString()} added (${category} - ${paidTo})`,
        amount: parsedAmount
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });

    const existing = await prisma.leadTransaction.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.leadTransaction.delete({ where: { id } });

    // Log financial event
    if (existing.leadId) {
      // @ts-ignore - newly added
      await prisma.leadFinancialLog.create({
        data: {
          leadId: existing.leadId,
          action: "TRANSACTION_DELETED",
          details: `${existing.type === "RECEIVED" ? "Income" : "Expense"} of ₹${existing.amount.toLocaleString()} deleted (${existing.category})`,
          amount: existing.amount
        }
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TRANSACTIONS_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, amount, date, paidTo, category, paymentMode, description } = body;

    if (!id) return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });

    const existing = await prisma.leadTransaction.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.leadTransaction.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        date: date ? new Date(date) : undefined,
        paidTo,
        category,
        paymentMode,
        description,
      },
    });

    // Log financial event
    if (existing.leadId) {
      // @ts-ignore - newly added
      await prisma.leadFinancialLog.create({
        data: {
          leadId: existing.leadId,
          action: "TRANSACTION_UPDATED",
          details: `${existing.type === "RECEIVED" ? "Income" : "Expense"} record updated. New amount: ₹${updated.amount.toLocaleString()}`,
          amount: updated.amount
        }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[TRANSACTIONS_PUT]", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
