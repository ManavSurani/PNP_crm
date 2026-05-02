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
    console.error("[ORDERS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { leadId, quotationId, totalAmount, advanceAmount, status, completionDate } = body;

    if (!leadId || !totalAmount) {
      return NextResponse.json({ error: "Missing required fields (leadId, totalAmount)" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate Order Number with basic collision avoidance
      const count = await tx.order.count();
      const orderNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // 2. Create the Order
      const order = await tx.order.create({
        data: {
          leadId,
          quotationId: quotationId || null,
          orderNo,
          totalAmount: parseFloat(totalAmount),
          advanceAmount: parseFloat(advanceAmount || 0),
          pendingAmount: parseFloat(totalAmount) - parseFloat(advanceAmount || 0),
          status: status || "CONFIRMED",
          endDate: completionDate ? new Date(completionDate) : null
        }
      });

      // 3. Update Lead Status to WON_ORDER
      await tx.lead.update({
        where: { id: leadId },
        data: { status: "WON_ORDER", isCancelled: false }
      });

      // 4. If advance amount exists, automatically create a LeadTransaction entry
      if (advanceAmount > 0) {
        await tx.leadTransaction.create({
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

      return order;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ORDERS_POST]", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
