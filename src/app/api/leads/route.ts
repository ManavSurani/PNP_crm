import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignedStaff: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("[LEADS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
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
      assignedStaffId
    } = body;

    if (!customerName || !contactNumber) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        customerName,
        contactNumber,
        alternateNumber: alternateNumber || null,
        fullAddress: fullAddress || null,
        inquirySource: inquirySource || "OTHER",
        serviceType: serviceType || "OTHER",
        priority: priority || "MEDIUM",
        assignedStaffId: assignedStaffId || session.user.id,
        status: "NEW_INQUIRY"
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEADS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
