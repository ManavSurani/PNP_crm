"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, isToday } from "date-fns";
import { 
  Calendar, MapPin, Clock, User, Phone, CheckCircle2, 
  Loader2, Search, Filter, ExternalLink, Map, ChevronRight, ArrowLeft, RotateCcw,
  Globe
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<"ALL" | "TODAY" | "UPCOMING" | "OVERDUE">("ALL");

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/meetings", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMeetings(data);
      } else {
        console.error("Meetings API returned non-array data:", data);
        setMeetings([]);
      }
    } catch (e) { 
      console.error("Failed to fetch meetings:", e);
      setMeetings([]);
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMeetings(); }, []);

  const filtered = meetings.filter(m => {
    if (m.status !== "SCHEDULED") return false;
    
    // Search logic
    const searchMatch = m.lead.customerName.toLowerCase().includes(search.toLowerCase()) || 
                        m.address.toLowerCase().includes(search.toLowerCase());
    if (!searchMatch) return false;

    // Filter logic
    const scheduleDate = new Date(m.date);
    const isMeetingToday = isToday(scheduleDate);
    const isMeetingPast = isPast(scheduleDate) && !isMeetingToday;
    
    if (filterPriority === "TODAY" && !isMeetingToday) return false;
    if (filterPriority === "UPCOMING" && (isMeetingPast || isMeetingToday)) return false;
    if (filterPriority === "OVERDUE" && !isMeetingPast) return false;

    return true;
  });

  const pendingMeetings = meetings.filter(m => m.status === "SCHEDULED");
  const todayCount = pendingMeetings.filter(m => isToday(new Date(m.date))).length;
  const upcomingCount = pendingMeetings.filter(m => !isPast(new Date(m.date)) && !isToday(new Date(m.date))).length;
  const overdueCount = pendingMeetings.filter(m => isPast(new Date(m.date)) && !isToday(new Date(m.date))).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Site Visits & Consultations</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Coordinate site visits, field measurements, and client discussions.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <div 
            onClick={() => setFilterPriority(filterPriority === "TODAY" ? "ALL" : "TODAY")}
            className={cn(
              "px-5 py-3 rounded-xl flex flex-col items-center min-w-[100px] shadow-sm transition-all cursor-pointer active:scale-95 border",
              filterPriority === "TODAY" 
                ? "bg-indigo-600 border-indigo-500 shadow-indigo-100" 
                : "bg-indigo-50/50 border-indigo-100 shadow-indigo-50/50"
            )}
          >
             <span className={cn("text-xl font-black leading-none", filterPriority === "TODAY" ? "text-white" : "text-indigo-600")}>{todayCount}</span>
             <span className={cn("text-[9px] font-bold uppercase tracking-widest mt-1.5", filterPriority === "TODAY" ? "text-indigo-100" : "text-indigo-400")}>Today</span>
          </div>
          <div 
            onClick={() => setFilterPriority(filterPriority === "OVERDUE" ? "ALL" : "OVERDUE")}
            className={cn(
              "px-5 py-3 rounded-xl flex flex-col items-center min-w-[100px] shadow-sm transition-all cursor-pointer active:scale-95 border",
              filterPriority === "OVERDUE" 
                ? "bg-rose-600 border-rose-500 shadow-rose-100" 
                : "bg-rose-50/50 border-rose-100 shadow-rose-50/50"
            )}
          >
             <span className={cn("text-xl font-black leading-none", filterPriority === "OVERDUE" ? "text-white" : "text-rose-600")}>{overdueCount}</span>
             <span className={cn("text-[9px] font-bold uppercase tracking-widest mt-1.5", filterPriority === "OVERDUE" ? "text-rose-100" : "text-rose-400")}>Overdue</span>
          </div>
          <div 
            onClick={() => setFilterPriority(filterPriority === "UPCOMING" ? "ALL" : "UPCOMING")}
            className={cn(
              "px-5 py-3 rounded-xl flex flex-col items-center min-w-[100px] shadow-sm transition-all cursor-pointer active:scale-95 border",
              filterPriority === "UPCOMING" 
                ? "bg-amber-600 border-amber-500 shadow-amber-100" 
                : "bg-amber-50/50 border-amber-100 shadow-amber-50/50"
            )}
          >
             <span className={cn("text-xl font-black leading-none", filterPriority === "UPCOMING" ? "text-white" : "text-amber-600")}>{upcomingCount}</span>
             <span className={cn("text-[9px] font-bold uppercase tracking-widest mt-1.5", filterPriority === "UPCOMING" ? "text-amber-100" : "text-amber-400")}>UPCOMING</span>
          </div>
        </div>
      </div>



      {/* Toolset */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by site location or entity identifier..." 
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm font-medium outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-56">
          <button 
            onClick={() => {
              if (filterPriority === "ALL") setFilterPriority("UPCOMING");
              else if (filterPriority === "UPCOMING") setFilterPriority("OVERDUE");
              else if (filterPriority === "OVERDUE") setFilterPriority("TODAY");
              else setFilterPriority("ALL");
            }}
            className={cn(
              "w-full h-full min-h-[46px] rounded-xl border py-2 px-3 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
              filterPriority !== "ALL" 
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md" 
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
            )}
          >
            <Globe className="h-4 w-4" /> {filterPriority === "ALL" ? "All Distances" : `${filterPriority} ONLY`}
          </button>
        </div>
        {(search !== "" || filterPriority !== "ALL") && (
          <button 
            onClick={() => {
              setSearch("");
              setFilterPriority("ALL");
            }}
            className="flex items-center justify-center p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition shadow-sm shrink-0"
            title="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main Registry */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm font-medium tracking-wide">Syncing Deployment Map...</span>
          </div>
        ) : (
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200" style={{ maxHeight: 'calc(100vh - 420px)' }}>
            <table className="w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50 sticky top-0 z-20 backdrop-blur-sm">
                <tr>
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Name</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Date</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Site Address</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="py-4 pr-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((m) => {
                  const scheduleDate = new Date(m.date);
                  const isTodayMeeting = isToday(scheduleDate);

                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => router.push(m.lead.status === "WON_ORDER" ? `/customers/${m.leadId}` : `/leads/${m.leadId}`)}
                      className="group hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <td className="py-5 pl-6 pr-3">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ring-1 ring-black/5 shadow-sm transition-all group-hover:scale-110",
                            isTodayMeeting ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                          )}>
                             {m.lead.customerName ? m.lead.customerName.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{m.lead.customerName || "Unknown Customer"}</p>
                             <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                <Phone className="h-2.5 w-2.5" /> {m.lead.contactNumber}
                             </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-900">{format(scheduleDate, "dd MMM, yyyy")}</span>
                          <div className="flex items-center gap-1.5">
                             <Clock className="h-3 w-3 text-primary" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.time}</span>
                          </div>
                          {isTodayMeeting && (
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider border border-emerald-100 mt-1">
                               Active Today
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-5">
                        <div className="max-w-[200px] space-y-2">
                           <div className="flex items-start gap-2">
                              <MapPin className="h-3.5 w-3.5 text-rose-400 mt-0.5 shrink-0" />
                              <p className="text-[11px] font-semibold text-slate-600 leading-relaxed uppercase line-clamp-2">{m.address}</p>
                           </div>
                           <Link 
                             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address)}`} 
                             target="_blank"
                             onClick={(e) => e.stopPropagation()}
                             className="inline-flex items-center gap-1 text-[9px] font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded transition-all uppercase tracking-wider"
                           >
                             <Map className="h-2.5 w-2.5" /> Launch Navigation
                           </Link>
                        </div>
                      </td>
                      <td className="px-3 py-5">
                        <div className="flex items-center gap-2">
                           <div className={cn("h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0)] transition-all", 
                              m.status === "SCHEDULED" ? "bg-amber-400 animate-pulse shadow-amber-400/50" : "bg-emerald-500 shadow-emerald-500/50"
                           )} />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{m.status}</span>
                        </div>
                      </td>
                      <td className="py-5 pr-6 text-right">
                        <Link 
                          href={m.lead.status === "WON_ORDER" ? `/customers/${m.leadId}` : `/leads/${m.leadId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all border border-indigo-100/50 shadow-sm whitespace-nowrap active:scale-95 group/btn"
                        >
                          View {m.lead.status === "WON_ORDER" ? "Customer" : "Lead"} <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 text-slate-300">
                         <MapPin className="h-6 w-6" />
                       </div>
                       <h3 className="text-sm font-semibold text-slate-900">Deployment queue clear</h3>
                       <p className="text-xs text-slate-500 mt-1 font-medium italic">No scheduled site visits match your search parameters.</p>
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
