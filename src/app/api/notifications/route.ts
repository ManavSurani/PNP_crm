import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isTodayDate, isOverdueDate } from "@/lib/follow-up-utils";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (token !== "pnp_desktop_local_secret") {
      const session = await auth();
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1. Fetch Follow-Ups (Today + Overdue)
    const pendingFollowUps = await prisma.followUp.findMany({
      where: {
        completedDate: null,
        lead: { isCancelled: false, status: { not: "WON_ORDER" } }
      },
      include: {
        lead: {
          select: { customerName: true, priority: true }
        }
      }
    });

    // 2. Fetch Meetings (Today & Overdue)
    const pendingMeetings = await prisma.meeting.findMany({
      where: {
        status: "SCHEDULED",
        date: { lte: todayEnd },
        lead: { isCancelled: false, status: { not: "WON_ORDER" } }
      },
      include: {
        lead: { select: { customerName: true } }
      }
    });

    // 3. High Priority Leads (New/Interested/Follow-up)
    const highPriorityLeads = await prisma.lead.findMany({
      where: {
        priority: "HIGH",
        isCancelled: false,
        status: { in: ["NEW_INQUIRY", "FOLLOW_UP", "MEETING_SCHEDULED"] }
      },
      take: 5
    });

    // 4. Pending Milestones (Overdue or Due Today)
    const pendingMilestones = await prisma.quotationMilestone.findMany({
      where: {
        status: "PENDING",
        dueDate: { lte: todayEnd },
        quotation: { lead: { isCancelled: false } }
      },
      include: {
        quotation: { include: { lead: { select: { customerName: true, id: true } } } }
      }
    });

    // Transform to unified Notification format
    const notifications: any[] = [];

    // Map Follow-Ups
    pendingFollowUps.forEach(f => {
      const isOverdue = isOverdueDate(f.nextCallDate);
      const isToday = isTodayDate(f.nextCallDate);

      if (isOverdue || isToday) {
        notifications.push({
          id: `fu-${f.id}`,
          type: isOverdue ? "OVERDUE" : "FOLLOW_UP",
          title: isOverdue ? "Overdue Follow-Up" : "Today Follow-Up",
          description: `Call ${f.lead.customerName}${f.noteGiven ? `: ${f.noteGiven}` : ""}`,
          time: f.nextCallTime || "Not Specified",
          date: f.nextCallDate,
          priority: isOverdue ? "HIGH" : "MEDIUM",
          link: `/leads/${f.leadId}`,
          category: isOverdue ? "Overdue" : "Follow-Ups"
        });
      }
    });

    // Map Meetings
    pendingMeetings.forEach(m => {
      const isMeetingOverdue = m.date < todayStart;
      notifications.push({
        id: `meet-${m.id}`,
        type: isMeetingOverdue ? "OVERDUE" : "SITE_VISIT",
        title: isMeetingOverdue ? "Overdue Site Visit" : "Site Visit Today",
        description: `Visit ${m.lead.customerName} at ${m.address}`,
        time: m.time,
        date: m.date,
        priority: "HIGH",
        link: `/leads/${m.leadId}`,
        category: isMeetingOverdue ? "Overdue" : "Site Visits"
      });
    });

    // Map High Priority Leads
    highPriorityLeads.forEach(l => {
        // Only show if no pending follow-up today (to avoid duplication)
        const hasFUToday = notifications.some(n => n.link === `/leads/${l.id}`);
        if (!hasFUToday) {
            notifications.push({
                id: `lead-${l.id}`,
                type: "TASK",
                title: "High Priority Lead",
                description: `${l.customerName} needs attention`,
                time: "Urgent",
                date: l.updatedAt,
                priority: "HIGH",
                link: `/leads/${l.id}`,
                category: "All"
              });
        }
    });

    // Map Milestones
    pendingMilestones.forEach(ms => {
        notifications.push({
            id: `ms-${ms.id}`,
            type: "TASK",
            title: "Payment Pending",
            description: `${ms.quotation.lead.customerName}: ${ms.description}`,
            time: ms.dueDate ? `Due ${ms.dueDate.toLocaleDateString()}` : "Pending",
            date: ms.dueDate,
            priority: "MEDIUM",
            link: `/leads/${ms.quotation.lead.id}`,
            category: "All"
        });
    });

    // Sort by priority and date
    notifications.sort((a, b) => {
        if (a.priority === "HIGH" && b.priority !== "HIGH") return -1;
        if (a.priority !== "HIGH" && b.priority === "HIGH") return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
