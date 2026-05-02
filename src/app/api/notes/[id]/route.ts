import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  } catch (error) {
    console.error("[NOTE_PATCH]", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.leadNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTE_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
