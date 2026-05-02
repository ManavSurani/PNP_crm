import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stats = await Promise.all([
      prisma.lead.count(),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.leadTransaction.aggregate({ where: { type: "RECEIVED" }, _sum: { amount: true } }),
      prisma.leadTransaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
      prisma.followUp.count({
        where: {
          nextCallDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          completedDate: null,
        },
      }),
      prisma.lead.count({ where: { status: "NEW_INQUIRY" } }),
      prisma.lead.count({ where: { status: "FOLLOW_UP" } }),
      prisma.lead.count({ where: { status: "MEETING_SCHEDULED" } }),
      prisma.lead.count({ where: { status: "CANCELLED" } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.followUp.count({
        where: {
          nextCallDate: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
          completedDate: null,
        },
      }),
      prisma.meeting.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: "SCHEDULED",
        },
      }),
      prisma.lead.count({ 
        where: { 
          status: { in: ["FOLLOW_UP", "MEETING_SCHEDULED"] }
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
      })
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

    // Optimized Chart Data (Last 7 Days) - Fetch and aggregate in JS for SQLite stability
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const chartRaw = await prisma.lead.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

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

    return NextResponse.json({
      metrics: {
        totalLeads: stats[0],
        wonOrders: stats[1],
        totalRevenue,
        totalExpenses,
        netProfit,
        todayFollowUps: stats[4],
        overdueFollowUps: stats[10],
        todayMeetings: stats[11],
        interestedLeads: stats[12],
        newLeads: stats[5],
        followUpLeads: stats[6],
        meetingLeads: stats[7],
        cancelledLeads: stats[8],
        totalPending,
        topProjects,
        packageStats
      },
      chartData,
    });
  } catch (error) {
    console.error("[STATS_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
