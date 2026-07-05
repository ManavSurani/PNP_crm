import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const stats = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "WON_ORDER", isCancelled: false, 
        // @ts-ignore
        isProjectCompleted: false } }),
      prisma.leadTransaction.aggregate({ where: { type: "RECEIVED" }, _sum: { amount: true } }),
      prisma.leadTransaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
      prisma.followUp.count({
        where: {
          nextCallDate: {
            gte: todayStart,
            lte: todayEnd,
          },
          completedDate: null,
          lead: { isCancelled: false, status: { not: "WON_ORDER" } }
        },
      }),
      prisma.lead.count({ where: { status: "NEW_INQUIRY", isCancelled: false } }),
      prisma.lead.count({ where: { status: "FOLLOW_UP", isCancelled: false } }),
      prisma.lead.count({ where: { status: "MEETING_SCHEDULED", isCancelled: false } }),
      prisma.lead.count({ where: { isCancelled: true } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.followUp.count({
        where: {
          nextCallDate: { lt: todayStart },
          completedDate: null,
          lead: { isCancelled: false, status: { not: "WON_ORDER" } }
        },
      }),
      prisma.meeting.count({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: "SCHEDULED",
          lead: { isCancelled: false }
        },
      }),
      prisma.lead.count({ 
        where: { 
          status: { in: ["FOLLOW_UP", "MEETING_SCHEDULED"] },
          isCancelled: false
        } 
      }),
      // Most Profitable Projects - Unified via Lead Transactions
      prisma.order.findMany({
        take: 5,
        orderBy: { totalAmount: 'desc' },
        include: { 
          lead: { 
            select: { 
              customerName: true,
              transactions: { select: { amount: true, type: true } }
            } 
          }
        }
      }),
      // Package Popularity
      prisma.order.groupBy({
        by: ['packageType'],
        _count: { id: true }
      }),
      prisma.meeting.findMany({
        where: {
          status: "SCHEDULED",
          lead: { isCancelled: false, status: { not: "WON_ORDER" } }
        },
        distinct: ['leadId'],
        select: { id: true }
      }),
      prisma.followUp.count({
        where: {
          nextCallDate: { gt: todayEnd },
          completedDate: null,
          lead: { isCancelled: false, status: { not: "WON_ORDER" } }
        },
      }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.auditLog.count({ where: { action: "WIPE_DATA", entity: "Lead" } }),
      prisma.auditLog.count({ where: { action: "WIPE_DATA", entity: "Order" } }),
      // [21] NEW: Completed Projects
      prisma.lead.count({ where: { status: "WON_ORDER", isCancelled: false, 
        // @ts-ignore
        isProjectCompleted: true } }),
      // [21] NEW: Current Leads in Pipeline
      prisma.lead.count({ where: { status: { not: "WON_ORDER" }, isCancelled: false } }),
    ]);

    const topProjects = (stats[13] as any[] || []).map((o: any) => {
      const revenue = o.lead.transactions
        .filter((t: any) => t.type === "RECEIVED")
        .reduce((s: number, p: any) => s + p.amount, 0);
      const expenses = o.lead.transactions
        .filter((t: any) => t.type === "EXPENSE")
        .reduce((s: number, e: any) => s + e.amount, 0);
      const profit = revenue - expenses;
      return {
        name: o.lead.customerName,
        orderNo: o.orderNo,
        revenue,
        expenses,
        profit,
        margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0"
      };
    }).sort((a: any, b: any) => b.profit - a.profit);

    const packageStats = (stats[14] as unknown as any[] || []).map((p: any) => ({
      name: p.packageType?.replace(/_/g, " ") || "OTHER",
      count: p._count.id
    }));

    const totalRevenue = (stats[2] as any)._sum.amount || 0;
    const totalExpenses = (stats[3] as any)._sum.amount || 0;
    const netProfit = totalRevenue - totalExpenses;
    const totalOrderValue = (stats[9] as any)._sum.totalAmount || 0;
    const totalPending = Math.max(0, totalOrderValue - totalRevenue);

    // Optimized Chart Data (Daily, Monthly, Yearly)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 4);
    fiveYearsAgo.setMonth(0, 1);
    fiveYearsAgo.setHours(0, 0, 0, 0);

    const chartRaw = await prisma.lead.findMany({
      where: { createdAt: { gte: fiveYearsAgo } },
      select: { createdAt: true }
    });

    // 1. Last 7 Days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const chartData = last7Days.map(dateStr => {
      const count = chartRaw.filter(r => 
        r.createdAt.toISOString().split("T")[0] === dateStr
      ).length;
      return { 
        date: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }), 
        leads: count 
      };
    });

    // 2. Last 12 Months
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-US", { month: "short" }) };
    });

    const chartDataMonths = last12Months.map(m => {
      const count = chartRaw.filter(r => r.createdAt.toISOString().slice(0, 7) === m.key).length;
      return { date: m.label, leads: count };
    });

    // 3. Last 5 Years
    const currentYear = new Date().getFullYear();
    const last5Years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
    
    const chartDataYears = last5Years.map(year => {
      const count = chartRaw.filter(r => r.createdAt.getFullYear() === year).length;
      return { date: year.toString(), leads: count };
    });

    return NextResponse.json({
      metrics: {
        totalLeads: stats[0] + stats[18],
        wonOrders: stats[1],
        totalRevenue,
        totalExpenses,
        netProfit,
        todayFollowUps: stats[4],
        overdueFollowUps: stats[10],
        upcomingFollowUps: stats[16],
        todayMeetings: stats[11],
        interestedLeads: stats[12],
        newLeads: stats[5],
        followUpLeads: stats[6],
        meetingLeads: stats[7],
        cancelledLeads: stats[8],
        canceledArchive: stats[8] + stats[17] + stats[18] + stats[19],
        completedProjects: stats[20],
        totalPending,
        totalMeetings: (stats[15] as any[]).length,
        currentLeads: stats[21],
        topProjects,
        packageStats
      },
      chartData,
      chartDataMonths,
      chartDataYears,
    });
  } catch (error: any) {
    console.error("[STATS_API_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to compile dashboard statistics", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
