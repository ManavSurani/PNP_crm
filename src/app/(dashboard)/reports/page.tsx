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
  LineChart, Line, ComposedChart
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  NEW_INQUIRY: "#f59e0b", // Amber
  FOLLOW_UP: "#10b981", // Green
  MEETING_SCHEDULED: "#3b82f6", // Blue
  WON_ORDER: "#4f46e5", // Indigo
  CANCELLED: "#ef4444", // Red
};

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<number>(0);
  const [activeOverdueTab, setActiveOverdueTab] = useState<"calls" | "visits">("calls");

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
        <p className="text-slate-400 font-medium tracking-wide text-xs">Generating Analytics Report...</p>
      </div>
    );
  }

  const { alerts, charts, recentLeads, conversionRate } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Cross-module business intelligence and conversion tracking.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 relative z-10">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">{format(new Date(), "MMMM yyyy")} Session</span>
        </div>
      </div>

      {/* ─── ALERT SECTION ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today Follow-ups */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-50 p-2 rounded-lg"><Phone className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Today's Follow-Ups</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{alerts.todayFollowUps.length} Calls Scheduled</p>
            </div>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {alerts.todayFollowUps.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-100 rounded-lg text-[11px] text-slate-400 font-medium italic">No follow-ups due today.</div>
            ) : alerts.todayFollowUps.map((f: any) => (
              <Link href={`/leads/${f.lead?.id}`} key={f.id} className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-white rounded-lg border border-slate-100 hover:border-amber-200 transition-all group">
                <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center text-slate-400 font-bold text-xs ring-1 ring-slate-200 group-hover:text-amber-600 group-hover:ring-amber-200">{f.lead.customerName ? f.lead.customerName.charAt(0).toUpperCase() : "?"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{f.lead.customerName || "Unknown Customer"}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{f.lead.contactNumber}</p>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Interactive Overdue Actions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6 relative z-20">
            <div className="flex items-center gap-3">
              <div className="bg-rose-50 p-2 rounded-lg">
                {activeOverdueTab === "calls" ? <Phone className="h-4 w-4 text-rose-600" /> : <MapPin className="h-4 w-4 text-rose-600" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 transition-all">
                  {activeOverdueTab === "calls" ? "Missed Follow-Ups" : "Missed Site Visits"}
                </p>
                <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider transition-all">
                  {activeOverdueTab === "calls" ? `${alerts.overdueFollowUps?.length || 0} Pending Recalls` : `${alerts.overdueMeetings?.length || 0} Pending Visits`}
                </p>
              </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setActiveOverdueTab("calls")} className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", activeOverdueTab === "calls" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Calls</button>
              <button onClick={() => setActiveOverdueTab("visits")} className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", activeOverdueTab === "visits" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Visits</button>
            </div>
          </div>

          <div className="flex-1 min-h-[12rem] relative">
            <div className={cn("absolute inset-0 w-full transition-opacity duration-500 overflow-y-auto pr-2 custom-scrollbar", activeOverdueTab === "calls" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <div className="space-y-2.5">
                {!alerts.overdueFollowUps || alerts.overdueFollowUps.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-100 rounded-lg text-[11px] text-slate-400 font-medium italic">Call pipeline is up to date.</div>
                ) : alerts.overdueFollowUps.map((f: any) => (
                  <Link href={`/leads/${f.lead?.id}`} key={f.id} className="flex items-center gap-3 p-2.5 bg-rose-50/30 hover:bg-rose-50 rounded-lg border border-rose-100 transition-all group">
                    <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center text-rose-400 font-bold text-xs ring-1 ring-rose-200 group-hover:text-rose-600">{f.lead.customerName ? f.lead.customerName.charAt(0).toUpperCase() : "?"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{f.lead.customerName || "Unknown Customer"}</p>
                      <p className="text-[10px] text-rose-500 font-medium italic">Due: {format(new Date(f.nextCallDate), "dd MMM")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className={cn("absolute inset-0 w-full transition-opacity duration-500 overflow-y-auto pr-2 custom-scrollbar", activeOverdueTab === "visits" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <div className="space-y-2.5">
                {!alerts.overdueMeetings || alerts.overdueMeetings.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-100 rounded-lg text-[11px] text-slate-400 font-medium italic">Visit pipeline is up to date.</div>
                ) : alerts.overdueMeetings.map((m: any) => (
                  <Link href={`/leads/${m.lead?.id}`} key={m.id} className="flex items-center gap-3 p-2.5 bg-rose-50/30 hover:bg-rose-50 rounded-lg border border-rose-100 transition-all group">
                    <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center text-rose-400 font-bold text-xs ring-1 ring-rose-200 group-hover:text-rose-600">{m.lead.customerName ? m.lead.customerName.charAt(0).toUpperCase() : "?"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{m.lead.customerName || "Unknown Customer"}</p>
                      <p className="text-[10px] text-rose-500 font-medium italic">Due: {format(new Date(m.date), "dd MMM")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Meetings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 p-2 rounded-lg"><Calendar className="h-4 w-4 text-indigo-600" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Scheduled Visits</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{alerts.todayMeetings.length} Visits Today</p>
            </div>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {alerts.todayMeetings.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-100 rounded-lg text-[11px] text-slate-400 font-medium italic">No visits scheduled today.</div>
            ) : alerts.todayMeetings.map((m: any) => (
              <Link href={`/leads/${m.lead?.id}`} key={m.id} className="flex items-center gap-3 p-2.5 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-all group">
                <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center text-indigo-400 font-bold text-xs ring-1 ring-indigo-200 group-hover:text-indigo-600">{m.lead.customerName ? m.lead.customerName.charAt(0).toUpperCase() : "?"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{m.lead.customerName || "Unknown Customer"}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1"><Clock className="h-3 w-3" /> {m.time}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CHARTS ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Reports Carousel */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg transition-colors", activeChart === 0 ? "bg-indigo-50" : activeChart === 1 ? "bg-amber-50" : "bg-emerald-50")}>
                {activeChart === 0 && <Activity className="h-5 w-5 text-indigo-600" />}
                {activeChart === 1 && <Filter className="h-5 w-5 text-amber-600" />}
                {activeChart === 2 && <Layers className="h-5 w-5 text-emerald-600" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 transition-all">
                  {activeChart === 0 && "Global System Pulse"}
                  {activeChart === 1 && "Global Business Funnel"}
                  {activeChart === 2 && "Global Service Demand"}
                </h2>
                <p className="text-xs text-slate-400 font-medium transition-all">
                  {activeChart === 0 && "Total operations and team activity over time"}
                  {activeChart === 1 && "End-to-end CRM lifecycle drop-off rate"}
                  {activeChart === 2 && "Long-term trajectory of service inquiries"}
                </p>
              </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setActiveChart(0)} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-md transition-all", activeChart === 0 ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>System Pulse</button>
              <button onClick={() => setActiveChart(1)} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-md transition-all", activeChart === 1 ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Global Funnel</button>
              <button onClick={() => setActiveChart(2)} className={cn("px-3 py-1.5 text-[11px] font-bold rounded-md transition-all", activeChart === 2 ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Service Demand</button>
            </div>
          </div>

          <div className="h-72 min-w-0 relative">
            <div className={cn("absolute inset-0 transition-opacity duration-500", activeChart === 0 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={charts.systemPulse} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="leads" name="New Leads" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line type="monotone" dataKey="tasks" name="Team Tasks (Calls/Meetings)" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className={cn("absolute inset-0 transition-opacity duration-500", activeChart === 1 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={charts.globalFunnel} margin={{ top: 5, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(v: any, n: any, props: any) => [v, props.payload.stage]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }} 
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                    {charts.globalFunnel?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={cn("absolute inset-0 transition-opacity duration-500", activeChart === 2 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.serviceDemand} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    {charts.allServices?.map((srv: string, i: number) => (
                      <linearGradient key={`grad-${i}`} id={`colorSrv${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={["#10b981", "#3b82f6", "#f59e0b", "#6366f1", "#ec4899"][i % 5]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={["#10b981", "#3b82f6", "#f59e0b", "#6366f1", "#ec4899"][i % 5]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => String(v).replace(/_/g, " ")} />
                  {charts.allServices?.map((srv: string, i: number) => (
                    <Area 
                      key={`area-${i}`}
                      type="monotone" 
                      dataKey={srv} 
                      name={srv}
                      stroke={["#10b981", "#3b82f6", "#f59e0b", "#6366f1", "#ec4899"][i % 5]} 
                      strokeWidth={2} 
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
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 p-2 rounded-lg"><BarChart3 className="h-5 w-5 text-indigo-600" /></div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Leads by Status</h2>
              <p className="text-xs text-slate-400 font-medium">Distribution across pipeline</p>
            </div>
          </div>
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie 
                  data={charts.leadsByStatus} 
                  dataKey="count" 
                  nameKey="status" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={70} 
                  innerRadius={45} 
                  stroke="none"
                >
                  {charts.leadsByStatus.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.status] || "#94a3b8"} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [v, name.replace(/_/g, " ")]}
                  contentStyle={{ borderRadius: "12px", fontSize: '11px', border: "1px solid #e2e8f0" }} />
                <Legend formatter={(v) => <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{v.replace(/_/g, " ")}</span>} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Breakdown */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-sky-50 p-2 rounded-lg"><Users className="h-4 w-4 text-sky-600" /></div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Lead Sources</h2>
          </div>
          <div className="space-y-5">
            {charts.leadsBySource.slice(0, 6).map((s: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                   <span>{s.source.replace(/_/g, " ")}</span>
                   <span>{s.count}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(100, (s.count / (charts.leadsBySource[0]?.count || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion + Recent */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-lg"><Target className="h-5 w-5 text-amber-600" /></div>
              <div>
                 <h2 className="text-base font-semibold text-slate-900">Success Metrics</h2>
                 <p className="text-xs text-slate-400 font-medium">Recent velocity and success rate</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global conversion</p>
              <p className="text-2xl font-bold text-emerald-600">{conversionRate}%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentLeads.slice(0, 6).map((lead: any) => (
              <Link href={`/leads/${lead.id}`} key={lead.id}
                className="flex items-center gap-3.5 p-3 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 hover:border-primary/20 group">
                <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400 text-xs group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                  {lead.customerName ? lead.customerName.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{lead.customerName || "Unknown Customer"}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{lead.serviceType.replace(/_/g, " ")}</p>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider border",
                  lead.status === "NEW_INQUIRY" ? "bg-amber-50 text-amber-600 border-amber-100" :
                  lead.status === "WON_ORDER" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  lead.status === "CANCELLED" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-sky-50 text-sky-600 border-sky-100"
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
