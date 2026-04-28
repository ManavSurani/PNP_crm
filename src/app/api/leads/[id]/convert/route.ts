import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const { id } = params;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: "WON_ORDER",
        isCancelled: false,
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("[LEAD_CONVERT_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
