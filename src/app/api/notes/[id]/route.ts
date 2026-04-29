import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT /api/notes/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const note = await prisma.leadNote.update({
    where: { id },
    data: {
      ...(body.content !== undefined && { content: body.content }),
      ...(body.isCompleted !== undefined && { isCompleted: body.isCompleted }),
    },
  });
  return NextResponse.json(note);
}

// DELETE /api/notes/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.leadNote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
