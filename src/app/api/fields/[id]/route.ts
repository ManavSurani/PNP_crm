import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canDelete } from "@/lib/rbac";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { name } = await request.json();

    const field = await prisma.projectField.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("[FIELD_PATCH]", error);
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
    if (!canDelete(session.user.role))
      return NextResponse.json({ error: "Forbidden: Insufficient role" }, { status: 403 });

    const { id } = await params;

    await prisma.projectField.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FIELD_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
