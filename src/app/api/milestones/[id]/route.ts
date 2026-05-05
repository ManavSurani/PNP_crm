import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/milestones/[id] — full edit
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const { name, description, status, phase, progress, delayDays, delayReason, startedOn, completedOn } = body;

    const current = await prisma.milestone.findUnique({ where: { id }, select: { projectId: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(phase !== undefined && { phase }),
        ...(progress !== undefined && { progress }),
        ...(delayDays !== undefined && { delayDays }),
        ...(delayReason !== undefined && { delayReason }),
        ...(startedOn !== undefined && { startedOn: startedOn ? new Date(startedOn) : null }),
        ...(completedOn !== undefined && { completedOn: completedOn ? new Date(completedOn) : null }),
      },
    });

    const allMilestones = await prisma.milestone.findMany({
      where: { projectId: current.projectId },
      orderBy: { sequence: "asc" },
    });

    return NextResponse.json({ milestone: updated, milestones: allMilestones });
  } catch (error) {
    console.error("[MILESTONE_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// DELETE /api/milestones/[id] — remove milestone, recalculate sequences
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const current = await prisma.milestone.findUnique({ where: { id }, select: { projectId: true, status: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.milestone.delete({ where: { id } });

    // Recalculate sequence numbers
    const remaining = await prisma.milestone.findMany({
      where: { projectId: current.projectId },
      orderBy: { sequence: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await prisma.milestone.update({ where: { id: remaining[i].id }, data: { sequence: i + 1 } });
    }

    const updated = await prisma.milestone.findMany({
      where: { projectId: current.projectId },
      orderBy: { sequence: "asc" },
    });

    return NextResponse.json({ deleted_id: id, milestones: updated });
  } catch (error) {
    console.error("[MILESTONE_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
