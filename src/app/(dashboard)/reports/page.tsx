"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  TrendingUp, Phone, Calendar, AlertTriangle, CheckCircle2,
  Loader2, Clock, Target, BarChart3, Users, MessageCircle, ChevronRight, ArrowLeft,
  Activity, Layers, Filter, MapPin
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart as RechartsPie, Cell, Pie, Legend, AreaChart, Area,
  LineChart, Line, ComposedChart, Sector
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { useTheme } from "@/components/providers/ThemeProvider";

const STATUS_COLORS: Record<string, string> = {
  NEW_INQUIRY: "#f59e0b", // Amber
  FOLLOW_UP: "#10b981", // Green
  MEETING_SCHEDULED: "#3b82f6", // Blue
  WON_ORDER: "#4f46e5", // Indigo
  CANCELLED: "#ef4444", // Red
};

export default function ReportsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<number>(0);
  const [activeOverdueTab, setActiveOverdueTab] = useState<"calls" | "visits">("calls");
  const [hoveredStatusIndex, setHoveredStatusIndex] = useState<number | null>(null);

  const SERVICE_PALETTE = ["#10b981", "#f59e0b", "#3b82f6", "#6366f1", "#ec4899", "#06b6d4"];

  const DottedLineCursor = (props: any) => {
    const { x, width, height = 260, top = 5 } = props;
    const cx = x + (width ? width / 2 : 0);
    return (
      <line
        x1={cx}
        y1={top}
        x2={cx}
        y2={top + height}
        stroke={isDark ? "#475569" : "#94a3b8"}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
    );
  };

  const PulseTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 shadow-xl min-w-[210px] pointer-events-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            {label} Activity
          </p>
          <div className="space-y-2">
            {payload.map((item: any, idx: number) => {
              const isLeads = item.dataKey === "leads";
              const color = isLeads
                ? (isDark ? "#818cf8" : "#6366f1")
                : (isDark ? "#c084fc" : "#9333ea");
              const bgBadge = isLeads
                ? (isDark ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border-indigo-200")
                : (isDark ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-purple-50 text-purple-700 border-purple-200");
              return (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "font-bold px-2 py-0.5 rounded-md text-[11px] shrink-0 border",
                      bgBadge
                    )}
                  >
                    {item.value} {isLeads ? (item.value === 1 ? "Lead" : "Leads") : (item.value === 1 ? "Task" : "Tasks")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const ServiceDemandTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 shadow-xl min-w-[210px] pointer-events-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            {label} Service Demand
          </p>
          <div className="space-y-2">
            {payload.map((item: any, idx: number) => {
              const color = SERVICE_PALETTE[idx % SERVICE_PALETTE.length];
              const rawName = String(item.name || item.dataKey || "");
              const formattedName = rawName
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {formattedName}
                    </span>
                  </div>
                  <span
                    className="font-bold px-2 py-0.5 rounded-md text-[11px] shrink-0 border"
                    style={{
                      backgroundColor: `${color}18`,
                      color: color,
                      borderColor: `${color}35`,
                    }}
                  >
                    {item.value} {item.value === 1 ? "Inquiry" : "Inquiries"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const FunnelTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-xl min-w-[170px] pointer-events-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1.5">
            Funnel Stage
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {item.stage}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50 dark:border-slate-700/50">
              {item.value} {item.value === 1 ? "Lead" : "Leads"}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 1}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={6}
          style={{
            filter: `drop-shadow(0 0 8px ${fill}80)`,
            transition: "all 300ms ease",
          }}
        />
      </g>
    );
  };

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => { setData(d); setIsLoading(false); })
      .catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-slate-400 dark:text-slate-500 font-medium tracking-wide text-xs">Generating Analytics Report...</p>
      </div>
    );
  }

  const { alerts, charts, recentLeads, conversionRate } = data;
  const leadsStatusData = charts?.leadsByStatus || [];
  const totalPipelineLeads = leadsStatusData.reduce((acc: number, item: any) => acc + (item.count || 0), 0);
  const activeStatusItem = hoveredStatusIndex !== null ? leadsStatusData[hoveredStatusIndex] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Cross-module business intelligence and conversion tracking.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-[#161f32] rounded-lg border border-slate-200 dark:border-slate-800 relative z-10">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{format(new Date(), "MMMM yyyy")} Session</span>
        </div>
      </div>

      {/* ─── ALERT SECTION ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today Follow-ups */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg"><Phone className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Today's Follow-Ups</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{alerts.todayFollowUps.length} Calls Scheduled</p>
            </div>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {alerts.todayFollowUps.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-lg text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">No follow-ups due today.</div>
            ) : alerts.todayFollowUps.map((f: any) => (
              <Link href={`/leads/${f.lead?.id}`} key={f.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-[#161f32] hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-500/30 transition-all group">
                <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-300 font-bold text-xs ring-1 ring-slate-200 dark:ring-slate-700 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:ring-amber-200">{f.lead.customerName ? f.lead.customerName.charAt(0).toUpperCase() : "?"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{f.lead.customerName || "Unknown Customer"}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{f.lead.contactNumber}</p>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
              </Link>
            ))}
          </div>
        </div>

        {/* Interactive Overdue Actions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6 relative z-20">
            <div className="flex items-center gap-3">
              <div className="bg-rose-50 dark:bg-rose-950/50 p-2 rounded-lg">
                {activeOverdueTab === "calls" ? <Phone className="h-4 w-4 text-rose-600 dark:text-rose-400" /> : <MapPin className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white transition-all">
                  {activeOverdueTab === "calls" ? "Missed Follow-Ups" : "Missed Site Visits"}
                </p>
                <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold uppercase tracking-wider transition-all">
                  {activeOverdueTab === "calls" ? `${alerts.overdueFollowUps?.length || 0} Pending Recalls` : `${alerts.overdueMeetings?.length || 0} Pending Visits`}
                </p>
              </div>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-[#161f32] p-1 rounded-lg">
              <button onClick={() => setActiveOverdueTab("calls")} className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", activeOverdueTab === "calls" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>Calls</button>
              <button onClick={() => setActiveOverdueTab("visits")} className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", activeOverdueTab === "visits" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>Visits</button>
            </div>
          </div>

          <div className="flex-1 min-h-[12rem] relative">
            <div className={cn("absolute inset-0 w-full transition-opacity duration-500 overflow-y-auto pr-2 custom-scrollbar", activeOverdueTab === "calls" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <div className="space-y-2.5">
                {!alerts.overdueFollowUps || alerts.overdueFollowUps.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-lg text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">Call pipeline is up to date.</div>
                ) : alerts.overdueFollowUps.map((f: any) => (
                  <Link href={`/leads/${f.lead?.id}`} key={f.id} className="flex items-center gap-3 p-2.5 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-100 dark:border-rose-900/40 transition-all group">
                    <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-rose-400 font-bold text-xs ring-1 ring-rose-200 dark:ring-rose-800 group-hover:text-rose-600 dark:group-hover:text-rose-400">{f.lead.customerName ? f.lead.customerName.charAt(0).toUpperCase() : "?"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{f.lead.customerName || "Unknown Customer"}</p>
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 font-medium italic">Due: {format(new Date(f.nextCallDate), "dd MMM")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className={cn("absolute inset-0 w-full transition-opacity duration-500 overflow-y-auto pr-2 custom-scrollbar", activeOverdueTab === "visits" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <div className="space-y-2.5">
                {!alerts.overdueMeetings || alerts.overdueMeetings.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-lg text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">Visit pipeline is up to date.</div>
                ) : alerts.overdueMeetings.map((m: any) => (
                  <Link href={`/leads/${m.lead?.id}`} key={m.id} className="flex items-center gap-3 p-2.5 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-100 dark:border-rose-900/40 transition-all group">
                    <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-rose-400 font-bold text-xs ring-1 ring-rose-200 dark:ring-rose-800 group-hover:text-rose-600 dark:group-hover:text-rose-400">{m.lead.customerName ? m.lead.customerName.charAt(0).toUpperCase() : "?"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{m.lead.customerName || "Unknown Customer"}</p>
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 font-medium italic">Due: {format(new Date(m.date), "dd MMM")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Meetings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded-lg"><Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Scheduled Visits</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{alerts.todayMeetings.length} Visits Today</p>
            </div>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {alerts.todayMeetings.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-lg text-[11px] text-slate-400 dark:text-slate-500 font-medium italic">No visits scheduled today.</div>
            ) : alerts.todayMeetings.map((m: any) => (
              <Link href={`/leads/${m.lead?.id}`} key={m.id} className="flex items-center gap-3 p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900/40 transition-all group">
                <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-indigo-400 font-bold text-xs ring-1 ring-indigo-200 dark:ring-indigo-800 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{m.lead.customerName ? m.lead.customerName.charAt(0).toUpperCase() : "?"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{m.lead.customerName || "Unknown Customer"}</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"><Clock className="h-3 w-3" /> {m.time}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CHARTS ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Reports Carousel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg transition-colors", activeChart === 0 ? "bg-indigo-50 dark:bg-indigo-950/50" : activeChart === 1 ? "bg-amber-50 dark:bg-amber-950/50" : "bg-emerald-50 dark:bg-emerald-950/50")}>
                {activeChart === 0 && <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                {activeChart === 1 && <Filter className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                {activeChart === 2 && <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white transition-all">
                  {activeChart === 0 && "Global System Pulse"}
                  {activeChart === 1 && "Global Business Funnel"}
                  {activeChart === 2 && "Global Service Demand"}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium transition-all">
                  {activeChart === 0 && "Total operations and team activity over time"}
                  {activeChart === 1 && "End-to-end CRM lifecycle drop-off rate"}
                  {activeChart === 2 && "Long-term trajectory of service inquiries"}
                </p>
              </div>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-[#161f32] p-1 rounded-lg">
              <button onClick={() => setActiveChart(0)} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-md transition-all", activeChart === 0 ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>System Pulse</button>
              <button onClick={() => setActiveChart(1)} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-md transition-all", activeChart === 1 ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>Global Funnel</button>
              <button onClick={() => setActiveChart(2)} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-md transition-all", activeChart === 2 ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>Service Demand</button>
            </div>
          </div>

          <div className="h-72 min-w-0 relative">
            <div className={cn("absolute inset-0 transition-opacity duration-500", activeChart === 0 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={charts.systemPulse} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pulseBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? "#818cf8" : "#6366f1"} stopOpacity={1} />
                      <stop offset="100%" stopColor={isDark ? "#4f46e5" : "#4338ca"} stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="pulseLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={<DottedLineCursor />}
                    content={<PulseTooltip />}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }} />
                  <Bar
                    dataKey="leads"
                    name="New Leads"
                    fill="url(#pulseBarGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    name="Team Tasks (Calls/Meetings)"
                    stroke="url(#pulseLineGrad)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: isDark ? "#0f172a" : "#ffffff", stroke: "#a855f7" }}
                    activeDot={{ r: 6, strokeWidth: 3, fill: "#a855f7", stroke: "#ffffff" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className={cn("absolute inset-0 transition-opacity duration-500", activeChart === 1 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={charts.globalFunnel} margin={{ top: 5, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: isDark ? '#f8fafc' : '#1e293b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={false}
                    content={<FunnelTooltip />} 
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    barSize={28}
                  >
                    {charts.globalFunnel?.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={cn("absolute inset-0 transition-opacity duration-500", activeChart === 2 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.serviceDemand} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    {charts.allServices?.map((srv: string, i: number) => {
                      const color = SERVICE_PALETTE[i % SERVICE_PALETTE.length];
                      return (
                        <linearGradient key={`grad-${i}`} id={`colorSrv${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                          <stop offset="50%" stopColor={color} stopOpacity={0.12} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ stroke: isDark ? '#334155' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={<ServiceDemandTooltip />} 
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }} 
                    formatter={(v) =>
                      String(v)
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    } 
                  />
                  {charts.allServices?.map((srv: string, i: number) => (
                    <Area 
                      key={`area-${i}`}
                      type="monotone" 
                      dataKey={srv} 
                      name={srv}
                      stroke={SERVICE_PALETTE[i % SERVICE_PALETTE.length]} 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill={`url(#colorSrv${i})`} 
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2 rounded-lg"><BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Leads by Status</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Distribution across pipeline</p>
            </div>
          </div>
          <div className="h-56 min-w-0 flex flex-col justify-between relative">
            <div className="relative h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  {/* Faint Background Gauge Track Ring */}
                  <Pie
                    data={[{ value: 1 }]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    stroke="none"
                    fill={isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)"}
                    isAnimationActive={false}
                  />
                  {/* Foreground Segmented Ring with Corner Radius & Gaps */}
                  <Pie 
                    data={leadsStatusData} 
                    dataKey="count" 
                    nameKey="status" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={68} 
                    innerRadius={46} 
                    paddingAngle={4}
                    cornerRadius={6}
                    stroke={isDark ? "#0f172a" : "#ffffff"}
                    strokeWidth={2}
                    startAngle={90}
                    endAngle={-270}
                    animationBegin={100}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setHoveredStatusIndex(index)}
                    onMouseLeave={() => setHoveredStatusIndex(null)}
                  >
                    {leadsStatusData.map((entry: any, index: number) => {
                      const isHovered = hoveredStatusIndex === index;
                      const isAnyHovered = hoveredStatusIndex !== null;
                      const color = STATUS_COLORS[entry.status] || "#94a3b8";
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={color}
                          opacity={isAnyHovered && !isHovered ? 0.45 : 1}
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 10px ${color}80)` : undefined,
                            transition: "opacity 300ms ease, filter 300ms ease",
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </Pie>
                </RechartsPie>
              </ResponsiveContainer>

              {/* Dynamic Center Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none">
                {activeStatusItem ? (
                  <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                    <span 
                      className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mb-0.5 leading-tight"
                      style={{
                        color: STATUS_COLORS[activeStatusItem.status] || "#94a3b8",
                        backgroundColor: `${STATUS_COLORS[activeStatusItem.status] || "#94a3b8"}20`,
                      }}
                    >
                      {activeStatusItem.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {activeStatusItem.count}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {totalPipelineLeads > 0 ? `${Math.round((activeStatusItem.count / totalPipelineLeads) * 100)}%` : "0%"}
                    </span>
                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      {totalPipelineLeads}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Total Leads
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Pill Legend */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {leadsStatusData.map((item: any, i: number) => {
                const isHovered = hoveredStatusIndex === i;
                const color = STATUS_COLORS[item.status] || "#94a3b8";
                const pct = totalPipelineLeads > 0 ? Math.round((item.count / totalPipelineLeads) * 100) : 0;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoveredStatusIndex(i)}
                    onMouseLeave={() => setHoveredStatusIndex(null)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-tight transition-all duration-200 cursor-pointer border",
                      isHovered
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm scale-105"
                        : "bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <span 
                      className={cn("h-2 w-2 rounded-full shrink-0 transition-transform", isHovered && "scale-125")}
                      style={{ backgroundColor: color }}
                    />
                    <span className="uppercase">{item.status.replace(/_/g, " ")}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium text-[9px]">({item.count} • {pct}%)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-sky-50 dark:bg-sky-950/50 p-2 rounded-lg"><Users className="h-4 w-4 text-sky-600 dark:text-sky-400" /></div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Lead Sources</h2>
          </div>
          <div className="space-y-5">
            {charts.leadsBySource.slice(0, 6).map((s: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                   <span>{s.source.replace(/_/g, " ")}</span>
                   <span>{s.count}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all" style={{ width: `${Math.min(100, (s.count / (charts.leadsBySource[0]?.count || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion + Recent */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg"><Target className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
              <div>
                 <h2 className="text-base font-semibold text-slate-900 dark:text-white">Success Metrics</h2>
                 <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Recent velocity and success rate</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global conversion</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{conversionRate}%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentLeads.slice(0, 6).map((lead: any) => (
              <Link href={`/leads/${lead.id}`} key={lead.id}
                className="flex items-center gap-3.5 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all border border-slate-100 dark:border-slate-800 hover:border-primary/20 group">
                <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-400 dark:text-slate-300 text-xs group-hover:text-primary dark:group-hover:text-indigo-400 group-hover:bg-primary/5 dark:group-hover:bg-indigo-500/10 transition-colors">
                  {lead.customerName ? lead.customerName.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{lead.customerName || "Unknown Customer"}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight">{lead.serviceType.replace(/_/g, " ")}</p>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider border",
                  lead.status === "NEW_INQUIRY" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50" :
                  lead.status === "WON_ORDER" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" :
                  lead.status === "CANCELLED" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50" : "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/50"
                )}>
                  {lead.status.replace(/_/g, " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

