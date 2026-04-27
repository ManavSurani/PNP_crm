"use client";

import { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import { 
  PhoneCall, Clock, CheckCircle2, AlertCircle, Loader2, 
  Search, Filter, ExternalLink, Calendar
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchFollowUps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/follow-ups");
      setFollowUps(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchFollowUps(); }, []);

  const filtered = followUps.filter(f => 
    f.lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
    f.noteGiven?.toLowerCase().includes(search.toLowerCase())
  );

  const pending = followUps.filter(f => !f.completedDate);
  const overdue = pending.filter(f => f.nextCallDate && isPast(new Date(f.nextCallDate)) && !isToday(new Date(f.nextCallDate)));
  const today = pending.filter(f => f.nextCallDate && isToday(new Date(f.nextCallDate)));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-amber-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Call Queue</h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Follow-up Management & CRM Pipeline</p>
          </div>
          <div className="flex gap-3">
            {[
              { label: "Today", val: today.length, color: "bg-indigo-600 shadow-indigo-900/50" },
              { label: "Overdue", val: overdue.length, color: "bg-rose-600 shadow-rose-900/50" },
            ].map((s, i) => (
              <div key={i} className={cn("px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center min-w-[100px]", s.color)}>
                <p className="text-2xl font-black text-white leading-none">{s.val}</p>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logic/Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search leads or notes..." 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95">
            <Filter className="h-4 w-4" /> Filter By Priority
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Loading Queue...</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-left">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-5 pl-8 pr-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer / Lead</th>
                  <th className="px-3 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Next Call Target</th>
                  <th className="px-3 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Response</th>
                  <th className="px-3 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attempt</th>
                  <th className="px-3 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-8">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filtered.map((followUp) => {
                  const isScheduledPast = followUp.nextCallDate && isPast(new Date(followUp.nextCallDate)) && !isToday(new Date(followUp.nextCallDate)) && !followUp.completedDate;
                  const isScheduledToday = followUp.nextCallDate && isToday(new Date(followUp.nextCallDate)) && !followUp.completedDate;

                  return (
                    <tr key={followUp.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="py-6 pl-8 pr-3">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shadow-lg",
                            followUp.lead.priority === "HIGH" ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
                          )}>
                            <PhoneCall className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase leading-none">{followUp.lead.customerName}</p>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">{followUp.lead.serviceType.replace(/_/g, " ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-6">
                        {followUp.nextCallDate ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className={cn("h-4 w-4", isScheduledPast ? "text-rose-500" : "text-slate-400")} />
                              <p className={cn("text-sm font-black", isScheduledPast ? "text-rose-600" : "text-slate-900")}>
                                {format(new Date(followUp.nextCallDate), "dd MMM yyyy")}
                              </p>
                            </div>
                            {isScheduledPast && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-rose-100 text-rose-600 text-[9px] font-black uppercase">
                                <AlertCircle className="h-3 w-3" /> Overdue
                              </span>
                            )}
                            {isScheduledToday && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-600 text-[9px] font-black uppercase">
                                <Clock className="h-3 w-3" /> Due Today
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic">No date set</span>
                        )}
                      </td>
                      <td className="px-3 py-6">
                        <p className="text-[11px] font-bold text-slate-600 line-clamp-2 max-w-[200px]">
                          {followUp.noteGiven || (followUp.outcome === "NOT_PICKED" ? "No Response / Missed Call" : "Pending Outcome")}
                        </p>
                      </td>
                      <td className="px-3 py-6">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600">
                            {followUp.attemptNumber}
                          </span>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attempts</p>
                        </div>
                      </td>
                      <td className="py-6 pr-8 text-right">
                        <Link 
                          href={`/leads?id=${followUp.leadId}`}
                          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95"
                        >
                          Take Action <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center flex flex-col items-center justify-center gap-4">
                      <div className="bg-slate-50 p-6 rounded-full"><CheckCircle2 className="h-10 w-10 text-slate-200" /></div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">All clear! No follow-ups found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
