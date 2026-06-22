# Complete Project Modifications (Full Code)

### 1. `G:\pnp_crm\pnp_crm\desktop-notifier.ps1`
```powershell
# desktop-notifier.ps1
# Background script to update the desktop shortcut with live notification counts and badges

$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ApiUrl = "http://localhost:3000/api/notifications?token=pnp_desktop_local_secret"
$WshShell = New-Object -ComObject WScript.Shell
$AppDir = "G:\pnp_crm\pnp_crm"
$BadgesDir = Join-Path $AppDir "public\badges_v2"

# C# Helper for SHChangeNotify to refresh desktop icons
$Source = @"
using System;
using System.Runtime.InteropServices;
public class NativeMethods {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
"@
Add-Type -TypeDefinition $Source

function Refresh-Desktop {
    [NativeMethods]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
}

function Get-CrmShortcut {
    $AllShortcuts = Get-ChildItem -Path $DesktopPath -Filter "*.lnk"
    foreach ($file in $AllShortcuts) {
        try {
            $tempShortcut = $WshShell.CreateShortcut($file.FullName)
            if ($tempShortcut.Arguments -like "*launch-pnp.vbs*") {
                return $file.FullName
            }
        } catch {}
    }
    return $null
}

# Initial check
if ($null -eq (Get-CrmShortcut)) {
    exit
}

while ($true) {
    try {
        # Fetch notifications
        $response = Invoke-RestMethod -Uri $ApiUrl -TimeoutSec 10 -ErrorAction Stop
        
        $total = 0
        $followUps = 0
        $siteVisits = 0
        $overdue = 0

        # Note: API returns a JSON array of notification objects
        if ($null -ne $response) {
            foreach ($n in $response) {
                $total++
                if ($n.category -eq "Follow-Ups") { $followUps++ }
                elseif ($n.category -eq "Site Visits") { $siteVisits++ }
                elseif ($n.category -eq "Overdue") { $overdue++ }
            }
        }

        # Build tooltip description
        $desc = "PNP CRM Notifications"
        $desc += "`nTotal: $total"
        if ($followUps -gt 0) { $desc += "`nFollow-Ups: $followUps" }
        if ($siteVisits -gt 0) { $desc += "`nSite Visits: $siteVisits" }
        if ($overdue -gt 0) { $desc += "`nOverdue: $overdue" }

        if ($total -eq 0) {
            $desc = "PNP CRM Application`n(No pending notifications)"
        }

        # Determine Icon Path
        $iconNum = $total
        if ($iconNum -gt 99) { $iconNum = 99 }
        if ($iconNum -lt 0) { $iconNum = 0 }
        
        $IconPath = Join-Path $BadgesDir "badge_$iconNum.ico"
        
        # Fallback to base icon if badge missing
        if (-not (Test-Path $IconPath)) {
            $IconPath = Join-Path $AppDir "public\crm_icon.ico"
        }

        # Dynamically find the shortcut in case it was renamed
        $ShortcutPath = Get-CrmShortcut
        
        if ($null -ne $ShortcutPath) {
            # Load shortcut and update description
            $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
            
            $changed = $false
            if ($Shortcut.Description -ne $desc) {
                $Shortcut.Description = $desc
                $changed = $true
            }
            $currentIcon = $Shortcut.IconLocation -replace ",0$", ""
            if ($currentIcon -ne $IconPath) {
                $Shortcut.IconLocation = $IconPath
                $changed = $true
            }
            
            # Only save and refresh if changed (minimizes disk writes and screen flashing)
            if ($changed) {
                $Shortcut.Save()
                Refresh-Desktop
            }
        }
    } catch {
        # Silently fail if server is unreachable or file is locked
    }

    Start-Sleep -Seconds 30
}
```

### 2. `G:\pnp_crm\pnp_crm\generate-badges.ps1`
```powershell
$AppDir = "G:\pnp_crm\pnp_crm"
$PublicDir = Join-Path $AppDir "public"
$BadgesDir = Join-Path $PublicDir "badges_v2"

if (-not (Test-Path $BadgesDir)) {
    New-Item -ItemType Directory -Path $BadgesDir | Out-Null
}

$BaseImagePath = Join-Path $PublicDir "crm_icon.ico"
if (-not (Test-Path $BaseImagePath)) {
    Write-Host "Base image not found at $BaseImagePath"
    exit 1
}

