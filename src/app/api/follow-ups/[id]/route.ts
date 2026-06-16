import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canDelete } from "@/lib/rbac";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { noteGiven, outcome } = body;

    const followUp = await prisma.followUp.update({
      where: { id },
      data: {
        noteGiven: noteGiven !== undefined ? noteGiven : undefined,
        outcome: outcome ? (outcome as any) : undefined,
      }
    });

    return NextResponse.json(followUp);
  } catch (error) {
    console.error("[FOLLOWUP_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canDelete(session.user.role))
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });

    const { id } = await params;

    // 1. Get the leadId before deletion
    const followUp = await prisma.followUp.findUnique({
      where: { id },
      select: { leadId: true }
    });

    if (!followUp) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const leadId = followUp.leadId;

    // 2. Perform deletion of the timeline activity
    await prisma.followUp.delete({
      where: { id }
    });

    // 2.5 Delete any associated pending follow-ups to remove them from the Follow-Up Queue and Notifications
    await prisma.followUp.deleteMany({
      where: {
        leadId,
        completedDate: null
      }
    });

    // 3. Recalculate lead status to maintain synchronization
    
    // Count remaining ALL contacts
    const remainingFollowUps = await prisma.followUp.count({
      where: { leadId }
    });

    // Count remaining successful contacts
    const successfulCalls = await prisma.followUp.count({
      where: { leadId, outcome: "PICKED", completedDate: { not: null } }
    });

    // Count remaining meetings
    const activeMeetings = await prisma.meeting.count({
      where: { leadId }
    });

    // If literally no followups or meetings left, or no successful ones, revert status
    if (remainingFollowUps === 0 && activeMeetings === 0) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: "NEW_INQUIRY" }
      });
    } else if (successfulCalls === 0 && activeMeetings === 0) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: "NEW_INQUIRY" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FOLLOWUP_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
