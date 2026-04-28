import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const followUps = await prisma.followUp.findMany({
      orderBy: { scheduledDate: "asc" },
      include: {
        lead: {
          select: { customerName: true, contactNumber: true, serviceType: true, status: true, priority: true }
        }
      }
    });

    return NextResponse.json(followUps);
  } catch (error) {
    console.error("[FOLLOWUPS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { leadId, outcome, noteGiven, pickedStatus, cancelReason, followUpDate, followUpTime } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { followUps: true }
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const attemptCount = lead.followUps.length + 1;

    let leadStatusUpdate: string = lead.status;
    let scheduledCallDate: Date | null = null;
    let scheduledCallTime: string | null = followUpTime || null;
    let isCancelled = false;
    let finalCancelReason: string | null = null;

    if (outcome === "NOT_PICKED") {
      if (attemptCount >= 4) {
        leadStatusUpdate = "CANCELLED";
        isCancelled = true;
        finalCancelReason = "No Response - Max 4 Attempts Reached";
      } else {
        leadStatusUpdate = "FOLLOW_UP";
        scheduledCallDate = addDays(new Date(), 1); 
      }
    } else if (outcome === "PICKED") {
      if (pickedStatus === "MEETING") {
        leadStatusUpdate = "MEETING_SCHEDULED";
      } else if (pickedStatus === "CANCELLED") {
        leadStatusUpdate = "CANCELLED";
        isCancelled = true;
        finalCancelReason = cancelReason || "Customer Cancelled";
      } else if (pickedStatus === "NEXT_DAY") {
        leadStatusUpdate = "FOLLOW_UP";
        scheduledCallDate = addDays(new Date(), 1);
      } else {
        leadStatusUpdate = "FOLLOW_UP";
      }

      // Override with user-provided date if available (for INTERESTED or RESCHEDULE)
      if (followUpDate) {
        scheduledCallDate = new Date(followUpDate);
      }
    } else if (outcome === "CANCELLED") {
      leadStatusUpdate = "CANCELLED";
      isCancelled = true;
      finalCancelReason = cancelReason || "Not Specified";
    }

    // 1. Log FollowUp attempt
    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        attemptNumber: attemptCount,
        outcome: outcome as any,
        noteGiven: noteGiven || null, 
        nextCallDate: scheduledCallDate,
        nextCallTime: scheduledCallTime,
        completedDate: new Date()
      }
    });

    // 2. Update Lead Status
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: leadStatusUpdate as any,
        isCancelled,
        cancelReason: finalCancelReason
      }
    });

    return NextResponse.json(followUp);
  } catch (error) {
    console.error("[FOLLOWUPS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
