import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/notes?leadId=xxx
export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
  const notes = await prisma.leadNote.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

// POST /api/notes
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId, content, isCompleted } = body;
  if (!leadId || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const note = await prisma.leadNote.create({
    data: { leadId, content, isCompleted: isCompleted ?? false },
  });
  return NextResponse.json(note, { status: 201 });
}
