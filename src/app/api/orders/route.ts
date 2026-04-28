import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          include: { 
            transactions: {
              where: { type: "RECEIVED" },
              select: { amount: true }
            }
          }
        },
        quotation: {
          select: { finalTotal: true }
        }
      }
    });

    const ordersWithFinancials = orders.map(order => {
      const totalCollections = order.lead?.transactions.reduce((acc, t) => acc + t.amount, 0) || 0;
      return {
        ...order,
        advanceAmount: totalCollections,
        pendingAmount: Math.max(0, order.totalAmount - totalCollections)
      };
    });

    return NextResponse.json(ordersWithFinancials);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    // If advance amount exists, automatically create a LeadTransaction entry
    if (advanceAmount > 0) {
      await prisma.leadTransaction.create({
        data: {
          leadId,
          amount: parseFloat(advanceAmount.toString()),
          type: "RECEIVED",
          date: new Date(),
          paidTo: "PNP Projects",
          category: "Advance",
          paymentMode: "BANK_TRANSFER",
          description: `Advance received for Order ${orderNo}`
        }
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
