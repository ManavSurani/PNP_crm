import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addDays } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

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
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { leadId, outcome, noteGiven, pickedStatus, cancelReason } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { followUps: true }
    });

    if (!lead) return new NextResponse("Lead not found", { status: 404 });

    const attemptCount = lead.followUps.length + 1;

    let leadStatusUpdate: string = lead.status;
    let autoNextDate: Date | null = null;
    let isCancelled = false;
    let finalCancelReason: string | null = null;

    if (outcome === "NOT_PICKED") {
      if (attemptCount >= 4) {
        // Auto-cancel after 4 missed attempts — no note required
        leadStatusUpdate = "CANCELLED";
        isCancelled = true;
        finalCancelReason = "No Response - Max 4 Attempts Reached";
      } else {
        leadStatusUpdate = "FOLLOW_UP";
        autoNextDate = addDays(new Date(), 1); // Always auto-reschedule tomorrow
      }
    } else if (outcome === "PICKED") {
      // Apply the status chosen by the user after picking
      if (pickedStatus === "MEETING") {
        leadStatusUpdate = "MEETING_SCHEDULED";
      } else if (pickedStatus === "CANCELLED") {
        leadStatusUpdate = "CANCELLED";
        isCancelled = true;
        finalCancelReason = cancelReason || "Customer Cancelled";
      } else {
        // Interested / Reschedule → stay on FOLLOW_UP
        leadStatusUpdate = "FOLLOW_UP";
      }
    } else if (outcome === "CANCELLED") {
      // Direct cancellation from action menu
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
        noteGiven: noteGiven || null, // Optional for NOT_PICKED
        nextCallDate: autoNextDate,
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
