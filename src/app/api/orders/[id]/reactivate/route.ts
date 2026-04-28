import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: "CONFIRMED",
      },
    });

    // Log in lead timeline
    await prisma.leadNote.create({
      data: {
        leadId: order.leadId,
        content: `🔄 Order Reactivated (Order No: ${order.orderNo})`,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_REACTIVATE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
