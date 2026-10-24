import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Add CORS headers so the external HTML site can send POST requests
function corsHeaders(request?: Request) {
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = request?.headers.get("origin") || "";
  const isAllowed = allowed.includes(origin);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };

  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const headers = corsHeaders(request);
  try {
    const body = await request.json();
    const { customerName, contactNumber, serviceType, inquirySource } = body;

    const cleanContact = contactNumber.replace(/\D/g, "");
    if (!customerName || cleanContact.length !== 10) {
      return NextResponse.json({ error: "Valid 10-digit phone number required" }, { status: 400, headers });
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

    return NextResponse.json(lead, { headers });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500, headers });
  }
}
