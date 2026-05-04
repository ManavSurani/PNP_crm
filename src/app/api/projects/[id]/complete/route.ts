import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/projects/[id]/complete — mark entire project as done
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const today = new Date(); today.setHours(0,0,0,0);

    // Mark all milestones done
    await prisma.milestone.updateMany({
      where: { projectId: id, status: { not: "done" } },
      data: { status: "done", completedOn: today },
    });

    // Mark project complete
    const project = await prisma.project.update({
      where: { id },
      data: { isCompleted: true, completedOn: today },
    });

    const milestones = await prisma.milestone.findMany({
      where: { projectId: id },
      orderBy: { sequence: "asc" },
    });

    return NextResponse.json({ project, milestones });
  } catch (error) {
    console.error("[PROJECT_COMPLETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
