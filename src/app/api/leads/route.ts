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

    const leads = await prisma.lead.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      include: {
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
      assignedStaffId
    } = body;

    if (!customerName || !contactNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
