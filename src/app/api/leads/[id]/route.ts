import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedStaff: { select: { name: true } },
        notes: { orderBy: { createdAt: "desc" } },
        followUps: { orderBy: { createdAt: "desc" } },
        meetings: { orderBy: { date: "asc" } },
      }
    });

    if (!lead) return new NextResponse("Lead not found", { status: 404 });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEAD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { ...body }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("[LEAD_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    await prisma.lead.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[LEAD_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
