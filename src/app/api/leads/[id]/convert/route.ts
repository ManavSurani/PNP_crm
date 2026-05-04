import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const MILESTONES = [
  { sequence: 1, name: "Site survey & measurement",  description: "Initial measurements, photos, client brief" },
  { sequence: 2, name: "Design approval",             description: "3D renders, layouts approved by client" },
  { sequence: 3, name: "Quotation finalized",         description: "All vendor quotations locked and approved" },
  { sequence: 4, name: "Demolition & prep work",      description: "Old fixtures removed, walls prepped" },
  { sequence: 5, name: "Civil & structural work",     description: "Flooring, tiling, false ceiling, plastering" },
  { sequence: 6, name: "Electrical & plumbing",       description: "Wiring, switches, fixtures, pipe work" },
  { sequence: 7, name: "Finishing & handover",        description: "Paint, furniture, accessories, final walkthrough" },
];

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

      // Insert 7 milestones
      await prisma.milestone.createMany({
        data: MILESTONES.map((m) => ({
          projectId: project.id,
          sequence:  m.sequence,
          name:      m.name,
          description: m.description,
          status:    m.sequence === 1 ? "in_progress" : "pending",
          startedOn: m.sequence === 1 ? today : null,
        })),
      });
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("[LEAD_CONVERT_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
