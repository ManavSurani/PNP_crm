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
      if (!res.ok) throw new Error("Failed to fetch leads");
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
      lead.status !== "WON_ORDER" &&
      lead.status !== "CANCELLED" &&
      (lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactNumber.includes(searchTerm) ||
      lead.serviceType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Lead Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your service inquiries in real-time.</p>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all active:scale-95 border border-indigo-500/20"
          >
            <Plus className="h-4 w-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:max-w-xl group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 py-2.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white transition-all outline-none"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm">
            <Filter className="h-4 w-4" /> Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm">
            <ArrowUpDown className="h-4 w-4" /> Sort
          </button>
        </div>
      </div>

      {/* Main List Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm font-medium">Loading Pipeline...</span>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Context</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignment</th>
                  <th scope="col" className="relative py-4 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 text-slate-300">
                        <Activity className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">No leads found</h3>
                      <p className="mt-1 text-xs text-slate-500">Try adjusting your search criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="group hover:bg-slate-50 transition-colors cursor-pointer relative"
                    >
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap py-5 pl-8 pr-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-semibold border border-slate-200">
                            {lead.customerName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                              {lead.customerName}
                              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                                {lead.inquirySource}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <span>{lead.contactNumber}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-5">
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          {lead.serviceType.replace("_", " ")}
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-400 font-medium flex items-center gap-1.5 max-w-[180px] truncate">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{lead.fullAddress || "Address not provided"}</span>
                        </div>
                      </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-5">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
                          lead.status === "NEW_INQUIRY" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          lead.status === "WON_ORDER" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          lead.status === "CANCELLED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-primary/10 text-primary border-primary/20"
                        )}>
                          {lead.status.replace("_", " ")}
                        </span>
                        <div className="mt-1.5 text-[10px] font-medium flex items-center gap-1.5">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            lead.priority === "HIGH" ? "bg-rose-500 animate-pulse" :
                            lead.priority === "MEDIUM" ? "bg-amber-400" : "bg-slate-300"
                          )} />
                          <span className="text-slate-400">{lead.priority}</span>
                        </div>
                      </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-5">
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                          <div className="h-5 w-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px] border border-white">
                             <User className="h-3 w-3 text-slate-500" />
                          </div>
                          {lead.assignedStaff?.name || "Unassigned"}
                        </div>
                        <div className="mt-1.5 text-[10px] font-medium text-slate-400">{format(new Date(lead.createdAt), "dd MMM yyyy")}</div>
                      </td>
                      <td className="relative whitespace-nowrap py-5 pl-3 pr-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setOpenMenuId(openMenuId === lead.id ? null : lead.id);
                             }}
                             className={cn(
                               "p-2 rounded-lg transition-all",
                               openMenuId === lead.id ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                             )}
                           >
                             <MoreHorizontal className="h-5 w-5" />
                           </button>
                           
                           {openMenuId === lead.id && (
                             <>
                               <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                               <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white text-slate-900 shadow-xl border border-slate-200 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                 <div className="p-1">
                                   <button 
                                     onClick={() => { router.push(`/leads/${lead.id}`); setOpenMenuId(null); }}
                                     className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-lg transition-colors text-left"
                                   >
                                     <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> View Profile
                                   </button>
                                   <button 
                                     onClick={() => { setEditLead(lead); setOpenMenuId(null); }}
                                     className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-lg transition-colors text-left"
                                   >
                                     <Pencil className="h-3.5 w-3.5 text-slate-400" /> Edit Lead
                                   </button>
                                   <div className="h-px bg-slate-100 my-1" />
                                   <button 
                                     onClick={() => { setDeleteId(lead.id); setOpenMenuId(null); }}
                                     className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-rose-50 text-rose-600 rounded-lg transition-colors text-left"
                                   >
                                     <Trash2 className="h-3.5 w-3.5" /> Delete
                                   </button>
                                 </div>
                               </div>
                             </>
                           )}
                           <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-all" />
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
    serviceType: "INTERIOR_DESIGN",
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
      setFormData({ customerName: "", contactNumber: "", serviceType: "INTERIOR_DESIGN", inquirySource: "WHATSAPP", priority: "MEDIUM" });
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{lead ? "Edit Lead Profile" : "Capture New Lead"}</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">{lead ? "Update contact information and service requirements" : "Add a fresh inquiry to your sales pipeline"}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900">
              <X className="h-5 w-5" />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 ml-1">Customer Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    required
                    type="text" 
                    className="block w-full rounded-lg border border-slate-200 py-2.5 pl-11 bg-white text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all outline-none"
                    placeholder="Full name"
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 ml-1">Inquiry Source</label>
                <select 
                  className="block w-full rounded-lg border border-slate-200 py-2.5 px-4 bg-white text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all appearance-none outline-none"
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

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 ml-1">Contact Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    required
                    type="text" 
                    className="block w-full rounded-lg border border-slate-200 py-2.5 pl-11 bg-white text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all outline-none"
                    placeholder="Phone number"
                    value={formData.contactNumber}
                    onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 ml-1">Service Required</label>
                <select 
                  className="block w-full rounded-lg border border-slate-200 py-2.5 px-4 bg-white text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all appearance-none outline-none"
                  value={formData.serviceType}
                  onChange={e => setFormData({...formData, serviceType: e.target.value})}
                >
                  <option value="INTERIOR_DESIGN">Interior Design</option>
                  <option value="MODULAR_KITCHEN">Modular Kitchen</option>
                  <option value="WARDROBE_PLANNING">Wardrobe Planning</option>
                  <option value="FULL_HOME_INTERIOR">Full Home Interior</option>
                  <option value="TWO_BHK_INTERIOR">2BHK Interior</option>
                  <option value="THREE_BHK_INTERIOR">3BHK Interior</option>
                  <option value="VILLA_INTERIOR">Villa Interior</option>
                  <option value="OFFICE_INTERIOR">Office Interior</option>
                  <option value="FULL_COMBO_PROJECT">Full Combo Project</option>
                  <option value="CUSTOM_FURNITURE_DESIGN">Custom Furniture Design</option>
                  <option value="MATERIAL_SUPPLY">Material Supply</option>
                  <option value="LABOUR_ONLY">Labour Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center justify-end gap-x-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 border border-indigo-500/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2">{lead ? "Save Changes" : "Create Lead"} <Check className="h-4 w-4" /></span>}
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95">
        <div className="p-8 text-center">
          <div className="bg-rose-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Delete Lead</h3>
          <p className="mt-2 text-slate-500 font-medium leading-relaxed px-4 text-sm">
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <div className="mt-8 flex flex-col gap-2">
             <button 
               disabled={isLoading} 
               onClick={onConfirm}
               className="w-full bg-rose-600 hover:bg-rose-700 py-3 rounded-lg text-white font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
               Delete Record
             </button>
             <button 
               onClick={onClose}
               className="w-full bg-slate-50 hover:bg-slate-100 py-3 rounded-lg text-slate-600 font-semibold text-sm transition-colors"
             >
               Cancel
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
