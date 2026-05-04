import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: { include: { milestones: { orderBy: { sequence: "asc" } } } } },
    });

    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    if (milestone.status !== "in_progress")
      return NextResponse.json({ error: "Only active milestones can be completed" }, { status: 400 });

    await prisma.milestone.update({ where: { id }, data: { status: "done", completedOn: today } });

    const pendingMilestones = milestone.project.milestones.filter(m => m.status === "pending");
    const nextMilestone = pendingMilestones.sort((a, b) => a.sequence - b.sequence)[0];

    let nextMs = null;
    if (nextMilestone) {
      nextMs = await prisma.milestone.update({
        where: { id: nextMilestone.id },
        data: { status: "in_progress", startedOn: today },
      });
    } else {
      await prisma.project.update({
        where: { id: milestone.projectId },
        data: { isCompleted: true, completedOn: today },
      });
    }

    const updatedMilestones = await prisma.milestone.findMany({
      where: { projectId: milestone.projectId },
      orderBy: { sequence: "asc" },
    });

    return NextResponse.json({ milestones: updatedMilestones, next_milestone: nextMs });
  } catch (error) {
    console.error("[MILESTONE_COMPLETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
