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
      recentLeadsData,
      recentFollowUpsData,
      recentMeetingsData,
      totalInquiries,
      activeFollowUps,
      completedSiteVisits,
      wonProjects,
      completedProjects,
      serviceData,
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
      // 1. System Pulse Data
      prisma.lead.findMany({ where: { createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) }, isCancelled: false }, select: { createdAt: true } }),
      prisma.followUp.findMany({ where: { createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) } }, select: { createdAt: true } }),
      prisma.meeting.findMany({ where: { createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) } }, select: { createdAt: true } }),
      
      // 2. Global Funnel Data
      prisma.lead.count({ where: { isCancelled: false } }),
      prisma.lead.count({ where: { status: "FOLLOW_UP", isCancelled: false } }),
      prisma.meeting.count({ where: { status: "COMPLETED" } }),
      prisma.lead.count({ where: { status: "WON_ORDER", isCancelled: false } }),
      prisma.lead.count({ where: { isProjectCompleted: true, isCancelled: false } }),

      // 3. Service Demand Data
      prisma.lead.findMany({ where: { createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) }, isCancelled: false }, select: { serviceType: true, createdAt: true } }),

      // Conversion: leads that reached WON_ORDER vs total
      prisma.lead.count({ where: { status: "WON_ORDER", isCancelled: false } }),
    ]);

    // Build 6-month key array
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-US", { month: "short" }) };
    });

    // 1. Process System Pulse
    const systemPulse = months.map(m => {
      const lCount = recentLeadsData.filter((x: any) => x.createdAt.toISOString().slice(0, 7) === m.key).length;
      const fCount = recentFollowUpsData.filter((x: any) => x.createdAt.toISOString().slice(0, 7) === m.key).length;
      const mCount = recentMeetingsData.filter((x: any) => x.createdAt.toISOString().slice(0, 7) === m.key).length;
      return { month: m.label, activity: lCount + fCount + mCount, leads: lCount, tasks: fCount + mCount };
    });

    // 2. Process Global Funnel
    const globalFunnel = [
      { stage: "Total Inquiries", value: totalInquiries, fill: "#3b82f6" },
      { stage: "Active Follow-ups", value: activeFollowUps, fill: "#f59e0b" },
      { stage: "Site Visits Done", value: completedSiteVisits, fill: "#8b5cf6" },
      { stage: "Won Projects", value: wonProjects, fill: "#10b981" },
      { stage: "Completed Work", value: completedProjects, fill: "#6366f1" },
    ];

    // 3. Process Service Demand
    const allServices = Array.from(new Set(serviceData.map((s: any) => s.serviceType)));
    const serviceDemand = months.map(m => {
      const monthData: any = { month: m.label };
      allServices.forEach(srv => {
        monthData[srv as string] = serviceData.filter((x: any) => x.createdAt.toISOString().slice(0, 7) === m.key && x.serviceType === srv).length;
      });
      return monthData;
    });

    const totalLeads = leadsByStatus.reduce((s: any, l: any) => s + l._count._all, 0);

    return NextResponse.json({
      alerts: {
        todayFollowUps,
        overdueFollowUps,
        todayMeetings,
      },
      charts: {
        systemPulse,
        globalFunnel,
        serviceDemand,
        allServices,
        leadsByStatus: leadsByStatus.map((l: any) => ({ status: l.status, count: l._count._all })),
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
