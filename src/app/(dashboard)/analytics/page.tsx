"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  TrendingUp, TrendingDown, IndianRupee, AlertTriangle, 
  CheckCircle2, Loader2, Wallet, Plus, X, Search, 
  Filter, RotateCcw, ChevronRight, ArrowLeft, History,
  Activity, Briefcase, Calculator, Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import SecurityWrapper from "@/components/analytics/SecurityWrapper";

function AnalyticsContent() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const d = await res.json();
      if (res.ok) {
        setData(d);
      } else {
        console.error("Fetch failed:", d.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-slate-400 font-medium tracking-wide text-xs uppercase tracking-[0.2em]">Aggregating Fiscal Intelligence...</p>
      </div>
    );
  }

  if (!data) return (
    <div className="flex h-[70vh] items-center justify-center">
      <p className="text-slate-400 text-sm font-medium">Failed to load analytics data.</p>
    </div>
  );

  const { summary, customerFinancials, activityFeed } = data;

  const filteredFinancials = customerFinancials.filter((f: any) => {
    const matchesSearch = f.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          f.projectName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: "Total Business Value", val: summary.totalBusinessValue, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Sum of all Deal Amounts" },
    { label: "Total Received Amount", val: summary.totalReceived, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50", sub: "Total Client Payments" },
    { label: "Total Pending Amount", val: summary.totalPending, icon: Wallet, color: "text-amber-600", bg: "bg-amber-50", sub: "Verified Outstanding Dues" },
    { label: "Total Business Loss", val: summary.totalLoss, icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50", sub: "Unpaid Dues & Adjustments" },
    { label: "Business Net Profit", val: summary.globalProfit, icon: TrendingUp, color: summary.globalProfit >= 0 ? "text-emerald-600" : "text-rose-600", bg: summary.globalProfit >= 0 ? "bg-emerald-50" : "bg-rose-50", sub: "Sum of all Customer Profit margins" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-5 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Calculator className="h-6 w-6 text-primary" /> Business Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Consolidated financial oversight and global performance metrics.</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/20 transition-all group">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", s.bg, s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">₹{s.val.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
            <p className="text-[9px] text-slate-400 italic mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Customer Financial Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><Building className="h-4 w-4" /></div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Customer Financial Status</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search customer/project..." 
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all w-48 font-medium"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-600 outline-none focus:border-primary"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                  <option value="Loss">Loss</option>
                  <option value="Overpaid">Overpaid</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer / Project</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Deal Amount</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Paid</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Remaining Due</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Profit</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFinancials.map((f: any) => (
                    <tr key={f.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{f.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-0.5">{f.projectName}</p>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-700 text-sm">₹{f.dealAmount.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-bold text-emerald-600 text-sm">₹{f.clientPaid.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                        <span className={cn("text-sm font-bold", f.remainingDue > 0 ? "text-rose-600" : "text-slate-300")}>
                          ₹{f.remainingDue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={cn("text-sm font-bold", f.profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          ₹{f.profit.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          f.status === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          f.status === "Loss" ? "bg-rose-600 text-white border-rose-600" :
                          f.status === "Partial" ? "bg-sky-50 text-sky-600 border-sky-200" :
                          f.status === "Overpaid" ? "bg-purple-50 text-purple-600 border-purple-200" :
                          "bg-amber-50 text-amber-600 border-amber-200"
                        )}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredFinancials.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 font-medium text-xs italic uppercase tracking-widest">
                        No financial records matching current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Activity & Feed */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-[60px] opacity-10 -mr-16 -mt-16" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 mb-8 relative z-10">
              <Activity className="h-4 w-4 text-primary" /> Business Pulse
            </h3>
            <div className="space-y-6 relative z-10">
              {activityFeed.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic uppercase tracking-widest text-center py-10">No recent business activity.</p>
              ) : activityFeed.map((act: any) => (
                <div key={act.id} className="flex gap-4 group">
                  <div className={cn(
                    "h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border transition-all group-hover:scale-110",
                    act.type === "RECEIVED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  )}>
                    {act.type === "RECEIVED" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 leading-tight group-hover:text-white transition-colors">{act.message}</p>
                    <div className="flex items-center justify-between mt-1.5">
                       <span className="text-[10px] font-bold text-slate-500 uppercase">{format(new Date(act.date), "dd MMM")}</span>
                       <span className={cn("text-[10px] font-black", act.type === "RECEIVED" ? "text-emerald-400" : "text-rose-400")}>
                         {act.type === "RECEIVED" ? "+" : "-"} ₹{act.amount.toLocaleString()}
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-4 text-center">
             <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <Calculator className="h-5 w-5" />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">Financial Accuracy</p>
               <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                 Aggregate data is synchronized across all project ledgers and global business overheads.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessAnalyticsPage() {
  return (
    <SecurityWrapper>
      <AnalyticsContent />
    </SecurityWrapper>
  );
}
