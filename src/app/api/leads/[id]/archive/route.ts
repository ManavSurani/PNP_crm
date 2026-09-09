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

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id },
        select: { id: true, customerName: true, status: true }
      });

      if (!lead) throw new Error("Lead not found");

      const updated = await (tx.lead as any).update({
        where: { id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          isCancelled: false,
          cancelReason: null
        }
      });

      // Log note in timeline
      await tx.leadNote.create({
        data: {
          leadId: id,
          content: "📦 Lead moved to Passive Archive (Customer will call back)"
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
