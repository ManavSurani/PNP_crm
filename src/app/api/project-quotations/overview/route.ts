import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all project quotations grouped by customer
    const quotations = await prisma.projectQuotation.findMany({
      include: {
        customer: { select: { id: true, customerName: true } },
        payments: true,
      },
    });

    // Group by customer
    const customerMap = new Map<string, {
      id: string;
      customerName: string;
      totalQuoted: number;
      totalPaid: number;
      quotationCount: number;
    }>();

    for (const q of quotations) {
      const existing = customerMap.get(q.customerId);
      const qPaid = q.payments.reduce((s, p) => s + p.amount, 0);

      if (existing) {
        existing.totalQuoted += q.amount;
        existing.totalPaid += qPaid;
        existing.quotationCount += 1;
      } else {
        customerMap.set(q.customerId, {
          id: q.customer.id,
          customerName: q.customer.customerName,
          totalQuoted: q.amount,
          totalPaid: qPaid,
          quotationCount: 1,
        });
      }
    }

    const result = Array.from(customerMap.values()).map((c) => {
      const pendingAmount = c.totalQuoted - c.totalPaid;
      const status =
        c.totalPaid === 0
          ? "PENDING"
          : c.totalPaid >= c.totalQuoted
          ? "FULLY_PAID"
          : "PARTIAL";

      return { ...c, pendingAmount, status };
    });

    // Sort alphabetically
    result.sort((a, b) => a.customerName.localeCompare(b.customerName));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[QUOTATION_OVERVIEW_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
