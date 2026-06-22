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
    const { address, date, time, notes, status } = body;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        address: address !== undefined ? address : undefined,
        date: date ? new Date(date) : undefined,
        time: time !== undefined ? time : undefined,
        notes: notes !== undefined ? notes : undefined,
        status: status ? (status as any) : undefined,
      }
    });

    if (status === "COMPLETED") {
      const remainingMeetings = await prisma.meeting.count({ 
        where: { leadId: meeting.leadId, status: "SCHEDULED" } 
      });

      if (remainingMeetings === 0) {
        const successfulCalls = await prisma.followUp.count({
          where: { leadId: meeting.leadId, outcome: "PICKED", completedDate: { not: null } }
        });

        if (successfulCalls > 0) {
          await prisma.lead.update({ where: { id: meeting.leadId }, data: { status: "FOLLOW_UP" } });
        } else {
          await prisma.lead.update({ where: { id: meeting.leadId }, data: { status: "NEW_INQUIRY" } });
        }
      }
    }


    return NextResponse.json(meeting);
  } catch (error) {
    console.error("[MEETING_PATCH]", error);
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

    // 1. Get leadId before deletion
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      select: { leadId: true }
    });

    if (!meeting) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // 2. Delete the meeting
    await prisma.meeting.delete({
      where: { id }
    });

    // 3. Recalculate status
    const leadId = meeting.leadId;
    
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
    if (lead && ["NEW_INQUIRY", "FOLLOW_UP", "MEETING_SCHEDULED"].includes(lead.status)) {
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
    console.error("[MEETING_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
