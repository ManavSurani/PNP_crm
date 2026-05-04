import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get("include_counts") === "true";

    const fields = await prisma.projectField.findMany({
      orderBy: { name: "asc" },
      ...(includeCounts && {
        include: {
          _count: { select: { vendors: true, quotations: true } }
        }
      })
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error("[FIELDS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const field = await prisma.projectField.create({
      data: { name }
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("[FIELDS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
