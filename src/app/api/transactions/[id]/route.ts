import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();

    // Prevent leadId or type changing unless intended
    const updated = await prisma.customerTransaction.update({
      where: { id },
      data: {
        ...body,
        amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
        date: body.date ? new Date(body.date) : undefined
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[TRANSACTIONS_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update transaction", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.customerTransaction.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[TRANSACTIONS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete transaction", details: error.message },
      { status: 500 }
    );
  }
}
