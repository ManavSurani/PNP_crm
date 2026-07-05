"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Star, Loader2, Search
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
      `Hello ${lead.customerName},\n\n` +
      `This is regarding your inquiry for ${lead.serviceType.replace(/_/g, " ")}.\n\n` +
      `We would like to know if you are still interested in proceeding further. If convenient, our team can also schedule a site visit based on your availability.\n\n` +
      `Please feel free to reply to this message or contact us for any further discussion.\n\n` +
      `Thank you,\nPNP Interior`
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
        <div className="relative z-10 bg-amber-50 border border-amber-100 px-4 py-2 rounded-lg shrink-0">
           <span className="text-amber-700 font-bold text-sm">{leads.length} Total Interested</span>
        </div>
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
                      {lead.customerName ? lead.customerName.charAt(0).toUpperCase() : "?"}
                   </div>
                </div>
                <div>
                   <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">{lead.customerName || "Unknown Customer"}</h3>
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
                     className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 p-2.5 rounded-lg transition-all flex items-center justify-center shadow-sm"
                     title="WhatsApp Blast">
                     <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                     </svg>
                   </button>
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
