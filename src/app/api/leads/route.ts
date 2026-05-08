import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const leads = await (prisma.lead as any).findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        isCancelled: false
      },
      orderBy: { createdAt: "desc" },
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
        assignedStaff: {
          select: { id: true, name: true }
        },
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      customerName, 
      contactNumber, 
      alternateNumber, 
      fullAddress, 
      inquirySource, 
      serviceType, 
      priority,
      assignedStaffId,
      landmark,
      requirementDetails,
      siteLocation,
      preferredVisitTime
    } = body;

    const cleanContact = contactNumber ? contactNumber.replace(/\D/g, "") : "";
    if (cleanContact.length < 10) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }
    const cleanAlt = alternateNumber ? alternateNumber.replace(/\D/g, "") : null;

    // Standardized normalization for duplicate detection
    let normalizedPhone = cleanContact;
    if (cleanContact.length === 12 && cleanContact.startsWith("91")) {
      normalizedPhone = cleanContact.slice(2);
    } else if (cleanContact.length > 10) {
      normalizedPhone = cleanContact.slice(-10);
    }

    const lead = await prisma.lead.create({
      data: {
        customerName: customerName || "",
        contactNumber: cleanContact,
        normalizedPhone: normalizedPhone,
        alternateNumber: cleanAlt,
        fullAddress: fullAddress || null,
        inquirySource: inquirySource || "OTHER",
        serviceType: serviceType || "OTHER",
        priority: priority || "MEDIUM",
        assignedStaff: { connect: { id: assignedStaffId || session.user.id } },
        status: "NEW_INQUIRY",
        landmark: landmark || null,
        requirementDetails: requirementDetails || null,
        siteLocation: siteLocation || null,
        preferredVisitTime: preferredVisitTime || null,
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEADS_POST_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to create lead", 
      details: "A database error occurred." 
    }, { status: 500 });
  }
}
