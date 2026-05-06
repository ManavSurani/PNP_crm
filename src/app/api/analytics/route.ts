import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [leads, globalTransactions] = await Promise.all([
      prisma.lead.findMany({
        where: { initialDealAmount: { gt: 0 }, isCancelled: false } as any,
        include: {
          transactions: true,
          project: { select: { name: true } }
        },
      }),
      prisma.leadTransaction.findMany({
        where: { leadId: null },
        orderBy: { date: "desc" }
      })
    ]);

    let totalBusinessValue = 0;
    let totalReceived = 0;
    let totalLoss = 0;
    let totalDesignExpenses = 0;

    const customerFinancials = (leads as any[]).map(lead => {
      const dealAmount = lead.initialDealAmount || 0;
      const transactions = (lead.transactions || []) as any[];
      
      const received = transactions
        .filter(t => t.type === "RECEIVED")
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Use Design Expenses only (source="DESIGN", category="Design Expense" or "Adjustment")
      const designCost = transactions
        .filter(t => t.source === "DESIGN" && t.type === "EXPENSE" && (t.category === "Design Expense" || t.category === "Adjustment"))
        .reduce((sum, t) => sum + t.amount, 0);
      
      const profit = dealAmount - designCost;
      
      const remainingDue = Math.max(0, dealAmount - received);
      
      const hasFinalPayment = transactions.some(t => 
        t.type === "RECEIVED" && t.category === "Final Payment"
      );

      const isLoss = hasFinalPayment && remainingDue > 0;
      const lossAmount = isLoss ? remainingDue : 0;

      // Status Logic
      let status = "Pending";
      if (isLoss) status = "Loss";
      else if (received >= dealAmount && dealAmount > 0) status = "Paid";
      else if (received > 0) status = "Partial";
      else status = "Pending";

      if (received > dealAmount && dealAmount > 0) status = "Overpaid";

      // Aggregate
      totalBusinessValue += dealAmount;
      totalReceived += received;
      totalLoss += lossAmount;
      totalDesignExpenses += designCost;

      return {
        id: lead.id,
        customerName: lead.customerName,
        projectName: lead.project?.name || "N/A",
        dealAmount,
        totalExpenses: designCost,
        currentTotal: dealAmount,
        clientPaid: received,
        remainingDue,
        profit,
        lossAmount,
        status,
        isLoss
      };
    });

    const totalGlobalExpenses = globalTransactions
      .filter((t: any) => t.type === "EXPENSE")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Business Net Profit = Sum of all customer profits
    const globalProfit = customerFinancials.reduce((sum, f) => sum + f.profit, 0);


    // Activity Feed (Simplified: last 20 transactions across all)
    const allLeadTransactions = (leads as any[]).flatMap(l => (l.transactions || []).map((t: any) => ({ ...t, customerName: l.customerName })));
    const allTransactions = [
      ...allLeadTransactions,
      ...globalTransactions.map((t: any) => ({ ...t, customerName: "Business" }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 20);

    const activityFeed = allTransactions.map((t: any) => {
      let msg = "";
      if (t.type === "RECEIVED") {
        msg = `${t.category} received from ${t.customerName}`;
      } else {
        msg = `${t.category} expense added ${t.leadId ? `for ${t.customerName}` : "(Business)"}`;
      }
      return {
        id: t.id,
        message: msg,
        date: t.date,
        amount: t.amount,
        type: t.type
      };
    });

    return NextResponse.json({
      summary: {
        totalBusinessValue,
        totalReceived,
        totalPending: Math.max(0, totalBusinessValue - totalReceived - totalLoss),
        totalLoss,
        totalGlobalExpenses,
        globalProfit,
        totalDesignExpenses
      },
      customerFinancials,
      activityFeed,
      globalTransactions
    });
  } catch (error: any) {
    console.error("[ANALYTICS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
