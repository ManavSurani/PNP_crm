import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Force Next.js to reload this file and pick up the newly generated Prisma schema

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        contactNumber: true,
        alternateNumber: true,
        fullAddress: true,
        inquirySource: true,
        serviceType: true,
        priority: true,
        status: true,
        assignedStaffId: true,
        createdAt: true,
        updatedAt: true,
        landmark: true,
        requirementDetails: true,
        budgetRange: true,
        siteLocation: true,
        preferredVisitTime: true,
        assignedStaff: { select: { id: true, name: true } },
        followUps: { orderBy: { createdAt: "desc" } },
        meetings: { orderBy: { createdAt: "desc" } },
        transactions: { orderBy: { date: "desc" } },
        leadNotes: { orderBy: { createdAt: "desc" } },
      }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEAD_GET]", error);
    return NextResponse.json({ error: "Failed to fetch lead details" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    const { 
      customerName, contactNumber, alternateNumber, fullAddress, 
      landmark, requirementDetails, inquirySource, serviceType, 
      status, priority, assignedStaffId, budgetRange,
      siteLocation, preferredVisitTime
    } = body;

    const updateData: any = {};
    if (customerName !== undefined) updateData.customerName = customerName;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (alternateNumber !== undefined) updateData.alternateNumber = alternateNumber;
    if (fullAddress !== undefined) updateData.fullAddress = fullAddress;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (requirementDetails !== undefined) updateData.requirementDetails = requirementDetails;
    if (inquirySource !== undefined) updateData.inquirySource = inquirySource;
    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (siteLocation !== undefined) updateData.siteLocation = siteLocation;
    if (preferredVisitTime !== undefined) updateData.preferredVisitTime = preferredVisitTime;
    
    if (assignedStaffId !== undefined) {
      if (assignedStaffId) {
        updateData.assignedStaff = { connect: { id: assignedStaffId } };
      } else {
        updateData.assignedStaff = { disconnect: true };
      }
    }
    if (budgetRange !== undefined) updateData.budgetRange = budgetRange;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("[LEAD_PUT]", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.lead.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[LEAD_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
