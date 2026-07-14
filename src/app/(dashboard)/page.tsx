"use client";

import { useState, useEffect } from "react";
import {
  Users, PhoneCall, TrendingUp, IndianRupee, Loader2,
  CheckCircle2, AlertTriangle, Calendar, Zap, BarChart3, Target, MapPin, Trash2, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, LineChart, Line
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"days" | "months" | "years">("days");

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

  const { metrics, chartData, chartDataMonths, chartDataYears } = stats;

  const profitMargin = metrics.totalRevenue > 0
    ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1)
    : 0;

  const KPIs = [
    { title: "Total Leads", value: metrics.totalLeads, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", link: "/leads" },
    { title: "Follow-ups", value: null, icon: PhoneCall, color: "text-sky-600", bg: "bg-sky-50", link: "/follow-ups" },
    { title: "Won Orders", value: metrics.wonOrders ?? 0, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50", link: "/customers" },
    { title: "Completed Projects", value: metrics.completedProjects ?? 0, icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50", link: "/customers/completed" },
    { title: "Site Visits", value: metrics.totalMeetings, icon: MapPin, color: "text-slate-600", bg: "bg-slate-100", link: "/meetings" },
    { title: "New Inquiries", value: metrics.newLeads, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50", link: "/leads?status=NEW_INQUIRY" },
    { title: "Current Leads", value: metrics.currentLeads, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", link: "/leads?status=ACTIVE" },
    { title: "Canceled Archive", value: metrics.canceledArchive, icon: Trash2, color: "text-rose-600", bg: "bg-rose-50", link: "/canceled" },
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
          <Link href={kpi.link} key={idx} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group min-h-[140px] flex flex-col justify-between cursor-pointer">
            <div>
               <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110", kpi.bg, kpi.color)}>
                 <kpi.icon className="h-5 w-5" />
               </div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-tight group-hover:text-primary transition-colors">{kpi.title}</p>
            </div>
            
            {kpi.title === "Follow-ups" ? (
              <div className="grid grid-cols-3 mt-auto pt-3 border-t border-slate-100/50 -mx-2">
                <div className="flex flex-col items-center border-r border-slate-100 last:border-0 px-1 group-hover:border-primary/10 transition-colors">
                  <span className="text-[11px] font-black text-indigo-600 leading-none">{metrics.todayFollowUps}</span>
                  <span className="text-[7px] font-bold text-indigo-400 uppercase tracking-tighter mt-1">Today</span>
                </div>
                <div className="flex flex-col items-center border-r border-slate-100 last:border-0 px-1 group-hover:border-primary/10 transition-colors">
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
          </Link>
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
            <button 
              onClick={() => {
                if (timeframe === "days") setTimeframe("months");
                else if (timeframe === "months") setTimeframe("years");
                else setTimeframe("days");
              }}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 transition-colors cursor-pointer active:scale-95"
            >
               {timeframe === "days" ? "Last 7 Days" : timeframe === "months" ? "Months" : "Years"}
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              {timeframe === "days" ? (
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
              ) : timeframe === "months" ? (
                <AreaChart data={chartDataMonths} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              ) : (
                <LineChart data={chartDataYears} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="leads" name="Leads" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 7 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
