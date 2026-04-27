"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  TrendingUp, Phone, Calendar, AlertTriangle, CheckCircle2,
  Loader2, Clock, Target, BarChart3, Users, MessageCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart as RechartsPie, Cell, Pie, Legend
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  NEW_INQUIRY: "#f59e0b",
  FOLLOW_UP: "#3b82f6",
  MEETING_SCHEDULED: "#6366f1",
  WON_ORDER: "#10b981",
  CANCELLED: "#ef4444",
};

const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => { setData(d); setIsLoading(false); })
      .catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Intelligence...</p>
      </div>
    );
  }

  const { alerts, charts, recentLeads, conversionRate } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-indigo-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500 rounded-full blur-[120px] opacity-10 -mr-36 -mt-36" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Business intelligence — Conversion, Revenue & Alerts</p>
        </div>
      </div>

      {/* ─── ALERT SECTION ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today Follow-ups */}
        <div className={cn(
          "rounded-2xl border-2 p-5",
          alerts.todayFollowUps.length > 0 ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-500 p-2 rounded-xl"><Phone className="h-5 w-5 text-white" /></div>
            <div>
              <p className="font-black text-slate-900 uppercase tracking-tight text-sm">Today's Follow-ups</p>
              <p className="text-xs text-slate-400 font-bold">{alerts.todayFollowUps.length} pending calls</p>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.todayFollowUps.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold italic">No follow-ups scheduled today. ✓</p>
            ) : alerts.todayFollowUps.map((f: any) => (
              <Link href={`/leads/${f.lead?.id || "#"}`} key={f.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition-all block">
                <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-black text-xs">{f.lead.customerName.charAt(0)}</div>
                <div>
                  <p className="text-xs font-black text-slate-900">{f.lead.customerName}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{f.lead.contactNumber}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Overdue Follow-ups */}
        <div className={cn(
          "rounded-2xl border-2 p-5",
          alerts.overdueFollowUps.length > 0 ? "bg-rose-50 border-rose-300" : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-rose-600 p-2 rounded-xl"><AlertTriangle className="h-5 w-5 text-white" /></div>
            <div>
              <p className="font-black text-slate-900 uppercase tracking-tight text-sm">Overdue Follow-ups</p>
              <p className="text-xs text-rose-600 font-bold">{alerts.overdueFollowUps.length} calls missed</p>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.overdueFollowUps.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold italic">No overdue follow-ups. ✓</p>
            ) : alerts.overdueFollowUps.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-rose-200">
                <div className="h-8 w-8 bg-rose-600 rounded-lg flex items-center justify-center text-white font-black text-xs">{f.lead.customerName.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate">{f.lead.customerName}</p>
                  <p className="text-[10px] text-rose-500 font-bold">Due: {format(new Date(f.nextCallDate), "dd MMM")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Meetings */}
        <div className={cn(
          "rounded-2xl border-2 p-5",
          alerts.todayMeetings.length > 0 ? "bg-indigo-50 border-indigo-300" : "bg-slate-50 border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600 p-2 rounded-xl"><Calendar className="h-5 w-5 text-white" /></div>
            <div>
              <p className="font-black text-slate-900 uppercase tracking-tight text-sm">Today's Meetings</p>
              <p className="text-xs text-slate-400 font-bold">{alerts.todayMeetings.length} site visits scheduled</p>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.todayMeetings.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold italic">No meetings today. ✓</p>
            ) : alerts.todayMeetings.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-indigo-200">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">{m.lead.customerName.charAt(0)}</div>
                <div>
                  <p className="text-xs font-black text-slate-900">{m.lead.customerName}</p>
                  <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> {m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CHARTS ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-600 p-2 rounded-xl"><TrendingUp className="h-5 w-5 text-white" /></div>
            <div>
              <h2 className="font-black text-slate-900 uppercase tracking-tight">Revenue Trend</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Last 6 Months</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueChart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", fontWeight: 700 }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Pipeline Donut */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-2 rounded-xl"><BarChart3 className="h-5 w-5 text-white" /></div>
            <div>
              <h2 className="font-black text-slate-900 uppercase tracking-tight">Pipeline Split</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">By Status</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={charts.leadsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {charts.leadsByStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [v, name.replace(/_/g, " ")]}
                  contentStyle={{ borderRadius: "12px", fontWeight: 700, border: "1px solid #e2e8f0" }} />
                <Legend formatter={(v) => v.replace(/_/g, " ")} wrapperStyle={{ fontSize: "10px", fontWeight: 700 }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Breakdown */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-sky-600 p-2 rounded-xl"><Users className="h-5 w-5 text-white" /></div>
            <h2 className="font-black text-slate-900 uppercase tracking-tight">Lead Sources</h2>
          </div>
          <div className="space-y-3">
            {charts.leadsBySource.slice(0, 6).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-20 shrink-0">{s.source.replace(/_/g, " ")}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="h-2 bg-indigo-600 rounded-full transition-all" style={{ width: `${Math.min(100, (s.count / charts.leadsBySource[0].count) * 100)}%` }} />
                </div>
                <span className="text-xs font-black text-slate-900 w-6 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion + Recent */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-xl"><Target className="h-5 w-5 text-white" /></div>
              <h2 className="font-black text-slate-900 uppercase tracking-tight">Recent Leads</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversion Rate</p>
              <p className="text-2xl font-black text-emerald-600">{conversionRate}%</p>
            </div>
          </div>
          <div className="space-y-2">
            {recentLeads.map((lead: any) => (
              <Link href={`/leads/${lead.id}`} key={lead.id}
                className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-200">
                <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white uppercase shrink-0">
                  {lead.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 truncate">{lead.customerName}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">{lead.serviceType.replace(/_/g, " ")}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest",
                  lead.status === "NEW_INQUIRY" ? "bg-amber-100 text-amber-700" :
                  lead.status === "WON_ORDER" ? "bg-emerald-100 text-emerald-700" :
                  lead.status === "CANCELLED" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
                )}>
                  {lead.status.replace(/_/g, " ")}
                </span>
                <p className="text-[10px] text-slate-400 font-bold shrink-0">{format(new Date(lead.createdAt), "dd MMM")}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
