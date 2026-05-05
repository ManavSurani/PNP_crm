import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Removed static MILESTONES array as per new requirements

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const { id } = params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update lead status
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status: "WON_ORDER", isCancelled: false },
    });

    // Check if a project already exists (idempotent)
    const existingProject = await prisma.project.findUnique({ where: { customerId: id } });

    if (!existingProject) {
      // Create project
      const project = await prisma.project.create({
        data: {
          customerId: id,
          startedOn: today,
        },
      });

      // Create first milestone
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          sequence:  1,
          name:      "Project Started",
          description: "Project officially started",
          status:    "done",
          startedOn: today,
          completedOn: today,
        }
      });
    }

    return NextResponse.json(updatedLead);
  } catch (error: any) {
    console.error("[LEAD_CONVERT_POST]", error);
    require("fs").appendFileSync("c:\\Vs\\pnp_crm\\convert_error.log", String(error.stack || error) + "\\n");
    return NextResponse.json({ error: "Internal Error", details: "A database error occurred during conversion. Please check server logs." }, { status: 500 });
  }
}
