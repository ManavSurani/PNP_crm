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

    const cleanContact = contactNumber.replace(/\D/g, "");
    if (!customerName || cleanContact.length !== 10) {
      return NextResponse.json({ error: "Valid 10-digit phone number required" }, { status: 400, headers: corsHeaders() });
    }

    const lead = await prisma.lead.create({
      data: {
        customerName,
        contactNumber: cleanContact,
        serviceType: serviceType || "OTHER",
        inquirySource: inquirySource || "WEBSITE",
        status: "NEW_INQUIRY",
        priority: "MEDIUM",
      }
    });

    // Optionally notify via Email or alert in dashboard

    return NextResponse.json(lead, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500, headers: corsHeaders() });
  }
}
