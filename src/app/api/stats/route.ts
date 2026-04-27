import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const [
      totalLeads,
      wonOrders,
      totalRevenueData,
      totalExpensesData,
      todayFollowUpsCount,
      newLeads,
      followUpLeads,
      meetingLeads,
      cancelledLeads,
      totalPendingData,
      overdueFollowUpsCount,
      todayMeetingsCount,
      interestedLeadsCount,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
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
    ]);

    const totalRevenue = totalRevenueData._sum.amount || 0;
    const totalExpenses = totalExpensesData._sum.amount || 0;
    const netProfit = totalRevenue - totalExpenses;
    const totalPaid = totalRevenue;
    const totalOrderValue = totalPendingData._sum.totalAmount || 0;
    const totalPending = Math.max(0, totalOrderValue - totalPaid);

    // Last 7 Days Chart Data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const recentLeadsActivity = await prisma.lead.findMany({
      where: {
        createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
      },
      select: { createdAt: true },
    });

    const chartData = last7Days.map(dateStr => {
      const count = recentLeadsActivity.filter(
        (l: any) => l.createdAt.toISOString().split("T")[0] === dateStr
      ).length;
      return { date: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }), leads: count };
    });

    return NextResponse.json({
      metrics: {
        totalLeads,
        wonOrders,
        totalRevenue,
        totalExpenses,
        netProfit,
        todayFollowUps: todayFollowUpsCount,
        overdueFollowUps: overdueFollowUpsCount,
        todayMeetings: todayMeetingsCount,
        interestedLeads: interestedLeadsCount,
        newLeads,
        followUpLeads,
        meetingLeads,
        cancelledLeads,
        totalPending,
      },
      chartData,
    });
  } catch (error) {
    console.error("[STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
