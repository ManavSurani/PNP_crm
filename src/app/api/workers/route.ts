import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log(`[WORKERS_GET] Fetching workers for: ${session.user?.email}`);
    const workers = await prisma.worker.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json(workers);
  } catch (error: any) {
    console.error("[WORKERS_GET_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to fetch workers", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, phone, role, dailyRate } = body;

    if (!name || !phone) return NextResponse.json({ error: "Name and Phone are required" }, { status: 400 });

    const worker = await prisma.worker.create({
      data: {
        name,
        phone,
        type: role || "CARPENTER",
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
      }
    });

    return NextResponse.json(worker);
  } catch (error: any) {
    console.error("[WORKERS_POST_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to create worker record", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
