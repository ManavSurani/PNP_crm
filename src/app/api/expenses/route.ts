import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[EXPENSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { category, amount, description, date } = body;

    if (!category || !amount || !description) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date()
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("[EXPENSES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
