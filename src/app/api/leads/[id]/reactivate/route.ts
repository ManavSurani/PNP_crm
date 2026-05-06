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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current lead state to determine restoration target
      const currentLead = await tx.lead.findUnique({
        where: { id },
        select: { status: true }
      });

      if (!currentLead) throw new Error("Lead not found");

      // 2. Determine new status: 
      // If it's a Customer (WON_ORDER), keep it. 
      // If it's a Lead (CANCELLED), move to FOLLOW_UP.
      const newStatus = currentLead.status === "WON_ORDER" ? "WON_ORDER" : "FOLLOW_UP";

      const lead = await tx.lead.update({
        where: { id },
        data: {
          status: newStatus as any,
          isCancelled: false,
          cancelReason: null,
          reactivatedAt: new Date(),
          reactivationNote: reactivationNote || null,
        },
      });

      // Log a note in the timeline
      await tx.leadNote.create({
        data: {
          leadId: id,
          content: `🔄 Lead Reactivated. ${reactivationNote ? `Reason: ${reactivationNote}` : ""}`,
        },
      });

      // 1. Clear ANY old pending follow-ups first to avoid duplicates
      await tx.followUp.deleteMany({
        where: {
          leadId: id,
          completedDate: null
        }
      });

      // 2. Create a fresh pending follow-up for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await tx.followUp.create({
        data: {
          leadId: id,
          nextCallDate: tomorrow,
          completedDate: null
        }
      });

      return lead;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[LEAD_REACTIVATE]", error);
    return NextResponse.json({ error: "Failed to reactivate lead" }, { status: 500 });
  }
}
