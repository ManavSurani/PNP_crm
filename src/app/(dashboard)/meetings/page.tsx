"use client";

import { useState, useEffect } from "react";
import { format, isPast, isToday } from "date-fns";
import { 
  Calendar, MapPin, Clock, User, Phone, CheckCircle2, 
  Loader2, Search, Filter, ExternalLink, Map
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/meetings");
      setMeetings(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMeetings(); }, []);

  const filtered = meetings.filter(m => 
    m.lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
    m.address.toLowerCase().includes(search.toLowerCase())
  );

  const pending = meetings.filter(m => m.status === "SCHEDULED");
  const today = pending.filter(m => isToday(new Date(m.date)));
  const upcoming = pending.filter(m => !isPast(new Date(m.date)) && !isToday(new Date(m.date)));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-indigo-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Site Visits</h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Meeting Schedule & Consultation Management</p>
          </div>
          <div className="flex gap-3">
            {[
              { label: "Today", val: today.length, color: "bg-emerald-600 shadow-emerald-900/50" },
              { label: "Upcoming", val: upcoming.length, color: "bg-indigo-600 shadow-indigo-900/50" },
            ].map((s, i) => (
              <div key={i} className={cn("px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center min-w-[100px]", s.color)}>
                <p className="text-2xl font-black text-white leading-none">{s.val}</p>
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search address or client..." 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-600 shadow-sm hover:shadow-md transition-all">
            <Filter className="h-4 w-4" /> Today Only
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Schedule...</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-left">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-5 pl-8 pr-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client / Project</th>
                  <th className="px-3 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Schedule</th>
                  <th className="px-3 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Site Location</th>
                  <th className="px-3 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-3 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-8">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filtered.map((m) => {
                  const scheduleDate = new Date(m.date);
                  const isPastMeeting = isPast(scheduleDate) && !isToday(scheduleDate);
                  const isTodayMeeting = isToday(scheduleDate);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-all group border-l-4 border-transparent hover:border-indigo-500">
                      <td className="py-6 pl-8 pr-3">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shadow-lg",
                            isTodayMeeting ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"
                          )}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase leading-none">{m.lead.customerName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                              <Phone className="h-2 w-2" /> {m.lead.contactNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-6">
                        <div className="flex flex-col">
                          <p className="text-sm font-black text-slate-900">{format(scheduleDate, "dd MMM yyyy")}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="h-3 w-3 text-indigo-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.time}</p>
                          </div>
                          {isTodayMeeting && (
                            <span className="mt-2 text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">In Progress</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-6">
                        <div className="flex items-start gap-2 max-w-[250px]">
                          <MapPin className="h-3 w-3 text-rose-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">{m.address}</p>
                        </div>
                        <Link 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address)}`} 
                          target="_blank"
                          className="mt-2 inline-flex items-center gap-1 text-[9px] font-black text-indigo-600 hover:underline uppercase"
                        >
                          <Map className="h-2 w-2" /> View Map
                        </Link>
                      </td>
                      <td className="px-3 py-6 text-sm font-black text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", m.status === "SCHEDULED" ? "bg-amber-400 animate-pulse" : "bg-emerald-500")} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.status}</span>
                        </div>
                      </td>
                      <td className="py-6 pr-8 text-right">
                        <Link 
                          href={`/leads?id=${m.leadId}`}
                          className="inline-flex items-center gap-2 text-slate-900 hover:text-indigo-600 transition-all"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">Process Lead</span>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center flex flex-col items-center justify-center gap-4">
                      <div className="bg-slate-50 p-6 rounded-full"><MapPin className="h-10 w-10 text-slate-200" /></div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No site visits scheduled.</p>
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
