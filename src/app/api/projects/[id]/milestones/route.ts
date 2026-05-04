import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/projects/[id]/milestones — add a new custom milestone
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId } = await params;
    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Milestone name is required" }, { status: 400 });
    }

    // Find the highest current sequence number
    const last = await prisma.milestone.findFirst({
      where: { projectId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });

    const nextSequence = (last?.sequence ?? 0) + 1;

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        sequence: nextSequence,
        name: name.trim(),
        description: description?.trim() || null,
        status: "pending",
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("[MILESTONE_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
