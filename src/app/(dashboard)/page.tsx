"use client";

import { useState, useEffect } from "react";
import { Users, PhoneCall, TrendingUp, IndianRupee, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const { metrics, chartData } = stats;

  const KPIs = [
    { title: "Total Active Leads", value: metrics.totalLeads, icon: Users, color: "bg-blue-500" },
    { title: "Follow-ups Today", value: metrics.todayFollowUps, icon: PhoneCall, color: "bg-orange-500" },
    { title: "Total Won Orders", value: metrics.wonOrders, icon: TrendingUp, color: "bg-emerald-500" },
    { title: "Net Profitability", value: `₹${metrics.netProfit.toLocaleString()}`, icon: IndianRupee, color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Business Overview</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Real-time statistics covering all CRM verticals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPIs.map((kpi, idx) => (
           <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition">
              <div className={`${kpi.color} h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-inner`}>
                 <kpi.icon className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-sm font-semibold text-slate-500">{kpi.title}</p>
                 <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.value}</p>
              </div>
           </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" /> Lead Generation (Last 7 Days)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="leads" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl shadow-lg text-white border border-indigo-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-50" />
          <h2 className="text-lg font-bold mb-6 relative z-10">Financial Summary</h2>
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-sm text-indigo-200 font-medium tracking-wide uppercase">Gross Revenue Logged</p>
              <p className="text-3xl font-black mt-1">₹{metrics.totalRevenue.toLocaleString()}</p>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-emerald-400 h-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="pt-4 border-t border-indigo-800/50">
              <p className="text-sm text-indigo-200 font-medium tracking-wide uppercase">Operational Profit</p>
              <p className={`text-2xl font-bold mt-1 ${metrics.netProfit < 0 ? 'text-rose-400' : 'text-indigo-100'}`}>
                ₹{metrics.netProfit.toLocaleString()}
              </p>
              <p className="text-xs text-indigo-300 mt-2 leading-relaxed">
                Profit is dynamically calculated considering total revenues against raw materials, workers, and petty cash.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
