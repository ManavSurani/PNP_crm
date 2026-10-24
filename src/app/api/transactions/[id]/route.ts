import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canDelete } from "@/lib/rbac";

// PUT /api/transactions/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { type, amount, date, paidTo, category, paymentMode, description } = body;
    const transaction = await prisma.leadTransaction.update({
      where: { id },
      data: {
        type,
        amount: parseFloat(amount),
        date: new Date(date),
        paidTo,
        category,
        paymentMode,
        description: description || null,
      },
    });
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[TRANSACTION_PUT]", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canDelete(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.leadTransaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRANSACTION_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
