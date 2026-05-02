import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { status, isBlocked, blockReason, note } = body;

    const currentOrder = await prisma.order.findUnique({
       where: { id },
       select: { status: true }
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Phase 4 Rule: Enforce Sequential Stage Transitions
    const STAGE_ORDER = [
      "CONFIRMED", "DESIGN", "MATERIAL_PROCUREMENT", "PRODUCTION", 
      "INSTALLATION", "QUALITY_CHECK", "HANDOVER", "COMPLETED"
    ];

    if (status && status !== "CANCELLED") {
       const currentIndex = STAGE_ORDER.indexOf(currentOrder.status);
       const nextIndex = STAGE_ORDER.indexOf(status);

       if (nextIndex > currentIndex + 1) {
          return NextResponse.json({ 
            error: `Sequential skip not allowed. You must complete '${STAGE_ORDER[currentIndex + 1]}' before moving to '${status}'.` 
          }, { status: 400 });
       }
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (blockReason !== undefined) updateData.blockReason = blockReason;

    // Transaction to update Order AND Log the transition
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: updateData,
      });

      if (status && status !== currentOrder.status) {
        // Definitive Fix: Use any-casting for dynamic model access
        await (tx as any).orderUpdate.create({
          data: {
            orderId: id,
            fromStatus: currentOrder.status,
            toStatus: status,
            note: note || `Stage transitioned from ${currentOrder.status} to ${status}`,
            userId: session.user.id // Tracking who made the change
          }
        });
      }

      return updated;
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("[ORDER_PUT_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to update order details", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        lead: { 
          include: { 
            transactions: { orderBy: { date: "desc" } } 
          },
        },
        updates: { orderBy: { createdAt: "desc" } },
        assignments: {
          include: { worker: true }
        }
      } as any,
    });

    if (!order) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("[ORDER_GET_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to retrieve order profile", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.order.delete({
      where: { id }
    });

    // Audit Log
    const { createAuditLog } = await import("@/lib/audit");
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "ORDER",
      entityId: id
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[ORDER_DELETE_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to delete order record", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
