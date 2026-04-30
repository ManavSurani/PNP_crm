"use client";

import { useState, useEffect } from "react";
import {
  Users, PhoneCall, TrendingUp, IndianRupee, Loader2,
  CheckCircle2, AlertTriangle, Calendar, Zap, BarChart3, Target
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
    { title: "Follow-ups", value: metrics.todayFollowUps, icon: PhoneCall, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Won Orders", value: metrics.wonOrders, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Pending Due", value: `₹${(metrics.totalPending || 0).toLocaleString()}`, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Gross Revenue", value: `₹${metrics.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "text-sky-600", bg: "bg-sky-50" },
    { title: "Net Profit", value: `₹${metrics.netProfit.toLocaleString()}`, icon: TrendingUp, color: metrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600", bg: metrics.netProfit >= 0 ? "bg-emerald-50" : "bg-rose-50" },
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPIs.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all group">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-transform", kpi.bg, kpi.color)}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-slate-500">{kpi.title}</p>
            <p className="text-xl font-semibold text-slate-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart: Lead Generation */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 min-w-0">
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

        {/* P&L Interactive Summary */}
        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col h-full font-sans">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/20 p-2 rounded-lg border border-white/10 text-primary"><IndianRupee className="h-5 w-5" /></div>
              <h2 className="font-semibold text-sm">Financial Health</h2>
            </div>
            
            <div className="space-y-6 flex-grow">
               <DashboardFinancialItem label="Gross Inflow" val={metrics.totalRevenue} sub="Verified Payments" />
               <DashboardFinancialItem label="Total Burn" val={metrics.totalExpenses} sub="Material + Labour" isNegative />
               
               <div className="pt-6 border-t border-white/10">
                  <p className="text-xs text-slate-400 font-medium mb-1 text-right">Net Liquidity</p>
                  <p className={cn("text-3xl font-bold tracking-tight text-right", metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    ₹{metrics.netProfit.toLocaleString()}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <div className="bg-white/5 rounded-full px-3 py-1.5 border border-white/10 flex items-center gap-2">
                       <Target className="h-3 w-3 text-primary" />
                       <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">{profitMargin}% Efficiency</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & Package Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Profit Leaderboard */}
         <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
               <div>
                  <h3 className="text-base font-semibold text-slate-900">Profitability Leaderboard</h3>
                  <p className="text-xs text-slate-400">Highest Margin Projects</p>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
               {metrics.topProjects?.slice(0, 4).map((proj: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center font-bold text-slate-400 text-xs border border-slate-100 shadow-sm">
                          {i+1}
                       </div>
                       <div>
                          <p className="text-sm font-semibold text-slate-900">{proj.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">{proj.orderNo}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-emerald-600 leading-none">+₹{proj.profit.toLocaleString()}</p>
                       <p className="text-[10px] font-semibold text-slate-400 tracking-tighter mt-1">{proj.margin}% Margin</p>
                    </div>
                 </div>
               ))}
               {(!metrics.topProjects || metrics.topProjects.length === 0) && (
                 <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 font-medium text-xs">
                    No project data found.
                 </div>
               )}
            </div>
         </div>

         {/* Package Popularity */}
         <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
               <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Zap className="h-5 w-5" /></div>
               <div>
                  <h3 className="text-base font-semibold text-slate-900">Package Distribution</h3>
                  <p className="text-xs text-slate-400">Most Demanded Service Packages</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {metrics.packageStats?.map((pkg: any) => (
                 <div key={pkg.name} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm font-bold text-primary">
                       {pkg.count}
                    </div>
                    <div className="flex-1">
                       <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">{pkg.name}</p>
                       <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(pkg.count / metrics.wonOrders) * 100}%` }} />
                       </div>
                    </div>
                 </div>
               ))}
               {(!metrics.packageStats || metrics.packageStats.length === 0) && (
                  <div className="col-span-2 py-12 text-center text-slate-400 font-medium text-xs border border-dashed border-slate-200 rounded-2xl">
                    No package distribution data.
                  </div>
               )}
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed border border-slate-100">
               <span className="text-slate-900 font-bold block mb-1">STRATEGIC INSIGHT</span>
               Analyze top-converting packages to optimize inventory and specialize your interior workforce.
            </div>
         </div>
      </div>
    </div>
  );
}

function DashboardFinancialItem({ label, val, sub, isNegative = false }: { label: string, val: number, sub: string, isNegative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
       <div>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-[10px] text-primary font-semibold opacity-70 leading-none">{sub}</p>
       </div>
       <p className={cn("text-lg font-bold tracking-tight", isNegative ? "text-rose-400" : "text-white")}>
          {isNegative ? "−" : ""} ₹{val.toLocaleString()}
       </p>
    </div>
  );
}
