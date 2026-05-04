import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const payments = await prisma.projectPayment.findMany({
      where: { projectQuotationId: id },
      orderBy: { paidOn: "desc" }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("[PROJECT_PAYMENTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { amount, paidOn, note } = await request.json();

    if (!amount || !paidOn) {
      return NextResponse.json({ error: "Amount and Date are required" }, { status: 400 });
    }

    const payment = await prisma.projectPayment.create({
      data: {
        projectQuotationId: id,
        amount: parseFloat(amount),
        paidOn: new Date(paidOn),
        note
      }
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("[PROJECT_PAYMENTS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
