import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-ignore - leadFinancialLog is newly added to schema
    const logs = await prisma.leadFinancialLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[FINANCIAL_LOGS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch financial logs" }, { status: 500 });
  }
}
