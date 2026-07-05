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
          lead: { isCancelled: false }
        },
        include: { lead: { select: { id: true, customerName: true, contactNumber: true, serviceType: true } } },
        orderBy: { nextCallDate: "asc" },
      }),
      // Overdue (past date, not completed)
      prisma.followUp.findMany({
        where: {
          nextCallDate: { lt: startOfDay },
          completedDate: null,
          lead: { isCancelled: false }
        },
        include: { lead: { select: { id: true, customerName: true, contactNumber: true, status: true } } },
        orderBy: { nextCallDate: "asc" },
        take: 10,
      }),
      // Today's meetings
      prisma.meeting.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          status: "SCHEDULED",
          lead: { isCancelled: false }
        },
        include: { lead: { select: { id: true, customerName: true, contactNumber: true } } },
        orderBy: { date: "asc" },
      }),
      // Recent 5 leads
      prisma.lead.findMany({
        where: { isCancelled: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, customerName: true, serviceType: true, status: true, createdAt: true },
      }),
      // Count by status
      prisma.lead.groupBy({ where: { isCancelled: false }, by: ["status"], _count: { _all: true } }),
      // Count by inquiry source
      prisma.lead.groupBy({ where: { isCancelled: false }, by: ["inquirySource"], _count: { _all: true }, orderBy: { _count: { inquirySource: "desc" } } }),
      // Last 5 years revenue - Unified via LeadTransaction
      prisma.leadTransaction.findMany({
        where: { 
          type: "RECEIVED",
          createdAt: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 4)) },
          lead: { isCancelled: false }
        },
        select: { amount: true, createdAt: true },
      }),
      // Conversion: leads that reached WON_ORDER vs total
      prisma.lead.count({ where: { status: "WON_ORDER", isCancelled: false } }),
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

    // Build 5-year revenue chart
    const currentYear = new Date().getFullYear();
    const last5Years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
    
    const revenueChartYears = last5Years.map(year => ({
      year: year.toString(),
      revenue: monthlyRevenue
        .filter(p => p.createdAt.getFullYear() === year)
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
        revenueChartYears,
        leadsByStatus: leadsByStatus.map(l => ({ status: l.status, count: l._count._all })),
        leadsBySource: leadsBySource.map(l => ({ source: l.inquirySource, count: l._count._all })),
      },
      recentLeads,
      conversionRate: totalLeads > 0 ? ((conversionData / totalLeads) * 100).toFixed(1) : "0",
    });
  } catch (error: any) {
    console.error("[REPORTS_GET_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to generate business intelligence reports", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