$Source = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public class BadgeGenerator {
    public static void SaveAsIco(Bitmap bmp, string path) {
        using (FileStream fs = new FileStream(path, FileMode.Create)) {
            fs.WriteByte(0); fs.WriteByte(0); fs.WriteByte(1); fs.WriteByte(0); fs.WriteByte(1); fs.WriteByte(0);
            int width = bmp.Width; if (width >= 256) width = 0;
            int height = bmp.Height; if (height >= 256) height = 0;
            fs.WriteByte((byte)width); fs.WriteByte((byte)height);
            fs.WriteByte(0); fs.WriteByte(0); fs.WriteByte(1); fs.WriteByte(0); fs.WriteByte(32); fs.WriteByte(0);
            using (MemoryStream ms = new MemoryStream()) {
                bmp.Save(ms, ImageFormat.Png);
                byte[] pngData = ms.ToArray();
                fs.WriteByte((byte)(pngData.Length & 255)); fs.WriteByte((byte)((pngData.Length >> 8) & 255));
                fs.WriteByte((byte)((pngData.Length >> 16) & 255)); fs.WriteByte((byte)((pngData.Length >> 24) & 255));
                fs.WriteByte(22); fs.WriteByte(0); fs.WriteByte(0); fs.WriteByte(0);
                fs.Write(pngData, 0, pngData.Length);
            }
        }
    }

    public static void GenerateBadges(string baseImagePath, string outDir) {
        using (Image baseBmp = Image.FromFile(baseImagePath)) {
            int targetSize = 256;
            using (Bitmap iconBmp = new Bitmap(targetSize, targetSize))
            using (Graphics g = Graphics.FromImage(iconBmp)) {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                Rectangle rect = new Rectangle(0, 0, targetSize, targetSize);
                
                // badge_0
                g.Clear(Color.Transparent);
                g.DrawImage(baseBmp, rect);
                SaveAsIco(iconBmp, Path.Combine(outDir, "badge_0.ico"));

                using (SolidBrush redBrush = new SolidBrush(Color.FromArgb(255, 50, 50)))
                using (SolidBrush whiteBrush = new SolidBrush(Color.White))
                using (Font font = new Font("Arial", 40, FontStyle.Bold))
                using (Font fontSmall = new Font("Arial", 30, FontStyle.Bold))
                using (StringFormat format = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center }) {
                    for (int i = 1; i <= 99; i++) {
                        g.Clear(Color.Transparent);
                        g.DrawImage(baseBmp, rect);

                        int circleSize = 75;
                        int circleX = targetSize - circleSize - 5;
                        int circleY = 5;
                        g.FillEllipse(redBrush, circleX, circleY, circleSize, circleSize);

                        string text = (i == 99) ? "99+" : i.ToString();
                        RectangleF textRect = new RectangleF(circleX, circleY + 5, circleSize, circleSize);
                        
                        g.DrawString(text, (text.Length >= 2) ? fontSmall : font, whiteBrush, textRect, format);
                        SaveAsIco(iconBmp, Path.Combine(outDir, "badge_" + i + ".ico"));
                    }
                }
            }
        }
    }
}
"@
Add-Type -TypeDefinition $Source -ReferencedAssemblies System.Drawing

