import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { leadId, address, date, time, notes } = body;

    if (!leadId || !address || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const meetings = await prisma.meeting.findMany({
      orderBy: { date: "asc" },
      include: {
        lead: {
          select: { customerName: true, contactNumber: true, serviceType: true, status: true, priority: true }
        }
      }
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("[MEETINGS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
