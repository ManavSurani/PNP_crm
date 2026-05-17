import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stats = await Promise.all([
      prisma.lead.findMany({
        where: { initialDealAmount: { not: null }, isCancelled: false } as any,
        include: {
          transactions: true,
          project: { select: { name: true } }
        },
      }),
      prisma.leadTransaction.findMany({
        where: { leadId: null },
        orderBy: { date: "desc" }
      }),
      prisma.leadTransaction.aggregate({
        where: { type: "EXPENSE" },
        _sum: { amount: true }
      })
    ]);

    const leads = stats[0] as any[];
    const globalTransactions = stats[1] as any[];

    let totalBusinessValue = 0;
    let totalReceived = 0;
    let totalLoss = 0;
    let totalAdjustments = 0;
    let totalDesignExpenses = 0;

    const customerFinancials = (leads as any[]).map(lead => {
      const dealAmount = lead.initialDealAmount || 0;
      const transactions = (lead.transactions || []) as any[];
      
      const received = transactions
        .filter(t => t.type === "RECEIVED")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const designCost = transactions
        .filter(t => t.source === "DESIGN" && t.type === "EXPENSE" && t.category !== "Adjustment")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const projectExpenses = transactions
        .filter(t => t.source !== "DESIGN" && t.type === "EXPENSE" && t.category !== "Adjustment")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const currentTotal = dealAmount + projectExpenses;
      
      // Explicit Losses (Adjustments)
      const adjustments = transactions
        .filter(t => t.type === "EXPENSE" && t.category === "Adjustment")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const remainingDue = Math.max(0, currentTotal - received);
      
      const hasFinalPayment = transactions.some(t => 
        t.type === "RECEIVED" && t.category === "Final Payment"
      );

      const unpaidLoss = hasFinalPayment && remainingDue > 0 ? remainingDue : 0;
      
      // Use the higher of the two to avoid double-counting if an adjustment was already recorded for the unpaid due
      const lossAmount = Math.max(unpaidLoss, adjustments);
      const isLoss = lossAmount > 0;

      // Profit = Deal - (All Project Expenses) - (Unpaid money we won't get)
      const profit = dealAmount - designCost - unpaidLoss;

      // Status Logic
      let status = "Pending";
      if (profit < 0) {
        status = "Loss";
      } else if (received >= currentTotal && currentTotal > 0) {
        status = "Paid";
      } else if (hasFinalPayment) {
        // If settled with final payment and profit is positive, mark as Paid
        status = "Paid";
      } else if (received > 0) {
        status = "Partial";
      } else {
        status = "Pending";
      }
      
      if (received > currentTotal && currentTotal > 0) status = "Overpaid";

      // Aggregate
      totalBusinessValue += dealAmount;
      totalReceived += received;
      totalLoss += lossAmount;
      totalAdjustments += adjustments;
      totalDesignExpenses += designCost;

      return {
        id: lead.id,
        customerName: lead.customerName,
        projectName: lead.project?.name || "N/A",
        dealAmount,
        totalExpenses: designCost,
        currentTotal,
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

    // Business Net Profit (Net Liquidity) = Gross Inflow - Total Burn (Design Costs + Realized Losses)
    const totalBurn = totalDesignExpenses + totalLoss;
    const globalProfit = totalReceived - totalBurn;
    
    const efficiency = totalReceived > 0 ? ((globalProfit / totalReceived) * 100).toFixed(1) : "0";


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
        totalPending: Math.max(0, totalBusinessValue - totalReceived - (totalLoss - totalAdjustments)),
        totalLoss,
        totalGlobalExpenses,
        globalProfit,
        totalDesignExpenses,
        totalBurn,
        efficiency
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