[BadgeGenerator]::GenerateBadges($BaseImagePath, $BadgesDir)
Write-Host "Generated 100 icons in $BadgesDir" -ForegroundColor Green
```

### 3. `G:\pnp_crm\pnp_crm\src\app\api\notifications\route.ts`
```typescript
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

    // 2. Fetch Meetings (Today)
    const todayMeetings = await prisma.meeting.findMany({
      where: {
        status: "SCHEDULED",
        date: { gte: todayStart, lte: todayEnd },
        lead: { isCancelled: false }
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
    todayMeetings.forEach(m => {
      notifications.push({
        id: `meet-${m.id}`,
        type: "SITE_VISIT",
        title: "Site Visit Today",
        description: `Visit ${m.lead.customerName} at ${m.address}`,
        time: m.time,
        date: m.date,
        priority: "HIGH",
        link: `/leads/${m.leadId}`,
        category: "Site Visits"
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
```

### 4. `G:\pnp_crm\pnp_crm\src\app\api\stats\route.ts`
```typescript
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
    });
  } catch (error: any) {
    console.error("[STATS_API_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to compile dashboard statistics", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
```

### 5. `G:\pnp_crm\pnp_crm\src\app\api\reports\route.ts`
```typescript
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
      // Last 6 months revenue - Unified via LeadTransaction
      prisma.leadTransaction.findMany({
        where: { 
          type: "RECEIVED",
          createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) },
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
  } catch (error: any) {
    console.error("[REPORTS_GET_ERROR]", error);
    return NextResponse.json({ 
      error: "Failed to generate business intelligence reports", 
      details: error.message || String(error)
    }, { status: 500 });
  }
}
```

### 6. `G:\pnp_crm\pnp_crm\src\app\(dashboard)\page.tsx`
```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Users, PhoneCall, TrendingUp, IndianRupee, Loader2,
  CheckCircle2, AlertTriangle, Calendar, Zap, BarChart3, Target, MapPin, Trash2, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .then(data => { setStats(data); setIsLoading(false); })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-slate-400 font-medium tracking-wide text-xs">Synchronizing Intelligence...</p>
      </div>
    );
  }

  if (!stats || stats.error) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4 text-center p-8">
        <AlertTriangle className="h-10 w-10 text-rose-500 mb-2" />
        <p className="text-slate-900 font-bold uppercase tracking-widest text-xs">Intelligence Outage</p>
        <p className="text-slate-400 text-[10px] font-medium max-w-xs leading-relaxed uppercase tracking-widest mt-1">
          Unable to synchronize real-time metrics. Please verify backend connectivity.
        </p>
      </div>
    );
  }

  const { metrics, chartData } = stats;

  const profitMargin = metrics.totalRevenue > 0
    ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1)
    : 0;

  const KPIs = [
    { title: "Total Leads", value: metrics.totalLeads, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Follow-ups", value: null, icon: PhoneCall, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Won Orders", value: metrics.wonOrders ?? 0, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Completed Projects", value: metrics.completedProjects ?? 0, icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50" },
    { title: "Site Visits", value: metrics.totalMeetings, icon: MapPin, color: "text-slate-600", bg: "bg-slate-100" },
    { title: "New Inquiries", value: metrics.newLeads, icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-50" },
    { title: "Current Leads", value: metrics.currentLeads, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
    { title: "Canceled Archive", value: metrics.canceledArchive, icon: Trash2, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-5 -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Business Intelligence</h1>
              <p className="text-slate-500 text-sm mt-1">Real-time performance analytics and project oversight.</p>
           </div>
           <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">{format(new Date(), "MMMM dd, yyyy")}</span>
           </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {KPIs.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all group min-h-[140px] flex flex-col justify-between">
            <div>
               <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-105", kpi.bg, kpi.color)}>
                 <kpi.icon className="h-5 w-5" />
               </div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">{kpi.title}</p>
            </div>
            
            {kpi.title === "Follow-ups" ? (
              <div className="grid grid-cols-3 mt-auto pt-3 border-t border-slate-100/50 -mx-2">
                <div className="flex flex-col items-center border-r border-slate-100 last:border-0 px-1">
                  <span className="text-[11px] font-black text-indigo-600 leading-none">{metrics.todayFollowUps}</span>
                  <span className="text-[7px] font-bold text-indigo-400 uppercase tracking-tighter mt-1">Today</span>
                </div>
                <div className="flex flex-col items-center border-r border-slate-100 last:border-0 px-1">
                  <span className={cn("text-[11px] font-black leading-none", metrics.overdueFollowUps > 0 ? "text-rose-600" : "text-slate-400")}>
                    {metrics.overdueFollowUps}
                  </span>
                  <span className="text-[7px] font-bold text-rose-400 uppercase tracking-tighter mt-1">Overdue</span>
                </div>
                <div className="flex flex-col items-center px-1">
                  <span className="text-[11px] font-black text-amber-600 leading-none">{metrics.upcomingFollowUps}</span>
                  <span className="text-[7px] font-bold text-amber-400 uppercase tracking-widest sm:tracking-tighter mt-1 scale-90 sm:scale-100 origin-center">Upcoming</span>
                </div>
              </div>
            ) : (
              <p className="text-xl font-bold text-slate-900 mt-1">{kpi.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart: Lead Generation */}
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl border border-slate-200 min-w-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><BarChart3 className="h-5 w-5 text-primary" /></div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Lead Volume</h2>
                <p className="text-xs text-slate-400">Weekly Acquisition Velocity</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-500">
               Last 7 Days
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="leads" name="Leads" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
```
