"use client";

import { useState, useEffect } from "react";
import {
  Users, PhoneCall, TrendingUp, IndianRupee, Loader2,
  CheckCircle2, AlertTriangle, Calendar, Zap, BarChart3, Target
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => { setStats(data); setIsLoading(false); })
      .catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Intelligence...</p>
      </div>
    );
  }

  const { metrics, chartData } = stats;

  const profitMargin = metrics.totalRevenue > 0
    ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1)
    : 0;

  const KPIs = [
    { title: "Total Leads", value: metrics.totalLeads, icon: Users, color: "bg-indigo-600", light: "bg-indigo-50 text-indigo-600" },
    { title: "Follow-ups Today", value: metrics.todayFollowUps, icon: PhoneCall, color: "bg-amber-500", light: "bg-amber-50 text-amber-600" },
    { title: "Won Orders", value: metrics.wonOrders, icon: CheckCircle2, color: "bg-emerald-600", light: "bg-emerald-50 text-emerald-600" },
    { title: "Pending Due", value: `₹${(metrics.totalPending || 0).toLocaleString()}`, icon: AlertTriangle, color: "bg-rose-600", light: "bg-rose-50 text-rose-600" },
    { title: "Gross Revenue", value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "bg-sky-600", light: "bg-sky-50 text-sky-600" },
    { title: "Net Profit", value: `₹${metrics.netProfit.toLocaleString()}`, icon: TrendingUp, color: metrics.netProfit >= 0 ? "bg-emerald-600" : "bg-rose-600", light: metrics.netProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl relative overflow-hidden border-b-4 border-indigo-600">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-48 -mt-48" />
        <div className="relative z-10">
          <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs mb-3">PNP Furniture CRM</p>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight leading-none">Business Intelligence</h1>
          <p className="text-slate-400 text-sm font-bold mt-3 uppercase tracking-widest">Real-time dashboard — All verticals synchronized</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPIs.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-inner mb-4 group-hover:scale-110 transition-transform", kpi.color)}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</p>
            <p className="text-xl font-black text-slate-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-2 rounded-xl"><BarChart3 className="h-5 w-5 text-white" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lead Generation</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Last 7 Days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 700 }}
                />
                <Bar dataKey="leads" name="Leads" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-3xl shadow-xl text-white border border-indigo-900 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-600/50 p-2 rounded-xl"><IndianRupee className="h-5 w-5" /></div>
              <div>
                <h2 className="font-black uppercase tracking-tight">P&L Summary</h2>
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Profit & Loss</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-indigo-300 uppercase tracking-widest font-black">Gross Revenue</p>
                <p className="text-3xl font-black mt-1">₹{metrics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-px bg-indigo-800/50" />
              <div>
                <p className="text-xs text-indigo-300 uppercase tracking-widest font-black">Total Expenses</p>
                <p className="text-xl font-black text-rose-400 mt-1">− ₹{metrics.totalExpenses?.toLocaleString() || 0}</p>
              </div>
              <div className="h-px bg-indigo-800/50" />
              <div>
                <p className="text-xs text-indigo-300 uppercase tracking-widest font-black">Net Profit</p>
                <p className={cn("text-2xl font-black mt-1", metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  ₹{metrics.netProfit.toLocaleString()}
                </p>
                <div className="mt-3 bg-indigo-900/50 rounded-full px-3 py-1 inline-flex items-center gap-2">
                  <Target className="h-3 w-3 text-indigo-400" />
                  <span className="text-xs font-black text-indigo-300">{profitMargin}% Margin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "New Inquiries", val: metrics.newLeads || 0, color: "border-amber-500 text-amber-600" },
          { label: "Follow-ups Active", val: metrics.followUpLeads || 0, color: "border-sky-500 text-sky-600" },
          { label: "Meetings Scheduled", val: metrics.meetingLeads || 0, color: "border-indigo-500 text-indigo-600" },
          { label: "Cancelled", val: metrics.cancelledLeads || 0, color: "border-rose-500 text-rose-600" },
        ].map((s, i) => (
          <div key={i} className={cn("bg-white p-5 rounded-2xl border-l-4 shadow-sm border border-slate-100", s.color.split(" ")[0])}>
            <p className={cn("text-3xl font-black", s.color.split(" ")[1])}>{s.val}</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
