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

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Optional body
    }

    const currentLead = await prisma.lead.findUnique({
      where: { id },
      select: { customerName: true },
    });

    if (!currentLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const providedName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const isCurrentlyUnnamed = !currentLead.customerName || !currentLead.customerName.trim() || currentLead.customerName.trim().toLowerCase() === "unnamed lead" || currentLead.customerName.trim().toLowerCase() === "unnamed";

    if (isCurrentlyUnnamed && (!providedName || providedName.toLowerCase() === "unnamed lead" || providedName.toLowerCase() === "unnamed")) {
      return NextResponse.json({ error: "A valid customer name is required before converting to a customer." }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateData: any = { status: "WON_ORDER", isCancelled: false };
    if (providedName) {
      updateData.customerName = providedName;
    }

    // Update lead status
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
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
