import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { note } = body;

    // 1. Update Lead flags
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        // @ts-ignore - newly added
        isProjectCompleted: false,
        // @ts-ignore - newly added
        isFinanciallyClosed: false,
        reactivatedAt: new Date(),
        reactivationNote: note || "Project reactivated from Complete Projects archive"
      }
    });

    // 2. Update linked Project if exists
    await prisma.project.updateMany({
      where: { customerId: id },
      data: {
        isCompleted: false,
        completedOn: null
      }
    });

    // 3. Log the event
    // @ts-ignore
    await prisma.leadFinancialLog.create({
      data: {
        leadId: id,
        action: "PROJECT_REACTIVATED",
        details: `Project reactivated — ${note || 'System reactivation'}`,
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("[PROJECT_REACTIVATE_POST]", error);
    return NextResponse.json({ error: "Failed to reactivate project" }, { status: 500 });
  }
}
