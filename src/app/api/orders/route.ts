import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: { customerName: true, contactNumber: true, serviceType: true }
        },
        quotation: {
          select: { quotationNo: true, finalTotal: true }
        }
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { leadId, quotationId, totalAmount, advanceAmount, status, completionDate } = body;

    const count = await prisma.order.count();
    const orderNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const order = await prisma.order.create({
      data: {
        leadId,
        quotationId: quotationId || null,
        orderNo,
        totalAmount,
        advanceAmount,
        pendingAmount: totalAmount - advanceAmount,
        status: status || "CONFIRMED",
        endDate: completionDate ? new Date(completionDate) : null
      }
    });

    // Update Lead to WON_ORDER
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "WON_ORDER", isCancelled: false }
    });

    // If advance amount exists, automatically create a Payment entry
    if (advanceAmount > 0) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: advanceAmount,
          paymentMode: "BANK_TRANSFER", // Defaulting, can be changed later
          status: "COMPLETED",
          referenceNo: `ADV-${orderNo}`
        }
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
