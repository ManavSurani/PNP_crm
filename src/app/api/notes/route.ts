import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { leadId, content, fileUrl } = body;

    if (!leadId || !content) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        leadId,
        content,
        fileUrl: fileUrl || null
      }
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
