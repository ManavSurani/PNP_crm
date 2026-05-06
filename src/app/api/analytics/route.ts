import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [leads, globalTransactions] = await Promise.all([
      prisma.lead.findMany({
        where: { initialDealAmount: { gt: 0 } } as any,
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
    let totalDesignExpenses = 0;
    let totalProjectExpenses = 0;
    let totalLoss = 0;

    const customerFinancials = (leads as any[]).map(lead => {
      const dealAmount = lead.initialDealAmount || 0;
      const transactions = (lead.transactions || []) as any[];
      
      const received = transactions
        .filter(t => t.type === "RECEIVED")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const designExp = transactions
        .filter(t => t.source === "DESIGN" && t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const projectExp = transactions
        .filter(t => t.source === "GENERAL" && t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = designExp + projectExp;
      const remainingDue = Math.max(0, dealAmount - received);
      
      const hasFinalPayment = transactions.some(t => 
        t.type === "RECEIVED" && t.category === "Final Payment"
      );

      const isLoss = hasFinalPayment && remainingDue > 0;
      const lossAmount = isLoss ? remainingDue : 0;
      
      const profit = dealAmount - totalExpenses;

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
      totalDesignExpenses += designExp;
      totalProjectExpenses += projectExp;
      totalLoss += lossAmount;

      return {
        id: lead.id,
        customerName: lead.customerName,
        projectName: lead.project?.name || "N/A",
        dealAmount,
        totalExpenses,
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

    // Global Profit = Total Deal Value - All Design Expenses - All Project Expenses - All Business Expenses (Global) - All Loss Amounts
    const globalProfit = totalBusinessValue - totalDesignExpenses - totalProjectExpenses - totalGlobalExpenses - totalLoss;

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
        totalDesignExpenses,
        totalProjectExpenses
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
