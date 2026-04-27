import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { leadId, address, date, time, notes } = body;

    if (!leadId || !address || !date || !time) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        leadId,
        address,
        date: new Date(date),
        time,
        notes: notes || null,
        status: "SCHEDULED"
      }
    });

    // Update lead status to MEETING_SCHEDULED automatically
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "MEETING_SCHEDULED" }
    });

    // Log this action to the Notes Timeline too
    // [DEPRECATED] We now render the Meeting record directly in the professional timeline to avoid duplicates.
    
    return NextResponse.json(meeting);
  } catch (error) {
    console.error("[MEETINGS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
