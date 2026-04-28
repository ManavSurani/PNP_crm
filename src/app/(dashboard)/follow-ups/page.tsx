"use client";

import { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import { 
  PhoneCall, Clock, CheckCircle2, AlertCircle, Loader2, 
  Search, Filter, ExternalLink, Calendar, ChevronRight
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
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Follow-Up Queue</h1>
          <p className="text-slate-500 text-sm mt-1">Manage pipeline engagement and scheduled callbacks.</p>
        </div>
        <div className="relative z-10 flex gap-4">
          <div className="px-5 py-3 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center min-w-[100px]">
             <span className="text-xl font-bold text-primary leading-none">{today.length}</span>
             <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mt-1">Today</span>
          </div>
          <div className="px-5 py-3 rounded-lg bg-rose-50 border border-rose-100 flex flex-col items-center min-w-[100px]">
             <span className="text-xl font-bold text-rose-600 leading-none">{overdue.length}</span>
             <span className="text-[10px] font-bold text-rose-600/60 uppercase tracking-wider mt-1">Overdue</span>
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search leads or engagement notes..." 
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="px-5 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-600 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <Filter className="h-4 w-4" /> Advanced Filter
        </button>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm font-medium tracking-wide">Syncing Queue...</span>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Name</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Follow-Up Date</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Outcome</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempts</th>
                  <th scope="col" className="py-4 pr-8 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((followUp) => {
                  const isScheduledPast = followUp.nextCallDate && isPast(new Date(followUp.nextCallDate)) && !isToday(new Date(followUp.nextCallDate)) && !followUp.completedDate;
                  const isScheduledToday = followUp.nextCallDate && isToday(new Date(followUp.nextCallDate)) && !followUp.completedDate;

                  return (
                    <tr key={followUp.id} className="group hover:bg-slate-50 transition-all">
                      <td className="py-5 pl-8 pr-3">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ring-1 ring-black/5 shadow-sm transition-all group-hover:scale-105",
                            followUp.lead.priority === "HIGH" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                          )}>
                            {followUp.lead.customerName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 leading-none group-hover:text-primary transition-colors">{followUp.lead.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{followUp.lead.serviceType.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-5">
                        {followUp.nextCallDate ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Calendar className={cn("h-3.5 w-3.5", isScheduledPast ? "text-rose-400" : "text-slate-400")} />
                              <span className={cn("text-xs font-bold", isScheduledPast ? "text-rose-600" : "text-slate-700")}>
                                {format(new Date(followUp.nextCallDate), "dd MMM, yyyy")}
                              </span>
                            </div>
                            {isScheduledPast && (
                              <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider border border-rose-100">
                                <AlertCircle className="h-2.5 w-2.5" /> Urgent Overdue
                              </span>
                            )}
                            {isScheduledToday && (
                              <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-wider border border-amber-100">
                                <Clock className="h-2.5 w-2.5" /> Scheduled Today
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium italic">No date target</span>
                        )}
                      </td>
                      <td className="px-3 py-5">
                        <p className="text-xs font-medium text-slate-600 line-clamp-2 max-w-[240px]">
                          {followUp.noteGiven || (followUp.outcome === "NOT_PICKED" ? "No Response / Missed Call" : "Pending Outcome")}
                        </p>
                      </td>
                      <td className="px-3 py-5">
                        <div className="flex items-center gap-2.5">
                          <span className="h-7 w-7 rounded-lg bg-slate-100/50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {followUp.attemptNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Calls</span>
                        </div>
                      </td>
                      <td className="py-5 pr-8 text-right">
                        <Link 
                          href={`/leads/${followUp.leadId}`}
                          className="inline-flex items-center gap-2 text-indigo-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-xs font-bold transition-all group/btn border border-slate-200 shadow-sm"
                        >
                          View Details <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 text-slate-300">
                         <CheckCircle2 className="h-6 w-6" />
                       </div>
                       <h3 className="text-sm font-semibold text-slate-900">Task queue exhausted</h3>
                       <p className="text-xs text-slate-500 mt-1 font-medium italic">No pending follow-ups matched your current search.</p>
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
