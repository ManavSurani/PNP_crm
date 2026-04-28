import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [canceledLeads, canceledOrders] = await Promise.all([
      prisma.lead.findMany({
        where: {
          OR: [
            { status: "CANCELLED" },
            { isCancelled: true }
          ]
        },
        include: {
          assignedStaff: { select: { name: true } }
        },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.order.findMany({
        where: { status: "CANCELLED" },
        include: {
          lead: { select: { customerName: true, contactNumber: true, serviceType: true } }
        },
        orderBy: { updatedAt: "desc" }
      })
    ]);

    return NextResponse.json({
      leads: canceledLeads,
      orders: canceledOrders
    });
  } catch (error) {
    console.error("[CANCELED_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
