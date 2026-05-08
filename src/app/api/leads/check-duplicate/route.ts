import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizePhone(phone: string) {
  if (!phone) return null;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // If it starts with 91 and has 12 digits, strip the 91
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.substring(2);
  }
  // Return last 10 digits for common Indian format matching
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ matches: [] });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ matches: [] });
  }

  try {
    const matches = await prisma.lead.findMany({
      where: {
        OR: [
          { contactNumber: { contains: normalized } },
          { normalizedPhone: normalized }
        ]
      },
      select: {
        id: true,
        customerName: true,
        status: true,
        isCancelled: true,
        serviceType: true
      }
    });

    const results = matches.map(m => {
      let location = "Lead Pipeline";
      if (m.isCancelled) {
        location = "Canceled Archive";
      } else if (m.status === "WON_ORDER") {
        location = "Customer Directory";
      } else if (m.status === "FOLLOW_UP") {
        location = "Follow-Up Queue";
      } else if (m.status === "MEETING_SCHEDULED") {
        location = "Site Visit Pipeline";
      }

      return {
        id: m.id,
        name: m.customerName,
        location,
        status: m.status,
        serviceType: m.serviceType
      };
    });

    return NextResponse.json({ matches: results });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return NextResponse.json({ error: "Failed to check duplicates" }, { status: 500 });
  }
}
