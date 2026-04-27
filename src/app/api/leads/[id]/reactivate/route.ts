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
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { reactivationNote } = body;

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
    await prisma.note.create({
      data: {
        leadId: id,
        content: `🔄 Lead Reactivated. ${reactivationNote ? `Reason: ${reactivationNote}` : ""}`,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEAD_REACTIVATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
