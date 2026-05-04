import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer_id");

    if (!customerId) return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });

    const quotations = await prisma.projectQuotation.findMany({
      where: { customerId },
      include: {
        field: true,
        vendor: true,
        payments: true
      },
      orderBy: { priority: "asc" }
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("[PROJECT_QUOTATIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { customerId, fieldId, vendorId, amount } = await request.json();
    if (!customerId || !fieldId || !vendorId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get current max priority
    const maxPriority = await prisma.projectQuotation.aggregate({
      where: { customerId },
      _max: { priority: true }
    });

    const quotation = await prisma.projectQuotation.create({
      data: {
        customerId,
        fieldId,
        vendorId,
        amount: parseFloat(amount),
        priority: (maxPriority._max.priority || 0) + 1
      },
      include: {
        field: true,
        vendor: true,
        payments: true
      }
    });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("[PROJECT_QUOTATIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { customerId, type } = body;

    if (!customerId) return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });

    if (type === "reorder") {
      const { orderedIds } = body;
      await Promise.all(
        orderedIds.map((id: string, index: number) =>
          prisma.projectQuotation.update({
            where: { id },
            data: { priority: index + 1 }
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    if (type === "lock") {
      const { locked } = body;
      await prisma.projectQuotation.updateMany({
        where: { customerId },
        data: { isPriorityLocked: locked }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid PATCH type" }, { status: 400 });
  } catch (error) {
    console.error("[PROJECT_QUOTATIONS_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
