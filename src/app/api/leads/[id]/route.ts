import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canDelete } from "@/lib/rbac";

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
        referenceName: true,
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
        project: { 
          // @ts-ignore - name field exists in schema but IDE lag
          select: { id: true, name: true } 
        },
        // @ts-ignore - newly added
        initialDealAmount: true,
        // @ts-ignore - newly added
        // @ts-ignore - newly added
        initialDealNotes: true,
        isCancelled: true,
        cancelReason: true,
        // @ts-ignore - newly added
        isFinanciallyClosed: true,
        // @ts-ignore - newly added
        isProjectCompleted: true,
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
      customerName, projectName, contactNumber, alternateNumber, fullAddress, 
      landmark, requirementDetails, inquirySource, referenceName, serviceType, 
      status, priority, assignedStaffId, budgetRange,
      siteLocation, preferredVisitTime, initialDealAmount, initialDealNotes, isCancelled, cancelReason
    } = body;

    const updateData: any = {};
    if (customerName !== undefined) updateData.customerName = customerName;
    if (contactNumber !== undefined) {
      updateData.contactNumber = contactNumber.replace(/\D/g, "");
      
      // Standardized normalization for duplicate detection
      let normalized = updateData.contactNumber;
      if (normalized.length === 12 && normalized.startsWith("91")) {
        normalized = normalized.slice(2);
      } else if (normalized.length > 10) {
        normalized = normalized.slice(-10);
      }
      updateData.normalizedPhone = normalized;
    }
    if (alternateNumber !== undefined) updateData.alternateNumber = alternateNumber;
    if (fullAddress !== undefined) updateData.fullAddress = fullAddress;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (requirementDetails !== undefined) updateData.requirementDetails = requirementDetails;
    if (inquirySource !== undefined) {
      updateData.inquirySource = inquirySource;
      if (inquirySource !== "THROUGH_REFERENCE") {
        updateData.referenceName = null;
      }
    }
    if (referenceName !== undefined) {
      if (updateData.inquirySource === "THROUGH_REFERENCE" || inquirySource === undefined) {
        updateData.referenceName = referenceName || null;
      }
    }
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

    // Handle Project Name Update
    if (projectName !== undefined) {
      try {
        await prisma.project.update({
          where: { customerId: id },
          // @ts-ignore - name field exists in schema but IDE lag
          data: { name: projectName }
        });
      } catch (e) {
        // Project might not exist yet if not converted
        console.warn("Could not update project name, project might not exist:", e);
      }
    }

    // Handle Financial Fields
    if (initialDealAmount !== undefined) {
      updateData.initialDealAmount = initialDealAmount === null ? null : parseFloat(initialDealAmount);
      
      // Log the update
      // @ts-ignore - newly added
      const oldLead = await prisma.lead.findUnique({ where: { id }, select: { initialDealAmount: true } });
      // @ts-ignore - newly added
      if (oldLead && oldLead.initialDealAmount !== parseFloat(initialDealAmount)) {
        const detailsText = oldLead.initialDealAmount !== null && oldLead.initialDealAmount !== undefined
          ? `Deal amount updated from ₹${oldLead.initialDealAmount.toLocaleString()} to ₹${parseFloat(initialDealAmount).toLocaleString()}`
          : `Project deal initialized — ₹${parseFloat(initialDealAmount).toLocaleString()}`;
        // @ts-ignore - newly added
        await prisma.leadFinancialLog.create({
          data: {
            leadId: id,
            action: "DEAL_UPDATE",
            // @ts-ignore - newly added
            details: detailsText,
            amount: parseFloat(initialDealAmount)
          }
        });
      }
    }
    if (initialDealNotes !== undefined) updateData.initialDealNotes = initialDealNotes;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        project: { 
          // @ts-ignore - name field exists in schema but IDE lag
          select: { id: true, name: true } 
        }
      }
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
  const { searchParams } = new URL(request.url);
  const isPermanent = searchParams.get("permanent") === "true";

  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canDelete(session.user.role))
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });

    // Check if the lead exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, isCancelled: true }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (isPermanent) {
      // MODE 1: TOTAL ERASURE (No History, No Analytics)
      await prisma.lead.delete({
        where: { id }
      });
      return new NextResponse(null, { status: 204 });
    }

    if (lead.isCancelled) {
      // MODE 2: WIPE FROM ARCHIVE (Keep History via AuditLog)
      await prisma.lead.delete({
        where: { id }
      });

      // Log the wipe for business analytics history
      await prisma.auditLog.create({
        data: {
          action: "WIPE_DATA",
          entity: "Lead",
          entityId: id,
          oldValue: "CANCELLED",
          userId: session.user.id
        }
      });

      return new NextResponse(null, { status: 204 });
    } else {
      // MODE 3: SOFT ARCHIVAL (Move to Archive)
      await prisma.lead.update({
        where: { id },
        data: {
          isCancelled: true,
          status: "CANCELLED",
          cancelReason: "Lead Archived from Pipeline"
        }
      });
      return NextResponse.json({ message: "Lead moved to archive" });
    }
  } catch (error) {
    console.error("[LEAD_DELETE]", error);
    return NextResponse.json({ error: "Failed to process lead deletion" }, { status: 500 });
  }
}
