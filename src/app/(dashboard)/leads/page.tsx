"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Plus, Search, MoreHorizontal, User, Phone, MapPin, Loader2, 
  Filter, ArrowUpDown, ChevronRight, Activity, Zap, X, CheckCircle2, Check,
  Trash2, Pencil, ExternalLink, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  customerName: string;
  contactNumber: string;
  alternateNumber: string | null;
  fullAddress: string | null;
  inquirySource: string;
  serviceType: string;
  priority: string;
  status: string;
  createdAt: string;
  assignedStaff?: { name: string } | null;
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // New States for Actions
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        fetchLeads();
        setDeleteId(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLeads = leads.filter(
    (lead) => 
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactNumber.includes(searchTerm) ||
      lead.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900 p-10 rounded-3xl shadow-2xl text-white relative overflow-hidden border-b-4 border-indigo-600">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase leading-none">Lead Pipeline</h1>
          <p className="text-indigo-200 font-bold max-w-sm text-xs uppercase tracking-widest mt-3 opacity-80">
            Real-time Furniture Inquiry Management
          </p>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-flex items-center gap-3 rounded-2xl bg-indigo-600 px-8 py-5 text-sm font-black text-white shadow-2xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Establish Entry
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:max-w-xl group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full rounded-2xl border-2 border-slate-100 py-4.5 pl-14 pr-4 text-slate-900 font-black shadow-sm placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 sm:text-sm bg-white transition-all outline-none"
            placeholder="Search by customer name, phone number, or project type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-600 hover:border-indigo-200 transition shadow-sm uppercase tracking-widest">
            <Filter className="h-4 w-4" /> Filters
          </button>
          <button className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-600 hover:border-indigo-200 transition shadow-sm uppercase tracking-widest">
            <ArrowUpDown className="h-4 w-4" /> Sort
          </button>
        </div>
      </div>

      {/* Main List Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
            <span className="font-bold uppercase tracking-widest text-xs">Synchronizing Pipeline...</span>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[500px]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="py-6 pl-10 pr-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Detail</th>
                  <th scope="col" className="px-3 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Requirement Context</th>
                  <th scope="col" className="px-3 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pipeline Status</th>
                  <th scope="col" className="px-3 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Owner / Date</th>
                  <th scope="col" className="relative py-6 pl-3 pr-10"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Activity className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tighter">Empty Pipeline</h3>
                      <p className="mt-1 text-sm text-slate-500 font-medium italic">No leads match your current search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="group hover:bg-slate-50/80 transition-all cursor-pointer relative"
                    >
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap py-7 pl-10 pr-3">
                        <div className="flex items-center">
                          <div className="h-14 w-14 flex-shrink-0 bg-slate-900 rounded-2xl flex items-center justify-center transform group-hover:rotate-3 transition-all shadow-xl border-4 border-white ring-1 ring-slate-100">
                            <span className="text-white font-black text-xl leading-none uppercase">{lead.customerName.charAt(0)}</span>
                          </div>
                          <div className="ml-6">
                            <div className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-3 tracking-tighter">
                              {lead.customerName}
                              <span className="inline-flex items-center rounded-lg bg-indigo-100 px-3 py-1 text-[10px] font-black text-indigo-700 uppercase tracking-widest ring-1 ring-indigo-200">
                                {lead.inquirySource}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600 font-bold flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Phone className="h-4 w-4 text-indigo-500" />
                              <span>{lead.contactNumber}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-7">
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                          {lead.serviceType.replace("_", " ")}
                        </div>
                        <div className="mt-2 text-xs text-slate-500 font-black flex items-center gap-2 max-w-[240px] truncate opacity-60">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                          <span className="truncate">{lead.fullAddress || "Direct Location Unknown"}</span>
                        </div>
                      </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-7">
                        <span className={cn(
                          "inline-flex items-center rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ring-2",
                          lead.status === "NEW_INQUIRY" ? "bg-amber-500 text-white ring-amber-400/20" :
                          lead.status === "WON_ORDER" ? "bg-emerald-500 text-white ring-emerald-400/20" :
                          lead.status === "CANCELLED" ? "bg-rose-500 text-white ring-rose-400/20" :
                          "bg-sky-500 text-white ring-sky-400/20"
                        )}>
                          {lead.status.replace("_", " ")}
                        </span>
                        <div className="mt-2.5 text-[10px] font-black flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            lead.priority === "HIGH" ? "bg-rose-600 shadow-md animate-pulse" :
                            lead.priority === "MEDIUM" ? "bg-amber-500" : "bg-slate-300"
                          )} />
                          <span className={cn(
                            lead.priority === "HIGH" ? "text-rose-700" :
                            lead.priority === "MEDIUM" ? "text-amber-700" : "text-slate-500"
                          )}>
                            {lead.priority} PRIORITY
                          </span>
                        </div>
                      </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-7 text-sm">
                        <div className="font-black text-slate-900 flex items-center gap-2">
                          <div className="h-6 w-6 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-200">
                             <User className="h-3 w-3 text-slate-500" />
                          </div>
                          {lead.assignedStaff?.name || "Unassigned"}
                        </div>
                        <div className="mt-2 text-[10px] font-black text-slate-400 tracking-widest uppercase">{format(new Date(lead.createdAt), "dd MMM yyyy")}</div>
                      </td>
                      <td className="relative whitespace-nowrap py-7 pl-3 pr-10 text-right">
                        <div className="flex items-center justify-end gap-3 text-slate-300">
                           <div className="relative">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setOpenMenuId(openMenuId === lead.id ? null : lead.id);
                               }}
                               className={cn(
                                 "p-3 rounded-2xl transition-all shadow-sm ring-1",
                                 openMenuId === lead.id ? "bg-slate-900 text-white ring-slate-800" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100 ring-slate-200"
                               )}
                             >
                               <MoreHorizontal className="h-6 w-6" />
                             </button>
                             
                             {openMenuId === lead.id && (
                               <>
                                 <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                 <div className="absolute right-0 mt-3 w-56 rounded-[2rem] bg-slate-900 text-white shadow-2xl ring-4 ring-slate-500/10 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                   <div className="p-3 space-y-1">
                                     <button 
                                       onClick={() => { router.push(`/leads/${lead.id}`); setOpenMenuId(null); }}
                                       className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest hover:bg-white/10 rounded-2xl transition-colors text-left"
                                     >
                                       <ExternalLink className="h-4 w-4 text-indigo-400" /> View Profile
                                     </button>
                                     <button 
                                       onClick={() => { setEditLead(lead); setOpenMenuId(null); }}
                                       className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest hover:bg-white/10 rounded-2xl transition-colors text-left"
                                     >
                                       <Pencil className="h-4 w-4 text-amber-400" /> Modify File
                                     </button>
                                     <div className="h-px bg-white/10 mx-3 my-1" />
                                     <button 
                                       onClick={() => { setDeleteId(lead.id); setOpenMenuId(null); }}
                                       className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 text-rose-400 rounded-2xl transition-colors text-left"
                                     >
                                       <Trash2 className="h-4 w-4" /> Purge Entry
                                     </button>
                                   </div>
                                 </div>
                               </>
                             )}
                           </div>
                           <ChevronRight onClick={() => router.push(`/leads/${lead.id}`)} className="h-6 w-6 group-hover:text-indigo-600 transition-all translate-x-0 group-hover:translate-x-2" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateOrEditModal 
        isOpen={isModalOpen || !!editLead} 
        lead={editLead}
        onClose={() => {
          setIsModalOpen(false);
          setEditLead(null);
        }} 
        onSuccess={() => {
          setIsModalOpen(false);
          setEditLead(null);
          fetchLeads();
        }}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteId}
        isLoading={isDeleting}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function CreateOrEditModal({ isOpen, lead, onClose, onSuccess }: { isOpen: boolean, lead: Lead | null, onClose: () => void, onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    contactNumber: "",
    serviceType: "SOFA_WORK",
    inquirySource: "WHATSAPP",
    priority: "MEDIUM"
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        customerName: lead.customerName,
        contactNumber: lead.contactNumber,
        serviceType: lead.serviceType,
        inquirySource: lead.inquirySource,
        priority: lead.priority
      });
    } else {
      setFormData({ customerName: "", contactNumber: "", serviceType: "SOFA_WORK", inquirySource: "WHATSAPP", priority: "MEDIUM" });
    }
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
      const method = lead ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden ring-1 ring-slate-200 animate-in zoom-in-95 duration-300">
        <div className="px-12 py-10 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{lead ? "Modify Entry" : "New Entry Capture"}</h3>
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mt-3 opacity-70">{lead ? "Adjusting existing client profile" : "Expand your business pipeline"}</p>
            </div>
            <button onClick={onClose} className="p-4 hover:bg-slate-200 rounded-full transition-all group shadow-sm">
              <X className="h-6 w-6 text-slate-400 group-hover:text-slate-900" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Customer Name *</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    required
                    type="text" 
                    className="block w-full rounded-2xl border-2 border-slate-100 py-4.5 pl-14 bg-white text-slate-900 font-black placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 sm:text-base transition-all outline-none"
                    placeholder="e.g. Manav Surani"
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Inquiry Source</label>
                <select 
                  className="block w-full rounded-2xl border-2 border-slate-100 py-4.5 pl-5 pr-10 bg-white text-slate-900 font-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 sm:text-base transition-all appearance-none outline-none"
                  value={formData.inquirySource}
                  onChange={e => setFormData({...formData, inquirySource: e.target.value})}
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="WEBSITE">Website</option>
                  <option value="DIRECT_CALL">Direct Call</option>
                  <option value="WALK_IN">Walk In</option>
                </select>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Contact Phone *</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    required
                    type="text" 
                    className="block w-full rounded-2xl border-2 border-slate-100 py-4.5 pl-14 bg-white text-slate-900 font-black placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 sm:text-base transition-all outline-none"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.contactNumber}
                    onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Service Required</label>
                <select 
                  className="block w-full rounded-2xl border-2 border-slate-100 py-4.5 pl-5 pr-10 bg-white text-slate-900 font-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 sm:text-base transition-all appearance-none outline-none"
                  value={formData.serviceType}
                  onChange={e => setFormData({...formData, serviceType: e.target.value})}
                >
                  <option value="SOFA_WORK">Sofa Work</option>
                  <option value="MODULAR_KITCHEN">Modular Kitchen</option>
                  <option value="WARDROBE">Wardrobe</option>
                  <option value="INTERIOR_DESIGN">Interior Design</option>
                  <option value="OFFICE_FURNITURE">Office Setup</option>
                  <option value="REPAIR_SERVICE">Repair / Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-10 flex items-center justify-end gap-x-8 border-t-2 border-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-[2rem] bg-slate-900 px-12 py-5 text-sm font-black text-white shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-3 text-white">{lead ? "Commit Changes" : "Record Entry"} <Check className="h-5 w-5 text-emerald-400" /></span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ isOpen, isLoading, onClose, onConfirm }: { isOpen: boolean, isLoading: boolean, onClose: () => void, onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-10 text-center">
          <div className="bg-rose-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-rose-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase">Confirm Purge</h3>
          <p className="mt-4 text-slate-500 font-bold leading-relaxed px-4 text-sm">
            Are you absolutely sure you want to permanently delete this lead? This action is irreversible.
          </p>
          <div className="mt-10 flex flex-col gap-3">
             <button 
               disabled={isLoading} 
               onClick={onConfirm}
               className="w-full bg-rose-600 hover:bg-rose-700 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
               Burn Record
             </button>
             <button 
               onClick={onClose}
               className="w-full bg-slate-50 hover:bg-slate-100 py-5 rounded-2xl text-slate-600 font-black uppercase tracking-widest text-xs transition-colors"
             >
               Abort Purge
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
