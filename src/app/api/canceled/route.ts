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
          status: { not: "WON_ORDER" },
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
      prisma.lead.findMany({
        where: { 
          status: "WON_ORDER",
          isCancelled: true
        },
        include: {
          assignedStaff: { select: { name: true } }
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
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "leads" or "orders"

    if (type === "leads") {
      // Find IDs to log
      const leadsToWipe = await prisma.lead.findMany({
        where: {
          status: { not: "WON_ORDER" },
          OR: [
            { status: "CANCELLED" },
            { isCancelled: true }
          ]
        },
        select: { id: true }
      });

      if (leadsToWipe.length > 0) {
        await prisma.lead.deleteMany({
          where: { id: { in: leadsToWipe.map(l => l.id) } }
        });

        // Create log entries for analytics
        await prisma.auditLog.createMany({
          data: leadsToWipe.map(l => ({
            action: "WIPE_DATA",
            entity: "Lead",
            entityId: l.id,
            oldValue: "CANCELLED",
            userId: session.user.id
          }))
        });
      }
    } else if (type === "orders") {
      const ordersToWipe = await prisma.lead.findMany({
        where: { 
          status: "WON_ORDER",
          isCancelled: true
        },
        select: { id: true }
      });

      if (ordersToWipe.length > 0) {
        await prisma.lead.deleteMany({
          where: { id: { in: ordersToWipe.map(o => o.id) } }
        });

        await prisma.auditLog.createMany({
          data: ordersToWipe.map(o => ({
            action: "WIPE_DATA",
            entity: "Lead",
            entityId: o.id,
            oldValue: "CANCELLED",
            userId: session.user.id
          }))
        });
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CANCELED_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
