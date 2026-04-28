import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { address, date, time, notes, status } = body;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        address: address !== undefined ? address : undefined,
        date: date ? new Date(date) : undefined,
        time: time !== undefined ? time : undefined,
        notes: notes !== undefined ? notes : undefined,
        status: status ? (status as any) : undefined,
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("[MEETING_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await prisma.meeting.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MEETING_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
