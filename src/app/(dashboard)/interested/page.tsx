"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Star, Loader2, Phone, MessageCircle, Search, Filter, Tag, ChevronRight, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  customerName: string;
  contactNumber: string;
  serviceType: string;
  budgetRange: string | null;
  priority: string;
  status: string;
  createdAt: string;
  inquirySource: string;
  requirementDetails: string | null;
  assignedStaff?: { name: string } | null;
  followUps?: { nextCallDate: string | null; nextCallTime: string | null }[];
};

export default function InterestedLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("ALL");

  useEffect(() => {
    fetch("/api/leads?status=FOLLOW_UP")
      .then(r => r.json())
      .then(data => {
        const interested = Array.isArray(data) ? data : [];
        // Sort by nextCallDate
        const sorted = [...interested].sort((a, b) => {
          const dateA = a.followUps?.[0]?.nextCallDate ? new Date(a.followUps[0].nextCallDate).getTime() : Infinity;
          const dateB = b.followUps?.[0]?.nextCallDate ? new Date(b.followUps[0].nextCallDate).getTime() : Infinity;
          return dateA - dateB;
        });
        setLeads(sorted);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const services = ["ALL", ...new Set(leads.map(l => l.serviceType))];
  const filtered = leads.filter(l => {
    const matchSearch = l.customerName.toLowerCase().includes(search.toLowerCase()) ||
      l.contactNumber.includes(search);
    const matchService = filterService === "ALL" || l.serviceType === filterService;
    return matchSearch && matchService;
  });

  const sendWhatsApp = (lead: Lead) => {
    const msg = encodeURIComponent(
      `✅ *PNP Furniture — Special Offer*\n\nNamaste *${lead.customerName}* ji! 🙏\n\n` +
      `We have an exciting offer for *${lead.serviceType.replace(/_/g, " ")}*.\n\n` +
      `Are you still interested? We'd love to schedule a site visit at your convenience.\n\n` +
      `Feel free to reply here or call us directly. Thank you! 🪵`
    );
    window.open(`https://wa.me/${lead.contactNumber.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
            <Star className="h-6 w-6 text-amber-500 fill-amber-500" /> Interested Leads
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Qualified prospects showing engagement and purchase intent.</p>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Pipeline", val: leads.filter(l => l.status === "FOLLOW_UP").length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Scheduled Visits", val: leads.filter(l => l.status === "MEETING_SCHEDULED").length, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
          { label: "High Priority", val: leads.filter(l => l.priority === "HIGH").length, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
          { label: "Total Prospect", val: leads.length, color: "text-primary", bg: "bg-indigo-50", border: "border-indigo-100" },
        ].map((card, i) => (
          <div key={i} className={cn("p-5 rounded-xl border shadow-sm", card.bg, card.border)}>
            <p className={cn("text-2xl font-bold leading-none", card.color)}>{card.val}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters / Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm font-medium outline-none"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-hide">
          {services.map(s => (
            <button key={s} onClick={() => setFilterService(s)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                filterService === s ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700"
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
           <p className="text-xs font-medium tracking-wide">Analysing engagement data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400">
                      {lead.customerName.charAt(0)}
                   </div>
                   <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                      lead.priority === "HIGH" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-100"
                   )}>
                      {lead.priority} Priority
                   </span>
                </div>
                <div>
                   <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">{lead.customerName}</h3>
                   <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">{lead.serviceType.replace(/_/g, " ")}</p>
                </div>
                
                {lead.requirementDetails && (
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-50">
                    "{lead.requirementDetails}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 py-1">
                   <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimated Budget</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5 whitespace-nowrap">{lead.budgetRange || "Flexible"}</p>
                   </div>
                    <div>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Next Follow-up</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5 whitespace-nowrap">
                        {lead.followUps?.[0]?.nextCallDate 
                          ? `${format(new Date(lead.followUps[0].nextCallDate), "dd MMM, yy")} ${lead.followUps[0].nextCallTime || ""}`
                          : "Unscheduled"}
                      </p>
                    </div>
                  </div>

                <div className="flex gap-2 pt-2">
                   <Link href={`/leads/${lead.id}`}
                     className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2">
                     Profile
                   </Link>
                   <button onClick={() => sendWhatsApp(lead)}
                     className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 p-2.5 rounded-lg transition-all"
                     title="WhatsApp Blast">
                     <MessageCircle className="h-4 w-4" />
                   </button>
                   <a href={`tel:${lead.contactNumber}`}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition-all shadow-sm border border-indigo-500/20"
                     title="Direct Call">
                     <Phone className="h-4 w-4" />
                   </a>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center gap-4">
               <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <Star className="h-6 w-6" />
               </div>
               <div>
                  <h4 className="text-sm font-semibold text-slate-900">Zero Target Intelligence</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">No interested profiles match your current telemetry.</p>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
