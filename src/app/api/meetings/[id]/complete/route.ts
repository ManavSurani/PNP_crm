import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: meetingId } = await params;
    const body = await request.json();
    const { meetingOutcome, noteContent, cancelReason, followUpDate, followUpTime } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch meeting and lead
      const meeting = await tx.meeting.findUnique({
        where: { id: meetingId },
        include: { lead: { select: { id: true, status: true, reactivatedAt: true } } }
      });

      if (!meeting) throw new Error("Meeting not found");
      const leadId = meeting.leadId;
      const lead = meeting.lead;

      // 2. Append notes to meeting and mark COMPLETED
      const appendedNotes = noteContent 
        ? (meeting.notes ? `${meeting.notes}\n\nOutcome (${meetingOutcome === "RECALL" ? "Recall" : meetingOutcome === "NOT_INTERESTED" ? "Not Interested" : meetingOutcome === "NOT_PICKED" ? "No Answer" : "Converted"}): ${noteContent}` : `Outcome (${meetingOutcome === "RECALL" ? "Recall" : meetingOutcome === "NOT_INTERESTED" ? "Not Interested" : meetingOutcome === "NOT_PICKED" ? "No Answer" : "Converted"}): ${noteContent}`) 
        : meeting.notes;

      await tx.meeting.update({
        where: { id: meetingId },
        data: { status: "COMPLETED", notes: appendedNotes }
      });

      // 3. Handle specific outcomes
      let leadStatusUpdate = lead.status;
      let scheduledCallDate: Date | null = null;
      let scheduledCallTime: string | null = followUpTime || null;
      let isCancelled = false;
      let finalCancelReason: string | null = null;
      let followUpOutcome: string | null = null;
      let activeMissesCount = 0;
      
      if (meetingOutcome === "RECALL" || meetingOutcome === "NOT_PICKED" || meetingOutcome === "NOT_INTERESTED") {
        
        if (meetingOutcome === "RECALL") {
          followUpOutcome = "PICKED"; // Representing a successful connection that led to a recall
          leadStatusUpdate = "FOLLOW_UP";
          if (followUpDate) scheduledCallDate = new Date(followUpDate);
          
          if (lead.reactivatedAt) {
            await tx.lead.update({ where: { id: leadId }, data: { reactivatedAt: null } });
          }
        } 
        else if (meetingOutcome === "NOT_INTERESTED") {
          followUpOutcome = "CANCELLED";
          if (lead.status !== "WON_ORDER") leadStatusUpdate = "CANCELLED";
          isCancelled = true;
          finalCancelReason = cancelReason || "Not Interested after Visit";
        } 
        else if (meetingOutcome === "NOT_PICKED") {
          followUpOutcome = "NOT_PICKED";
          
          // 4-Strike Logic
          const recentFollowUps = await tx.followUp.findMany({
            where: { leadId, completedDate: { not: null } },
            orderBy: { createdAt: "desc" },
            select: { outcome: true }
          });
          
          for (const f of recentFollowUps) {
            if (f.outcome === "NOT_PICKED") activeMissesCount++;
            else if (f.outcome === "PICKED" || f.outcome === "INTERESTED") break;
          }

          if (lead.reactivatedAt) {
            leadStatusUpdate = "CANCELLED";
            isCancelled = true;
            finalCancelReason = "No Response after Reactivation";
          } else {
            if (activeMissesCount + 1 >= 4) {
              leadStatusUpdate = "CANCELLED";
              isCancelled = true;
              finalCancelReason = "No Response - 4 Attempts Reached";
            } else {
              leadStatusUpdate = "FOLLOW_UP";
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 0, 0, 0);
              scheduledCallDate = tomorrow; 
            }
          }
        }

        // Log the FollowUp Attempt
        if (followUpOutcome) {
          await tx.followUp.create({
            data: {
              leadId,
              attemptNumber: followUpOutcome === "NOT_PICKED" ? activeMissesCount + 1 : 1,
              outcome: followUpOutcome as any,
              noteGiven: noteContent || null,
              nextCallDate: scheduledCallDate,
              nextCallTime: scheduledCallTime,
              completedDate: new Date()
            }
          });
        }
      }

      // Cleanup pending followups
      if (meetingOutcome === "RECALL" || meetingOutcome === "NOT_PICKED" || meetingOutcome === "NOT_INTERESTED") {
        await tx.followUp.deleteMany({
          where: { leadId, completedDate: null }
        });
      }

      // Schedule next call if needed
      if (scheduledCallDate && !isCancelled) {
        await tx.followUp.create({
          data: {
            leadId,
            nextCallDate: scheduledCallDate,
            nextCallTime: scheduledCallTime,
            completedDate: null
          }
        });
      }

      // Update Lead
      if (meetingOutcome !== "RESCHEDULE") {
        await tx.lead.update({
          where: { id: leadId },
          data: {
            status: leadStatusUpdate as any,
            isCancelled,
            cancelReason: finalCancelReason
          }
        });
      }

      return { success: true, leadId, isCancelled };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[MEETING_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
