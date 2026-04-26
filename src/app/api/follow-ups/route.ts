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
    const { leadId, outcome, noteGiven, nextCallDate, nextCallTime } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { followUps: true }
    });

    if (!lead) return new NextResponse("Lead not found", { status: 404 });

    const attemptCount = lead.followUps.length + 1;

    // Default status logic based on business rules
    let leadStatusUpdate = lead.status;
    let autoNextDate = nextCallDate ? new Date(nextCallDate) : null;
    let isCancelled = false;
    let cancelReason = null;

    if (outcome === "NOT_PICKED") {
      if (attemptCount >= 4) {
        // Auto cancel after 4 missed attempts
        leadStatusUpdate = "CANCELLED";
        isCancelled = true;
        cancelReason = "No Response - Max 4 Attempts Reached";
      } else {
        // Auto reschedule for next day
        leadStatusUpdate = "FOLLOW_UP";
        autoNextDate = addDays(new Date(), 1);
      }
    } else if (outcome === "PICKED") {
      leadStatusUpdate = "FOLLOW_UP";
    }

    // 1. Log the Follow Up Attempt
    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        attemptNumber: attemptCount,
        outcome,
        noteGiven,
        nextCallDate: autoNextDate,
        nextCallTime,
        completedDate: new Date()
      }
    });

    // 2. Update Lead Timeline Note Automatically
    await prisma.note.create({
      data: {
        leadId,
        content: `Call attempt ${attemptCount} - ${outcome.replace("_", " ")}. ${noteGiven ? "Notes: " + noteGiven : ""}`,
      }
    });

    // 3. Update the Lead Status
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: leadStatusUpdate as any,
        isCancelled,
        cancelReason
      }
    });

    return NextResponse.json(followUp);
  } catch (error) {
    console.error("[FOLLOWUPS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
