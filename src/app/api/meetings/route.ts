import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { leadId, address, date, time, notes } = body;
    const finalTime = time || "Not Specified";

    if (!leadId || !address || !date) {
      return NextResponse.json({ error: "Missing required fields (leadId, address, date)" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          leadId,
          address,
          date: new Date(date),
          time: finalTime,
          notes: notes || null,
          status: "SCHEDULED"
        }
      });

      // Update lead status and sync address
      await tx.lead.update({
        where: { id: leadId },
        data: { 
          status: "MEETING_SCHEDULED",
          fullAddress: address 
        }
      });

      return meeting;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[MEETINGS_POST]", error);
    return NextResponse.json({ error: "Failed to schedule meeting" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const meetings = await prisma.meeting.findMany({
      where: {
        status: "SCHEDULED",
        lead: {
          status: { not: "CANCELLED" }
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: { customerName: true, contactNumber: true, serviceType: true, status: true, priority: true }
        }
      }
    });

    // De-duplicate: Keep only the LATEST scheduled visit for each lead in the queue
    const uniqueMeetings = meetings.reduce((acc: any[], current) => {
      if (!acc.find(m => m.leadId === current.leadId)) {
        acc.push(current);
      }
      return acc;
    }, []);

    uniqueMeetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(uniqueMeetings);
  } catch (error) {
    console.error("[MEETINGS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 });
  }
}
