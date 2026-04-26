import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: { orderNo: true, lead: { select: { customerName: true } } }
        }
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("[PAYMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { orderId, amount, paymentMode, referenceNo } = body;

    if (!orderId || !amount) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: parseFloat(amount),
        paymentMode: paymentMode || "CASH",
        status: "COMPLETED",
        referenceNo: referenceNo || null
      }
    });

    // Update pending balance in Order
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order) {
      const newPending = Math.max(0, order.pendingAmount - parseFloat(amount));
      const newAdvance = order.advanceAmount + parseFloat(amount);
      const newStatus = newPending === 0 ? "COMPLETED" : order.status;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          pendingAmount: newPending,
          advanceAmount: newAdvance,
          status: newStatus
        }
      });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("[PAYMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
