"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import { 
  PhoneCall, Clock, CheckCircle2, AlertCircle, Loader2, 
  Search, Filter, ExternalLink, Calendar, ChevronRight, RotateCcw, ArrowLeft,
  Globe
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isFollowUpToday, isFollowUpOverdue, isFollowUpUpcoming } from "@/lib/follow-up-utils";

const timeToMinutes = (timeStr?: string | null) => {
  if (!timeStr) return 0;
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
  } catch { return 0; }
};

export default function FollowUpsPage() {
  const router = useRouter();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("DATE_ASC"); // Default to nearest upcoming
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

  const fetchFollowUps = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/follow-ups");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFollowUps(data);
      } else {
        console.error("Follow-ups API returned non-array data:", data);
        setFollowUps([]);
      }
    } catch (e) { 
      console.error("Failed to fetch follow-ups:", e);
      setFollowUps([]);
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchFollowUps(); }, []);

  // Remove global scrollbar for this page
  useEffect(() => {
    const main = document.querySelector('main');
    if (main) main.style.overflow = 'hidden';
    return () => {
      if (main) main.style.overflow = 'auto';
    };
  }, []);

  const filtered = followUps.filter(f => {
    const matchesSearch = 
      f.lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
      f.noteGiven?.toLowerCase().includes(search.toLowerCase());
    
    const fDate = f.nextCallDate ? new Date(f.nextCallDate) : null;
    const matchesStart = !dateRange.start || (fDate && fDate >= new Date(dateRange.start));
    const matchesEnd = !dateRange.end || (fDate && fDate <= new Date(dateRange.end + "T23:59:59"));

    const matchesUpcoming = !showUpcomingOnly || isFollowUpUpcoming(f.nextCallDate, f.completedDate);

    return matchesSearch && matchesStart && matchesEnd && matchesUpcoming;
  }).sort((a, b) => {
    // Priority: Scheduled items first
    if (a.nextCallDate && !b.nextCallDate) return -1;
    if (!a.nextCallDate && b.nextCallDate) return 1;

    if (sortBy.startsWith("DATE")) {
       if (!a.nextCallDate || !b.nextCallDate) return 0;
       
       const dateA = new Date(a.nextCallDate).setHours(0,0,0,0);
       const dateB = new Date(b.nextCallDate).setHours(0,0,0,0);
       
       if (dateA !== dateB) {
         return sortBy === "DATE_ASC" ? dateA - dateB : dateB - dateA;
       }
       
       // Same day, sort by time
       const timeA = timeToMinutes(a.nextCallTime);
       const timeB = timeToMinutes(b.nextCallTime);
       return sortBy === "DATE_ASC" ? timeA - timeB : timeB - timeA;
    }
    
    if (sortBy === "A-Z") return a.lead.customerName.localeCompare(b.lead.customerName);
    if (sortBy === "Z-A") return b.lead.customerName.localeCompare(a.lead.customerName);
    return 0;
  });

  const todayCount = followUps.filter(f => isFollowUpToday(f.nextCallDate, f.completedDate)).length;
  const overdueCount = followUps.filter(f => isFollowUpOverdue(f.nextCallDate, f.completedDate)).length;
  const upcomingCount = followUps.filter(f => isFollowUpUpcoming(f.nextCallDate, f.completedDate)).length;

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "NEW_INQUIRY": return "border-l-amber-500";
      case "FOLLOW_UP": return "border-l-sky-500";
      case "MEETING_SCHEDULED": return "border-l-indigo-500";
      case "WON_ORDER": return "border-l-emerald-500";
      case "CANCELLED": return "border-l-rose-500";
      default: return "border-l-slate-300";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4 overflow-hidden">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/5 rounded-full blur-[60px] -ml-24 -mb-24" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
               <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-Up Queue</h1>
              <p className="text-slate-500 text-sm font-medium">Pipeline engagement and scheduled callbacks</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-3">
          <div className="px-5 py-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col items-center min-w-[100px] shadow-sm shadow-indigo-50/50">
             <span className="text-xl font-black text-indigo-600 leading-none">{todayCount}</span>
             <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1.5">Today</span>
          </div>
          <div className="px-5 py-3 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col items-center min-w-[100px] shadow-sm shadow-rose-50/50">
             <span className="text-xl font-black text-rose-600 leading-none">{overdueCount}</span>
             <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mt-1.5">Overdue</span>
          </div>
          <div className={cn(
            "px-5 py-3 rounded-xl flex flex-col items-center min-w-[100px] shadow-sm transition-all cursor-pointer active:scale-95 border",
            showUpcomingOnly 
              ? "bg-amber-600 border-amber-500 shadow-amber-100" 
              : "bg-amber-50/50 border-amber-100 shadow-amber-50/50"
          )}
          onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
          >
             <span className={cn("text-xl font-black leading-none", showUpcomingOnly ? "text-white" : "text-amber-600")}>{upcomingCount}</span>
             <span className={cn("text-[9px] font-bold uppercase tracking-widest mt-1.5", showUpcomingOnly ? "text-amber-100" : "text-amber-400")}>UPCOMING</span>
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center shrink-0">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search leads or engagement notes..." 
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-5 py-3 border rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95",
              showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className="h-4 w-4" /> {showFilters ? "Hide Filters" : "Filter Queue"}
          </button>
          <button 
            onClick={() => {
              setSearch("");
              setDateRange({ start: "", end: "" });
              setSortBy("DATE_ASC");
              setShowUpcomingOnly(false);
            }}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition shadow-sm active:scale-95"
            title="Reset All"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      {showFilters && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex flex-wrap items-end gap-4">
             <div className="flex-1 min-w-[150px]">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 ml-1">Sort Queue</label>
                <select 
                  className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-2 px-3 text-xs focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all cursor-pointer"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="DATE_ASC">Schedule: Nearest First</option>
                  <option value="DATE_DESC">Schedule: Furthest First</option>
                  <option value="A-Z">Customer: A-Z</option>
                  <option value="Z-A">Customer: Z-A</option>
                </select>
             </div>
             <div className="flex-[1.5] flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 ml-1">From Date</label>
                  <input 
                    type="date"
                    className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-2 px-3 text-xs focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all"
                    value={dateRange.start}
                    onChange={e => setDateRange({...dateRange, start: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 ml-1">To Date</label>
                  <input 
                    type="date"
                    className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-2 px-3 text-xs focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 transition-all"
                    value={dateRange.end}
                    onChange={e => setDateRange({...dateRange, end: e.target.value})}
                  />
                </div>
             </div>
             <div className="flex-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1.5 ml-1">UPCOMING</label>
                <button 
                  onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
                  className={cn(
                    "w-full rounded-lg border py-2 px-3 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                    showUpcomingOnly 
                      ? "bg-amber-600 text-white border-amber-500" 
                      : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Globe className="h-3 w-3" /> {showUpcomingOnly ? "Upcoming Only" : "All Distances"}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm font-medium tracking-wide">Syncing Queue...</span>
          </div>
        ) : (
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            <table className="min-w-full divide-y divide-slate-200 table-fixed" style={{ minWidth: '800px' }}>
              <thead className="bg-slate-50/50 sticky top-0 z-20 backdrop-blur-sm">
                <tr>
                  <th scope="col" className="w-[35%] py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Name</th>
                  <th scope="col" className="w-[20%] px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Follow-Up Date</th>
                  <th scope="col" className="w-[25%] px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Outcome</th>
                  <th scope="col" className="w-[10%] px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempts</th>
                  <th scope="col" className="w-[15%] py-4 pr-8 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((followUp) => {
                    const isScheduledPast = isFollowUpOverdue(followUp.nextCallDate, followUp.completedDate);
                    const isScheduledToday = isFollowUpToday(followUp.nextCallDate, followUp.completedDate);

                    return (
                      <tr 
                        key={followUp.id} 
                        className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                      >
                        <td className="py-4 pl-0 pr-3">
                          <div className="flex items-center h-full">
                            <div className={cn("w-1 self-stretch shrink-0", getStatusBorder(followUp.lead?.status || "NEW_INQUIRY").replace('border-l-', 'bg-'))} />
                            <div className="flex items-center pl-7 gap-4">
                              <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ring-1 ring-black/5 shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md",
                                followUp.lead?.priority === "HIGH" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                              )}>
                                {followUp.lead?.customerName?.charAt(0) || "L"}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{followUp.lead?.customerName || "Unknown Lead"}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{followUp.lead?.serviceType?.replace(/_/g, " ") || "OTHER"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          {followUp.nextCallDate ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Calendar className={cn("h-3.5 w-3.5", isScheduledPast ? "text-rose-500" : "text-slate-400")} />
                                <span className={cn("text-xs font-bold tracking-tight", isScheduledPast ? "text-rose-600" : "text-slate-700")}>
                                  {format(new Date(followUp.nextCallDate), "dd MMM, yyyy")}
                                  {followUp.nextCallTime && (
                                    <span className="ml-1.5 text-indigo-500 font-black">@ {followUp.nextCallTime}</span>
                                  )}
                                </span>
                              </div>
                              {isScheduledPast && (
                                <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest border border-rose-100 shadow-sm shadow-rose-100/50">
                                  <AlertCircle className="h-2.5 w-2.5" /> Urgent Overdue
                                </span>
                              )}
                              {isScheduledToday && (
                                <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100 shadow-sm shadow-amber-100/50">
                                  <Clock className="h-2.5 w-2.5" /> Scheduled Today
                                </span>
                              )}
                              {isFollowUpUpcoming(followUp.nextCallDate, followUp.completedDate) && (
                                <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md bg-amber-50/50 text-amber-700 text-[9px] font-black uppercase tracking-widest border border-amber-100/50">
                                  <Globe className="h-2.5 w-2.5" /> UPCOMING
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 font-bold italic tracking-tight">No Target Set</span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-xs font-semibold text-slate-500 line-clamp-2 max-w-[240px] leading-relaxed group-hover:text-slate-700 transition-colors">
                            {(() => {
                              const lastFU = followUp.lead?.followUps?.[0];
                              if (lastFU) {
                                return lastFU.noteGiven || (lastFU.outcome === "NOT_PICKED" ? "No Response / Missed Call" : lastFU.outcome);
                              }
                              return "New Inquiry - Pending Initial Call";
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <span className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-700 shadow-sm group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                              {followUp.lead?._count?.followUps || 0}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] group-hover:text-slate-500 transition-colors">Calls</span>
                          </div>
                        </td>
                        <td className="py-4 pr-8 text-right">
                          <Link 
                            href={`/leads/${followUp.leadId}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all border border-indigo-100/50 shadow-sm whitespace-nowrap active:scale-95 group/btn"
                          >
                            View Details 
                            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                       <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 text-slate-200 group">
                         <CheckCircle2 className="h-8 w-8 transition-transform group-hover:scale-110 duration-500" />
                       </div>
                       <h3 className="text-base font-bold text-slate-900 tracking-tight">Task Queue Exhausted</h3>
                       <p className="text-xs text-slate-400 mt-1.5 font-bold uppercase tracking-widest">Great job! All follow-ups are completed.</p>
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
