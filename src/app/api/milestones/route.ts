import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { project_id, name, description, status, progress, delayDays, delayReason, startedOn, completedOn } = await req.json();

    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (!project_id)   return NextResponse.json({ error: "project_id required" }, { status: 400 });

    // If adding as active — demote existing active
    if (status === "in_progress") {
      await prisma.milestone.updateMany({
        where: { projectId: project_id, status: "in_progress" },
        data: { status: "pending" },
      });
    }

    const last = await prisma.milestone.findFirst({
      where: { projectId: project_id },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    const nextSeq = (last?.sequence ?? 0) + 1;
    const today = new Date(); today.setHours(0,0,0,0);

    const newMs = await prisma.milestone.create({
      data: {
        projectId:   project_id,
        sequence:    nextSeq,
        name:        name.trim(),
        description: description?.trim() || null,
        status:      status || "pending",
        progress:    progress ?? null,
        delayDays:   delayDays ?? null,
        delayReason: delayReason?.trim() || null,
        startedOn:   startedOn ? new Date(startedOn) : (status === "in_progress" ? today : null),
        completedOn: completedOn ? new Date(completedOn) : (status === "done" ? today : null),
      },
    });

    const allMilestones = await prisma.milestone.findMany({
      where: { projectId: project_id },
      orderBy: { sequence: "asc" },
    });

    return NextResponse.json({ milestone: newMs, milestones: allMilestones }, { status: 201 });
  } catch (error) {
    console.error("[MILESTONE_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
