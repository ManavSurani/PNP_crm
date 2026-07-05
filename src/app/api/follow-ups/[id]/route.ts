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

    // 1. Get the followUp details before deletion
    const followUp = await prisma.followUp.findUnique({
      where: { id },
      select: { leadId: true, createdAt: true, completedDate: true }
    });

    if (!followUp) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const leadId = followUp.leadId;

    // 2. Perform deletion
    await prisma.followUp.delete({
      where: { id }
    });

    if (followUp.completedDate) {
      // ROLLBACK LOGIC: Deleting a COMPLETED Follow-up
      
      // A. Did it spawn from completing a Site Visit? (Recall Follow-up)
      const linkedMeeting = await prisma.meeting.findFirst({
        where: { 
          leadId, 
          status: "COMPLETED",
          updatedAt: { gte: new Date(followUp.createdAt.getTime() - 10000), lte: new Date(followUp.createdAt.getTime() + 10000) }
        }
      });

      if (linkedMeeting) {
        // Revert Meeting to SCHEDULED
        await prisma.meeting.update({ where: { id: linkedMeeting.id }, data: { status: "SCHEDULED" } });
        
        // Wipe pending follow-up spawned by the meeting completion (e.g. from Recall)
        await prisma.followUp.deleteMany({ where: { leadId, completedDate: null } });
      } else {
        // B. It was a standard FollowUp. Restore previous FollowUp's pending state.
        const prevFollowUp = await prisma.followUp.findFirst({
          where: { leadId, completedDate: { not: null }, createdAt: { lt: followUp.createdAt } },
          orderBy: { createdAt: "desc" }
        });
        
        // Wipe current pending
        await prisma.followUp.deleteMany({ where: { leadId, completedDate: null } });
        
        if (prevFollowUp && prevFollowUp.nextCallDate) {
          // Restore pending
          await prisma.followUp.create({
            data: { leadId, nextCallDate: prevFollowUp.nextCallDate, nextCallTime: prevFollowUp.nextCallTime, completedDate: null }
          });
        }
      }
    }

    // 3. Recalculate lead status to maintain synchronization
    
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
    if (lead && ["NEW_INQUIRY", "FOLLOW_UP", "MEETING_SCHEDULED", "CANCELLED"].includes(lead.status)) {
      const activeMeetings = await prisma.meeting.count({ where: { leadId, status: "SCHEDULED" } });
      const successfulCalls = await prisma.followUp.count({
        where: { leadId, outcome: { in: ["PICKED", "INTERESTED"] }, completedDate: { not: null } }
      });

      if (activeMeetings > 0) {
        await prisma.lead.update({ where: { id: leadId }, data: { status: "MEETING_SCHEDULED" } });
      } else if (successfulCalls > 0) {
        await prisma.lead.update({ where: { id: leadId }, data: { status: "FOLLOW_UP" } });
      } else {
        await prisma.lead.update({ where: { id: leadId }, data: { status: "NEW_INQUIRY" } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FOLLOWUP_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
