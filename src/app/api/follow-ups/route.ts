import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const followUps = await prisma.followUp.findMany({
      where: {
        completedDate: null,
        lead: {
          status: {
            notIn: ["WON_ORDER", "CANCELLED"]
          }
        }
      },
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
    const { 
      leadId, outcome, noteGiven, pickedStatus, cancelReason, 
      followUpDate, followUpTime,
      meetingAddress, meetingDate, meetingTime, meetingNotes
    } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        status: true,
        reactivatedAt: true,
        followUps: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const attemptCount = lead.followUps.length + 1;

    let leadStatusUpdate: string = lead.status;
    let scheduledCallDate: Date | null = null;
    let scheduledCallTime: string | null = followUpTime || null;
    let isCancelled = false;
    let finalCancelReason: string | null = null;

    if (outcome === "NOT_PICKED") {
      // RULE 4 & 5: If lead was reactivated, it's a one-strike direct move back to Cancel
      if (lead.reactivatedAt) {
        leadStatusUpdate = "CANCELLED";
        isCancelled = true;
        finalCancelReason = "No Response after Reactivation";
      } else {
        // RULE 2: 4-attempt algorithm based on dynamic active count
        // We count existing NOT_PICKED records. If adding this new one makes it 4, we cancel.
        const activeMissesCount = await prisma.followUp.count({
          where: {
            leadId,
            outcome: "NOT_PICKED",
            completedDate: { not: null }
          }
        });

        if (activeMissesCount + 1 >= 4) {
          leadStatusUpdate = "CANCELLED";
          isCancelled = true;
          finalCancelReason = "No Response - 4 Attempts Reached";
        } else {
          leadStatusUpdate = "FOLLOW_UP";
          scheduledCallDate = addDays(new Date(), 1); 
        }
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

    // 1. Log this FollowUp attempt as COMPLETED
    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        attemptNumber: attemptCount,
        outcome: outcome as any,
        noteGiven: noteGiven || null,
        nextCallDate: scheduledCallDate, // Save what was scheduled
        nextCallTime: scheduledCallTime, // Save what was scheduled
        completedDate: new Date()
      }
    });

    // 2. Delete ANY old pending follow-ups for this lead to avoid duplicates in the queue
    await prisma.followUp.deleteMany({
      where: {
        leadId,
        completedDate: null
      }
    });

    // 3. If a future call was scheduled, create a NEW PENDING follow-up record
    if (scheduledCallDate) {
      await prisma.followUp.create({
        data: {
          leadId,
          nextCallDate: scheduledCallDate,
          nextCallTime: scheduledCallTime,
          noteGiven: null, // Next call starts with a fresh note
          completedDate: null
        }
      });
    }

    // 4. Update Lead Status and Address if meeting scheduled
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: leadStatusUpdate as any,
        isCancelled,
        cancelReason: finalCancelReason,
        fullAddress: (pickedStatus === "MEETING" && meetingAddress) ? meetingAddress : undefined
      }
    });
    
    // 5. If it's a meeting, create the actual Meeting record
    if (pickedStatus === "MEETING" && meetingAddress && meetingDate) {
      await prisma.meeting.create({
        data: {
          leadId,
          address: meetingAddress,
          date: new Date(meetingDate),
          time: meetingTime || "Not Specified",
          notes: meetingNotes || null,
          status: "SCHEDULED"
        }
      });
    }

    return NextResponse.json(followUp);
  } catch (error) {
    console.error("[FOLLOWUPS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
