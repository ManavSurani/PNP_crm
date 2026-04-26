import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Add CORS headers so the external HTML site can send POST requests
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // Change to specific URL in production
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, contactNumber, serviceType, inquirySource } = body;

    if (!customerName || !contactNumber) {
      return NextResponse.json({ error: "Name and contact required" }, { status: 400, headers: corsHeaders() });
    }

    const lead = await prisma.lead.create({
      data: {
        customerName,
        contactNumber,
        serviceType: serviceType || "OTHER",
        inquirySource: inquirySource || "WEBSITE",
        status: "NEW_INQUIRY",
        priority: "MEDIUM",
      }
    });

    // Optionally notify via Email or alert in dashboard

    return NextResponse.json(lead, { headers: corsHeaders() });
  } catch (error) {
    console.error("[PUBLIC_INQUIRY_POST]", error);
    return new NextResponse("Internal Error", { status: 500, headers: corsHeaders() });
  }
}
