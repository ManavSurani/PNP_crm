"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Star, Loader2, Search, Archive, RotateCcw, ArrowRight, Bell, Clock, MapPin, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  customerName: string;
  contactNumber: string;
  fullAddress?: string | null;
  serviceType: string;
  budgetRange: string | null;
  priority: string;
  status: string;
  isHotLead?: boolean;
  isArchived?: boolean;
  archivedAt?: string | null;
  archiveReason?: string | null;
  tentativeDate?: string | null;
  createdAt: string;
  inquirySource: string;
  requirementDetails: string | null;
  assignedStaff?: { name: string } | null;
  followUps?: { nextCallDate: string | null; nextCallTime: string | null }[];
};

export default function InterestedLeadsPage() {
  const [activeTab, setActiveTab] = useState<"INTERESTED" | "ARCHIVED">("INTERESTED");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReactivatingId, setIsReactivatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("ALL");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "archived") {
        setActiveTab("ARCHIVED");
      }
    }
  }, []);

  const loadData = () => {
    setIsLoading(true);
    const endpoint = activeTab === "INTERESTED" 
      ? "/api/leads?status=FOLLOW_UP" 
      : "/api/leads?archived=true";

    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        if (activeTab === "INTERESTED") {
          // Sort by nextCallDate
          const sorted = [...list].sort((a, b) => {
            const dateA = a.followUps?.[0]?.nextCallDate ? new Date(a.followUps[0].nextCallDate).getTime() : Infinity;
            const dateB = b.followUps?.[0]?.nextCallDate ? new Date(b.followUps[0].nextCallDate).getTime() : Infinity;
            return dateA - dateB;
          });
          setLeads(sorted);
        } else {
          // Archived sorted by archivedAt or createdAt
          setLeads(list);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleReactivate = async (id: string) => {
    setIsReactivatingId(id);
    try {
      const res = await fetch(`/api/leads/${id}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactivationNote: "Reactivated from Passive Archive" })
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed to reactivate: ${err.error || "Unknown Error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Could not reactivate.");
    } finally {
      setIsReactivatingId(null);
    }
  };

  const services = ["ALL", ...new Set(leads.map(l => l.serviceType))];
  const filtered = leads.filter(l => {
    const matchSearch = (l.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.contactNumber || "").includes(search);
    const matchService = filterService === "ALL" || l.serviceType === filterService;
    return matchSearch && matchService;
  });

  const sendWhatsApp = (lead: Lead) => {
    let msgText = "";
    if (activeTab === "ARCHIVED") {
      msgText = 
        `Hello ${lead.customerName || "Sir/Madam"},\n\n` +
        `Hope you are doing well!\n\n` +
        `Just a gentle check-in regarding your ${lead.serviceType?.replace(/_/g, " ") || "Interior"} requirement with PNP Interior. Whenever your site is ready for interior work or you need any estimates, feel free to reach out to us.\n\n` +
        `Have a wonderful day ahead!\n` +
        `PNP Interior`;
    } else {
      msgText = 
        `Hello ${lead.customerName},\n\n` +
        `This is regarding your inquiry for ${lead.serviceType?.replace(/_/g, " ") || "Interior Design"}.\n\n` +
        `We would like to know if you are still interested in proceeding further. If convenient, our team can also schedule a site visit based on your availability.\n\n` +
        `Please feel free to reply to this message or contact us for any further discussion.\n\n` +
        `Thank you,\nPNP Interior`;
    }
    const msg = encodeURIComponent(msgText);
    window.open(`https://wa.me/${lead.contactNumber.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header with View Toggle in Top Left Corner */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className={cn(
          "absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24 transition-all duration-500",
          activeTab === "INTERESTED" ? "bg-amber-400" : "bg-indigo-600"
        )} />
        
        <div className="relative z-10 space-y-2">
          {/* In-Page View Switcher in Left Corner */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-inner">
            <button
              onClick={() => setActiveTab("INTERESTED")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer",
                activeTab === "INTERESTED"
                  ? "bg-amber-400 text-white shadow-sm shadow-amber-200"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Star className={cn("h-3.5 w-3.5", activeTab === "INTERESTED" ? "fill-white" : "")} /> 
              Interested Leads
            </button>
            <button
              onClick={() => setActiveTab("ARCHIVED")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer",
                activeTab === "ARCHIVED"
                  ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Archive className="h-3.5 w-3.5" /> 
              Archived Leads
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {activeTab === "INTERESTED" ? (
                <>
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" /> 
                  Interested Leads
                </>
              ) : (
                <>
                  <Archive className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> 
                  Archived Leads <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Passively Active</span>
                </>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
              {activeTab === "INTERESTED" 
                ? "Qualified prospects showing engagement and purchase intent."
                : "Passively active prospects waiting to contact us directly. Paused from daily follow-ups."}
            </p>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          {activeTab === "INTERESTED" ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-500/30 px-4 py-2 rounded-lg">
              <span className="text-amber-700 dark:text-amber-300 font-bold text-sm">{leads.length} Total Interested</span>
            </div>
          ) : (
            <div className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-sm border border-slate-800 dark:border-slate-700">
              <span className="font-bold text-sm">{leads.length} Total Archived</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters / Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#161f32] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all text-sm font-medium outline-none"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto scrollbar-hide">
          {services.map(s => (
            <button key={s} onClick={() => setFilterService(s)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
                filterService === s 
                  ? "bg-white dark:bg-indigo-600 text-primary dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
           <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
           <p className="text-xs font-medium tracking-wide">
             {activeTab === "INTERESTED" ? "Analysing engagement data..." : "Retrieving passive archives..."}
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 transition-all overflow-hidden group">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="relative h-10 w-10 shrink-0">
                     <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                        {lead.customerName ? lead.customerName.charAt(0).toUpperCase() : "?"}
                     </div>
                     {lead.isHotLead && (
                       <span className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white dark:border-slate-900 shadow-sm">
                         <Star className="h-2.5 w-2.5 text-white fill-white" />
                       </span>
                     )}
                   </div>
                   {activeTab === "ARCHIVED" && (
                     <div className="flex flex-col items-end gap-1">
                       <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                         <Archive className="h-3 w-3 text-slate-500 dark:text-slate-400" /> {lead.archiveReason || "Client Will Call"}
                       </span>
                       {lead.archivedAt && (
                         <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                           {(() => {
                             const days = Math.floor((new Date().getTime() - new Date(lead.archivedAt).getTime()) / (1000 * 60 * 60 * 24));
                             return days === 0 ? "Archived today" : days === 1 ? "Sleeping 1 day" : `Sleeping ${days} days`;
                           })()}
                         </span>
                       )}
                     </div>
                   )}
                </div>
                <div>
                   <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">{lead.customerName || "Unknown Customer"}</h3>
                   <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mt-1">{lead.serviceType?.replace(/_/g, " ") || "Other"}</p>
                </div>
                
                {lead.requirementDetails && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic line-clamp-2 bg-slate-50/50 dark:bg-[#161f32]/50 p-2.5 rounded-lg border border-slate-50 dark:border-slate-800">
                    "{lead.requirementDetails}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 py-1 bg-slate-50/50 dark:bg-[#161f32]/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                   <div>
                      {activeTab === "INTERESTED" ? (
                        lead.fullAddress && lead.fullAddress.trim() ? (
                          <>
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Site Location</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1 truncate" title={lead.fullAddress}>
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{lead.fullAddress}</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1 truncate">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{lead.contactNumber}</span>
                            </p>
                          </>
                        )
                      ) : (
                        <>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Archived</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 whitespace-nowrap">
                            {lead.archivedAt ? format(new Date(lead.archivedAt), "dd MMM, yyyy") : format(new Date(lead.createdAt), "dd MMM, yyyy")}
                          </p>
                        </>
                      )}
                   </div>
                    <div>
                      {activeTab === "INTERESTED" ? (
                        <>
                          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Next Follow-up</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 whitespace-nowrap">
                            {lead.followUps?.[0]?.nextCallDate 
                              ? `${format(new Date(lead.followUps[0].nextCallDate), "dd MMM, yy")} ${lead.followUps[0].nextCallTime || ""}`
                              : "Unscheduled"}
                          </p>
                        </>
                      ) : (
                        lead.tentativeDate ? (
                          <>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Expected Possession</p>
                            <div className="mt-0.5 flex flex-col items-start gap-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                                {format(new Date(lead.tentativeDate), "MMM yyyy")}
                              </p>
                              {new Date(lead.tentativeDate).getTime() <= new Date().getTime() && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                  <Bell className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Due Check-in
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Next Action</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 whitespace-nowrap flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>Client Will Call</span>
                            </p>
                          </>
                        )
                      )}
                    </div>
                  </div>

                <div className="flex gap-2 pt-2">
                   {activeTab === "ARCHIVED" && (
                     <button
                       disabled={isReactivatingId === lead.id}
                       onClick={() => handleReactivate(lead.id)}
                       className="flex-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                       title="Reactivate lead back to active pipeline"
                     >
                       {isReactivatingId === lead.id ? (
                         <Loader2 className="h-3.5 w-3.5 animate-spin" />
                       ) : (
                         <RotateCcw className="h-3.5 w-3.5" />
                       )}
                       Reactivate
                     </button>
                   )}
                   <Link href={`/leads/${lead.id}`}
                     className={cn(
                       "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5",
                       activeTab === "ARCHIVED" ? "px-4" : "flex-1"
                     )}>
                     Profile
                   </Link>
                   <button onClick={() => sendWhatsApp(lead)}
                     className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/30 p-2.5 rounded-lg transition-all flex items-center justify-center shadow-sm cursor-pointer"
                     title="WhatsApp Message">
                     <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                     </svg>
                   </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-4">
               <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                  {activeTab === "INTERESTED" ? <Star className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
               </div>
               <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {activeTab === "INTERESTED" ? "Zero Interested Leads" : "Zero Archived Leads"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {activeTab === "INTERESTED" 
                      ? "No active interested profiles match your current criteria."
                      : "No leads are currently in the passive archive."}
                  </p>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
