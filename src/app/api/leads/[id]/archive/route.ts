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

    let archiveReason: string | undefined;
    let tentativeDate: string | undefined;
    try {
      const body = await request.json();
      archiveReason = body?.archiveReason;
      tentativeDate = body?.tentativeDate;
    } catch {
      // Body may be empty
    }

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id },
        select: { id: true, customerName: true, status: true }
      });

      if (!lead) throw new Error("Lead not found");

      const finalReason = archiveReason || "Client Will Call";
      const finalTentative = tentativeDate ? new Date(tentativeDate) : null;

      const updated = await tx.lead.update({
        where: { id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          archiveReason: finalReason,
          tentativeDate: finalTentative,
          isCancelled: false,
          cancelReason: null
        }
      });

      // Format optional timeline note
      const dateFormatted = finalTentative 
        ? ` (Expected: ${finalTentative.toLocaleString("default", { month: "short", year: "numeric" })})` 
        : "";

      // Log note in timeline
      await tx.leadNote.create({
        data: {
          leadId: id,
          content: `📦 Lead moved to Passive Archive — Reason: ${finalReason}${dateFormatted}`
        }
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[LEAD_ARCHIVE_POST]", error);
    return NextResponse.json({ error: "Failed to archive lead" }, { status: 500 });
  }
}
