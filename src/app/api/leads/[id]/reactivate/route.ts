import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let reactivationNote = null;
    try {
      if (request.headers.get("content-length") !== "0") {
        const body = await request.json();
        reactivationNote = body.reactivationNote || null;
      }
    } catch (e) {
      // Body might be empty or invalid JSON
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status: "FOLLOW_UP",
        isCancelled: false,
        cancelReason: null,
        reactivatedAt: new Date(),
        reactivationNote: reactivationNote || null,
      },
    });

    // Log a note in the timeline
    await prisma.leadNote.create({
      data: {
        leadId: id,
        content: `🔄 Lead Reactivated. ${reactivationNote ? `Reason: ${reactivationNote}` : ""}`,
      },
    });

    // Create a pending follow-up for tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await prisma.followUp.create({
      data: {
        leadId: id,
        nextCallDate: tomorrow,
        completedDate: null
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEAD_REACTIVATE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
