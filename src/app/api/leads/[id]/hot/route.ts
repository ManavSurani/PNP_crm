import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { isHotLead } = await request.json();

    const updated = await (prisma.lead as any).update({
      where: { id },
      data: { isHotLead: Boolean(isHotLead) },
      select: { id: true, isHotLead: true },
    });

    return NextResponse.json({ isHotLead: updated.isHotLead });
  } catch (error) {
    console.error("[LEAD_HOT_PATCH]", error);
    return NextResponse.json({ error: "Failed to update hot lead status" }, { status: 500 });
  }
}
