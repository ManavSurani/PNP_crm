import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    orderBy: { lastActive: 'desc' },
    select: {
      id: true,
      sessionToken: true,
      userAgent: true,
      ipAddress: true,
      lastActive: true,
      expires: true
    }
  });

  return NextResponse.json(sessions);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");
  const deleteAllOthers = searchParams.get("all") === "true";

  if (deleteAllOthers) {
    // Delete all sessions for this user EXCEPT the current one
    await prisma.session.deleteMany({
      where: { 
        userId: session.user.id,
        NOT: { sessionToken: session.sessionToken as string }
      }
    });
    return NextResponse.json({ message: "All other sessions terminated" });
  }

  if (sessionId) {
    await prisma.session.delete({
      where: { id: sessionId, userId: session.user.id }
    });
    return NextResponse.json({ message: "Session terminated" });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
