import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const workers = await prisma.worker.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(workers);
  } catch (error) {
    console.error("[WORKERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { name, phone, role, dailyRate } = body;

    if (!name || !phone) return new NextResponse("Missing fields", { status: 400 });

    const worker = await prisma.worker.create({
      data: {
        name,
        phone,
        role: role || "CARPENTER",
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
      }
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error("[WORKERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
