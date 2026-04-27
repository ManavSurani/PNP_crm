"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Star, Loader2, Phone, MessageCircle, Search, Filter, Tag
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
        // Filter to only leads that have been called (have "INTERESTED" follow-up notes)
        // For now show all FOLLOW_UP and MEETING_SCHEDULED leads as "Interested"
        const interested = Array.isArray(data)
          ? data.filter((l: Lead) => l.status === "FOLLOW_UP" || l.status === "MEETING_SCHEDULED")
          : [];
        setLeads(interested);
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
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-amber-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight flex items-center gap-4">
            <Star className="h-8 w-8 text-amber-400 fill-amber-400" /> Interested Leads
          </h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Future customers — Festival offers, campaigns & promotions</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Pipeline", val: leads.filter(l => l.status === "FOLLOW_UP").length, color: "text-amber-600 bg-amber-50" },
          { label: "Meeting Scheduled", val: leads.filter(l => l.status === "MEETING_SCHEDULED").length, color: "text-indigo-600 bg-indigo-50" },
          { label: "High Priority", val: leads.filter(l => l.priority === "HIGH").length, color: "text-rose-600 bg-rose-50" },
          { label: "Total Interested", val: leads.length, color: "text-emerald-600 bg-emerald-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p className={cn("text-3xl font-black", card.color.split(" ")[0])}>{card.val}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-bold placeholder:text-slate-300 focus:border-indigo-600 outline-none transition-all text-sm"
            placeholder="Search by name or number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {services.map(s => (
            <button key={s} onClick={() => setFilterService(s)}
              className={cn(
                "px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all",
                filterService === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              )}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-amber-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden group">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 flex items-center gap-4">
                <div className="h-12 w-12 bg-amber-400 rounded-2xl flex items-center justify-center font-black text-slate-900 text-lg uppercase shrink-0">
                  {lead.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white uppercase truncate">{lead.customerName}</p>
                  <p className="text-xs text-slate-400 font-bold">{lead.contactNumber}</p>
                </div>
                <span className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                  lead.priority === "HIGH" ? "bg-rose-500 text-white" :
                  lead.priority === "MEDIUM" ? "bg-amber-500 text-white" : "bg-slate-600 text-white"
                )}>
                  {lead.priority}
                </span>
              </div>
              {/* Card Body */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-indigo-500 shrink-0" />
                  <p className="text-sm font-black text-slate-900 uppercase">{lead.serviceType.replace(/_/g, " ")}</p>
                </div>
                {lead.requirementDetails && (
                  <p className="text-xs text-slate-500 font-bold italic leading-relaxed line-clamp-2">"{lead.requirementDetails}"</p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Budget</p>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{lead.budgetRange || "Flexible"}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Added</p>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{format(new Date(lead.createdAt), "dd MMM yy")}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href={`/leads/${lead.id}`}
                    className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all">
                    View Profile
                  </Link>
                  <button onClick={() => sendWhatsApp(lead)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-all flex items-center gap-1.5"
                    title="Send WhatsApp Offer">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <a href={`tel:${lead.contactNumber}`}
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-3 rounded-xl transition-all flex items-center gap-1.5"
                    title="Call Now">
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-24 text-slate-300">
              <Star className="h-12 w-12 mx-auto mb-3" />
              <p className="font-black uppercase tracking-widest text-sm">No interested leads found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
