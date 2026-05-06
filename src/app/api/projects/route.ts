import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

function computeStats(milestones: any[], startedOn: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalMilestones = milestones.length;
  const doneCount = milestones.filter((m) => m.status === "done").length;
  
  if (totalMilestones === 0) {
    return { 
      progressPct: 0, 
      doneCount: 0, 
      daysActive: 0, 
      estCompletion: "No milestones", 
      estCompletionOverdue: false, 
      currentMilestone: null 
    };
  }

  const progressPct = Math.round((doneCount / totalMilestones) * 100);
  const start = new Date(startedOn);
  start.setHours(0,0,0,0);
  
  const daysActive = Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  let estCompletion: string | null = "Calculating...";
  let estCompletionOverdue = false;

  if (doneCount > 0) {
    const avgDaysPerMilestone = daysActive / doneCount;
    const remaining = totalMilestones - doneCount;
    const estDate = new Date(today.getTime() + avgDaysPerMilestone * remaining * 24 * 60 * 60 * 1000);

    if (estDate < today && remaining > 0) {
      estCompletion = "Overdue";
      estCompletionOverdue = true;
    } else if (remaining === 0) {
      estCompletion = "Completed";
    } else {
      estCompletion = estDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      });
    }
  }

  const currentMilestone = milestones.find((m) => m.status === "in_progress") || null;

  return { progressPct, doneCount, daysActive, estCompletion, estCompletionOverdue, currentMilestone };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customerId = req.nextUrl.searchParams.get("customer_id");
    if (!customerId) return NextResponse.json({ error: "customer_id required" }, { status: 400 });

    const project = await prisma.project.findUnique({
      where: { customerId },
      include: {
        milestones: { orderBy: { sequence: "asc" } },
      },
    });

    if (!project) return NextResponse.json(null);

    const stats = computeStats(project.milestones, project.startedOn);

    return NextResponse.json({ ...project, stats });
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
