import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const todayStr = new Date().toISOString().split("T")[0];

    const [
      todayFollowUps,
      overdueFollowUps,
      todayMeetings,
      recentLeads,
      leadsByStatus,
      leadsBySource,
      monthlyRevenue,
      conversionData,
    ] = await Promise.all([
      // Today's pending follow-ups
      prisma.followUp.findMany({
        where: {
          nextCallDate: { gte: startOfDay, lte: endOfDay },
          completedDate: null,
        },
        include: { lead: { select: { customerName: true, contactNumber: true, serviceType: true } } },
        orderBy: { nextCallDate: "asc" },
      }),
      // Overdue (past date, not completed)
      prisma.followUp.findMany({
        where: {
          nextCallDate: { lt: startOfDay },
          completedDate: null,
        },
        include: { lead: { select: { customerName: true, contactNumber: true, status: true } } },
        orderBy: { nextCallDate: "asc" },
        take: 10,
      }),
      // Today's meetings
      prisma.meeting.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          status: "SCHEDULED",
        },
        include: { lead: { select: { customerName: true, contactNumber: true } } },
        orderBy: { date: "asc" },
      }),
      // Recent 5 leads
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, customerName: true, serviceType: true, status: true, createdAt: true },
      }),
      // Count by status
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      // Count by inquiry source
      prisma.lead.groupBy({ by: ["inquirySource"], _count: { _all: true }, orderBy: { _count: { inquirySource: "desc" } } }),
      // Last 6 months revenue - Unified via LeadTransaction
      prisma.leadTransaction.findMany({
        where: { 
          type: "RECEIVED",
          createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) } 
        },
        select: { amount: true, createdAt: true },
      }),
      // Conversion: leads that reached WON_ORDER vs total
      prisma.lead.count({ where: { status: "WON_ORDER" } }),
    ]);

    // Build 6-month revenue chart
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-US", { month: "short" }) };
    });

    const revenueChart = months.map(m => ({
      month: m.label,
      revenue: monthlyRevenue
        .filter(p => p.createdAt.toISOString().slice(0, 7) === m.key)
        .reduce((s, p) => s + p.amount, 0),
    }));

    const totalLeads = leadsByStatus.reduce((s, l) => s + l._count._all, 0);

    return NextResponse.json({
      alerts: {
        todayFollowUps,
        overdueFollowUps,
        todayMeetings,
      },
      charts: {
        revenueChart,
        leadsByStatus: leadsByStatus.map(l => ({ status: l.status, count: l._count._all })),
        leadsBySource: leadsBySource.map(l => ({ source: l.inquirySource, count: l._count._all })),
      },
      recentLeads,
      conversionRate: totalLeads > 0 ? ((conversionData / totalLeads) * 100).toFixed(1) : "0",
    });
  } catch (error) {
    console.error("[REPORTS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
