import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Force Next.js to reload this file and pick up the newly generated Prisma schema

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedStaff: { select: { name: true } },
        followUps: { orderBy: { createdAt: "desc" } },
        meetings: { orderBy: { createdAt: "desc" } },
        requirement: true,
        quotations: true,
        orders: true,
        transactions: {
          orderBy: { date: "desc" },
        },
        leadNotes: {
          orderBy: { createdAt: "desc" },
        },
      }
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEAD_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    // Get old value for audit
    const oldLead = await prisma.lead.findUnique({ where: { id } });

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { ...body }
    });

    // Audit Log
    const { createAuditLog } = await import("@/lib/audit");
    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "LEAD",
      entityId: id,
      oldValue: oldLead,
      newValue: updatedLead
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("[LEAD_PUT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
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

    await prisma.lead.delete({
      where: { id }
    });

    // Audit Log
    const { createAuditLog } = await import("@/lib/audit");
    await createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "LEAD",
      entityId: id
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[LEAD_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
