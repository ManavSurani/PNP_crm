import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const logs = await prisma.executionLog.findMany({
      where: { projectId: id },
      orderBy: { loggedOn: "desc" },
      take: limit,
      include: { logger: { select: { id: true, name: true } } },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[LOGS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { log_text, log_type } = await req.json();

    if (!log_text?.trim()) {
      return NextResponse.json({ error: "Log text is required" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.executionLog.create({
      data: {
        projectId: id,
        logText:   log_text.trim(),
        logType:   log_type || "update",
        loggedOn:  today,
        loggedBy:  session.user.id,
      },
      include: { logger: { select: { id: true, name: true } } },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("[LOGS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
