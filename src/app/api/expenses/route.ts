import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: {
        order: { select: { orderNo: true, lead: { select: { customerName: true } } } }
      }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[EXPENSES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { category, amount, description, date, orderId } = body;

    if (!category || !amount || !description || !orderId) {
      return NextResponse.json({ error: "Missing required fields (category, amount, description, orderId)" }, { status: 400 });
    }

    // Standardized categories from Master Prompt
    const VALID_CATEGORIES = ["MATERIAL", "LABOUR", "TRANSPORT", "SITE", "OTHER"];
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        orderId,
        category,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date()
      },
      include: { order: true }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("[EXPENSES_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
