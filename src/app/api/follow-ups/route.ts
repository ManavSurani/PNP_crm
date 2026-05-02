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
      select: {
        id: true,
        attemptNumber: true,
        scheduledDate: true,
        nextCallDate: true,
        nextCallTime: true,
        leadId: true,
        lead: {
          select: { 
            customerName: true, 
            contactNumber: true, 
            serviceType: true, 
            status: true, 
            priority: true,
            _count: {
              select: {
                followUps: {
                  where: { completedDate: { not: null } }
                }
              }
            },
            followUps: {
              where: { completedDate: { not: null } },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { noteGiven: true, outcome: true, createdAt: true }
            },
            leadNotes: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { content: true, createdAt: true }
            }
          }
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

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          status: true,
          reactivatedAt: true,
        }
      });

      if (!lead) throw new Error("Lead not found");

      // 1. Calculate attempt number based on completed records
      const activeMissesCount = await tx.followUp.count({
        where: {
          leadId,
          outcome: "NOT_PICKED",
          completedDate: { not: null }
        }
      });

      const attemptCount = activeMissesCount + 1;

      let leadStatusUpdate: string = lead.status;
      let scheduledCallDate: Date | null = null;
      let scheduledCallTime: string | null = followUpTime || null;
      let isCancelled = false;
      let finalCancelReason: string | null = null;

      if (outcome === "NOT_PICKED") {
        // RULE: If lead was reactivated, it's a one-strike direct move back to Cancel
        if (lead.reactivatedAt) {
          leadStatusUpdate = "CANCELLED";
          isCancelled = true;
          finalCancelReason = "No Response after Reactivation";
        } else {
          // RULE: 4-attempt algorithm
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
        // ✅ RESET STRIKE: If we talk to them, clear reactivation flag
        if (lead.reactivatedAt) {
          await tx.lead.update({
            where: { id: leadId },
            data: { reactivatedAt: null }
          });
        }

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

        if (followUpDate) {
          scheduledCallDate = new Date(followUpDate);
        }
      } else if (outcome === "CANCELLED") {
        leadStatusUpdate = "CANCELLED";
        isCancelled = true;
        finalCancelReason = cancelReason || "Not Specified";
      }

      // 2. Log this FollowUp attempt as COMPLETED
      const followUp = await tx.followUp.create({
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

      // 3. Delete ANY old pending follow-ups to avoid duplicates/stale items
      await tx.followUp.deleteMany({
        where: {
          leadId,
          completedDate: null
        }
      });

      // 4. If a future call was scheduled and NOT cancelled, create a NEW PENDING record
      if (scheduledCallDate && !isCancelled) {
        await tx.followUp.create({
          data: {
            leadId,
            nextCallDate: scheduledCallDate,
            nextCallTime: scheduledCallTime,
            noteGiven: null,
            completedDate: null
          }
        });
      }

      // 5. Update Lead Status
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: leadStatusUpdate as any,
          isCancelled,
          cancelReason: finalCancelReason,
          fullAddress: (pickedStatus === "MEETING" && meetingAddress) ? meetingAddress : undefined
        }
      });
      
      // 6. Handle Meeting Creation
      if (pickedStatus === "MEETING" && meetingAddress && meetingDate) {
        await tx.meeting.create({
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

      return followUp;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[FOLLOWUPS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
