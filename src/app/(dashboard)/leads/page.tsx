"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Plus, Search, MoreHorizontal, User, Phone, MapPin, Loader2, 
  Filter, ArrowUpDown, ChevronRight, Activity, Zap, X, CheckCircle2, Check,
  Trash2, Pencil, ExternalLink, AlertTriangle, RotateCcw, ArrowLeft, Star, Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Lead = {
  id: string;
  customerName: string;
  contactNumber: string;
  alternateNumber: string | null;
  fullAddress: string | null;
  inquirySource: string;
  referenceName?: string | null;
  serviceType: string;
  status: string;
  isHotLead: boolean;
  isArchived?: boolean;
  archivedAt?: string | null;
  archiveReason?: string | null;
  tentativeDate?: string | null;
  createdAt: string;
  assignedStaff?: { name: string } | null;
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "ALL",
    source: "ALL",
    service: "ALL",
  });
  const [sortBy, setSortBy] = useState("NEWEST");
  
  // New States for Actions
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads?includeArchived=true");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      } else {
        console.error("Leads API returned non-array data:", data);
        setLeads([]);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    // Auto-apply filters from URL to skip the need for useSearchParams
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status");
      if (statusParam) {
        setFilters(prev => ({ ...prev, status: statusParam }));
        setShowFilters(true);
      }
    }
  }, []);

  // Remove global scrollbar for this page
  useEffect(() => {
    const main = document.querySelector('main');
    if (main) main.style.overflow = 'hidden';
    return () => {
      if (main) main.style.overflow = 'auto';
    };
  }, []);

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

  const handleDelete = async (permanent = false) => {
    const id = permanent ? permanentDeleteId : deleteId;
    if (!id) return;
    setIsDeleting(true);
    try {
      const url = `/api/leads/${id}${permanent ? '?permanent=true' : ''}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        fetchLeads();
        setDeleteId(null);
        setPermanentDeleteId(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async (reason?: string, tentativeDate?: string | null) => {
    if (!archiveId) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/leads/${archiveId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archiveReason: reason || "Client Will Call",
          tentativeDate: tentativeDate || null
        })
      });
      if (res.ok) {
        fetchLeads();
        setArchiveId(null);
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsArchiving(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactNumber.includes(searchTerm) ||
      lead.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    // SUPPORT HOT_LEAD & ARCHIVED FILTER OPTIONS
    const matchesStatus = 
      filters.status === "HOT_LEAD" ? (lead.isHotLead && !lead.isArchived) :
      filters.status === "ARCHIVED" ? !!lead.isArchived :
      filters.status === "ALL" ? (!lead.isArchived && lead.status !== "WON_ORDER" && lead.status !== "CANCELLED") :
      filters.status === "ACTIVE" ? (!lead.isArchived && (lead.status === "FOLLOW_UP" || lead.status === "MEETING_SCHEDULED")) :
      (!lead.isArchived && lead.status === filters.status);
    const matchesSource = filters.source === "ALL" || lead.inquirySource === filters.source;
    const matchesService = filters.service === "ALL" || lead.serviceType?.toLowerCase().replace(/_/g, " ") === filters.service.toLowerCase().replace(/_/g, " ");

    return matchesSearch && matchesStatus && matchesSource && matchesService;
  }).sort((a, b) => {
    if (sortBy === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "A-Z") return a.customerName.localeCompare(b.customerName);
    if (sortBy === "Z-A") return b.customerName.localeCompare(a.customerName);
    if (sortBy === "STATUS") {
      // HOT LEADS ALWAYS APPEAR FIRST AT THE TOP
      if (a.isHotLead !== b.isHotLead) return a.isHotLead ? -1 : 1;

      const priority: Record<string, number> = {
        "NEW_INQUIRY": 1,
        "FOLLOW_UP": 2,
        "MEETING_SCHEDULED": 3,
        "WON_ORDER": 4,
        "CANCELLED": 5
      };
      const prioA = priority[a.status] || 99;
      const prioB = priority[b.status] || 99;
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4 overflow-hidden">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Lead Pipeline</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and track your service inquiries in real-time.</p>
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
      <div className="flex flex-col md:flex-row items-center gap-4 shrink-0">
        <div className="relative flex-grow w-full md:max-w-xl group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 pl-11 pr-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white dark:bg-[#161f32] transition-all outline-none"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition shadow-sm",
              showFilters 
                ? "bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Filter className="h-4 w-4" /> {showFilters ? "Hide Filters" : "Filters"}
          </button>
          { (searchTerm !== "" || filters.status !== "ALL" || filters.source !== "ALL" || filters.service !== "ALL" || sortBy !== "NEWEST") && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilters({ status: "ALL", source: "ALL", service: "ALL" });
                setSortBy("NEWEST");
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/8 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Compact Filter Options */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm animate-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1 ml-1">Status</label>
              <select 
                className="w-full rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-[#1a233a] focus:border-primary outline-none transition-all cursor-pointer"
                value={filters.status}
                onChange={e => setFilters({...filters, status: e.target.value})}
              >
                <option value="ALL">Active Only</option>
                <option value="HOT_LEAD">🔥 Hot Lead</option>
                <option value="ARCHIVED">📦 Archived Leads</option>
                <option value="NEW_INQUIRY">New Inquiry</option>
                <option value="ACTIVE">Current Pipeline</option>
                <option value="FOLLOW_UP">Follow Up</option>
                <option value="MEETING_SCHEDULED">Visit Scheduled</option>
              </select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1 ml-1">Source</label>
              <select 
                className="w-full rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-[#1a233a] focus:border-primary outline-none transition-all cursor-pointer"
                value={filters.source}
                onChange={e => setFilters({...filters, source: e.target.value})}
              >
                <option value="ALL">All Sources</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WEBSITE">Website</option>
                <option value="DIRECT_CALL">Direct Call</option>
                <option value="WALK_IN">Walk In</option>
                <option value="THROUGH_REFERENCE">Reference</option>
              </select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1 ml-1">Sort</label>
              <select 
                className="w-full rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-[#1a233a] focus:border-primary outline-none transition-all cursor-pointer"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="STATUS">Pipeline Order</option>
                <option value="A-Z">Name: A-Z</option>
                <option value="Z-A">Name: Z-A</option>
              </select>
            </div>
            <div className="flex-[1.5]">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1 ml-1">Service Context</label>
              <select 
                className="w-full rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-[#1a233a] focus:border-primary outline-none transition-all cursor-pointer"
                value={filters.service}
                onChange={e => setFilters({...filters, service: e.target.value})}
              >
                <option value="ALL">All Services</option>
                <option value="Interior Design">Interior Design</option>
                <option value="2BHK Interior">2BHK Interior</option>
                <option value="3BHK Interior">3BHK Interior</option>
                <option value="4BHK Interior">4BHK Interior</option>
                <option value="Raw house">Raw house</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main List Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm font-medium">Loading Pipeline...</span>
          </div>
        ) : (
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 table-fixed" style={{ minWidth: '800px' }}>
              <thead className="bg-slate-50/90 dark:bg-[#161f32]/95 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-sm">
                <tr>
                  <th scope="col" className="w-[35%] py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="w-[30%] px-3 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service Context</th>
                  <th 
                    scope="col" 
                    className="w-[15%] px-3 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 group transition-colors"
                    onClick={() => setSortBy(sortBy === "STATUS" ? "NEWEST" : "STATUS")}
                  >
                    <div className="flex items-center gap-1.5">
                      STATUS
                      <ArrowUpDown className={cn("h-3 w-3 transition-opacity", sortBy === "STATUS" ? "text-indigo-600 dark:text-indigo-400 opacity-100" : "opacity-0 group-hover:opacity-100")} />
                    </div>
                  </th>
                  <th scope="col" className="w-[15%] px-3 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignment</th>
                  <th scope="col" className="w-[5%] relative py-4 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-500">
                        <Activity className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No leads found</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try adjusting your search criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td 
                        onClick={() => router.push(`/leads/${lead.id}`)} 
                        className="whitespace-nowrap py-4 pl-0 pr-3"
                      >
                        <div className="flex items-center h-full">
                          <div className={cn("w-1 self-stretch shrink-0", getStatusBorder(lead.status).replace('border-l-', 'bg-'))} />
                          <div className="flex items-center pl-7">
                            {/* Avatar with overlapping Star badge */}
                            <div className="relative h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                                {lead.customerName ? lead.customerName.charAt(0) : "?"}
                              </div>
                              {lead.isHotLead && (
                                <span className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-white dark:border-slate-900 shadow-sm">
                                  <Star className="h-2.5 w-2.5 text-white fill-white" />
                                </span>
                              )}
                            </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors flex items-center gap-2">
                              {lead.customerName || "Unknown Customer"}
                              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 px-2 py-0.5">
                                {lead.inquirySource === "THROUGH_REFERENCE" ? "REFERENCE" : lead.inquirySource}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <span>{lead.contactNumber}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-4">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          {lead.serviceType.replace("_", " ")}
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-400 font-medium flex items-center gap-1.5 max-w-[180px] truncate">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{lead.fullAddress || "Address not provided"}</span>
                        </div>
                      </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-4">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
                          lead.isArchived ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700" :
                          lead.status === "NEW_INQUIRY" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30" :
                          lead.status === "WON_ORDER" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" :
                          lead.status === "CANCELLED" ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30" :
                          "bg-primary/10 dark:bg-indigo-950/40 text-primary dark:text-indigo-300 border-primary/20 dark:border-indigo-500/30"
                        )}>
                          {lead.isArchived ? (lead.archiveReason || "Archived") : lead.status.replace("_", " ")}
                        </span>
                      </td>
                      <td onClick={() => router.push(`/leads/${lead.id}`)} className="whitespace-nowrap px-3 py-4">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                          <div className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] border border-white dark:border-slate-700">
                             <User className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                          </div>
                          {lead.assignedStaff?.name || "Unassigned"}
                        </div>
                        <div className="mt-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">{format(new Date(lead.createdAt), "dd MMM yyyy")}</div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setOpenMenuId(openMenuId === lead.id ? null : lead.id);
                             }}
                             className={cn(
                               "p-2 rounded-lg transition-all",
                               openMenuId === lead.id 
                                 ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white" 
                                 : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                             )}
                           >
                             <MoreHorizontal className="h-5 w-5" />
                           </button>
                           
                           {openMenuId === lead.id && (
                             <>
                               <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                               <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl border border-slate-200 dark:border-white/10 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                 <div className="p-1">
                                   <button 
                                     onClick={() => { router.push(`/leads/${lead.id}`); setOpenMenuId(null); }}
                                     className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-lg transition-colors text-left cursor-pointer"
                                   >
                                     <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> View Profile
                                   </button>
                                   <button 
                                     onClick={() => { setEditLead(lead); setOpenMenuId(null); }}
                                     className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-lg transition-colors text-left cursor-pointer"
                                   >
                                     <Pencil className="h-3.5 w-3.5 text-slate-400" /> Edit Lead
                                   </button>
                                   <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                   {lead.isArchived ? (
                                     <button 
                                       onClick={async () => {
                                         setOpenMenuId(null);
                                         await fetch(`/api/leads/${lead.id}/reactivate`, { method: "POST" });
                                         fetchLeads();
                                         window.dispatchEvent(new CustomEvent("refresh-notifications"));
                                       }}
                                       className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors text-left cursor-pointer"
                                     >
                                       <RotateCcw className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Reactivate Lead
                                     </button>
                                   ) : (
                                     <button 
                                       onClick={() => { setArchiveId(lead.id); setOpenMenuId(null); }}
                                       className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors text-left cursor-pointer"
                                     >
                                       <Archive className="h-3.5 w-3.5 text-slate-400" /> Archive Lead
                                     </button>
                                   )}
                                   <button 
                                     onClick={() => { setPermanentDeleteId(lead.id); setOpenMenuId(null); }}
                                     className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg transition-colors text-left cursor-pointer"
                                   >
                                     <Trash2 className="h-3.5 w-3.5" /> Delete Lead
                                   </button>
                                 </div>
                               </div>
                             </>
                           )}
                           <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-all" />
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

      <ArchiveConfirmationModal
        isOpen={!!archiveId}
        isLoading={isArchiving}
        onClose={() => setArchiveId(null)}
        onConfirm={handleArchive}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteId}
        isLoading={isDeleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(false)}
      />

      <PermanentDeleteModal
        isOpen={!!permanentDeleteId}
        isLoading={isDeleting}
        onClose={() => setPermanentDeleteId(null)}
        onConfirm={() => handleDelete(true)}
      />
    </div>
  );
}

interface DuplicateMatch {
  id: string;
  name: string;
  location: string;
  status: string;
  serviceType: string;
}

function CreateOrEditModal({ isOpen, lead, onClose, onSuccess }: { isOpen: boolean, lead: Lead | null, onClose: () => void, onSuccess: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    contactNumber: "",
    fullAddress: "",
    serviceType: "Interior Design",
    inquirySource: "",
    referenceName: ""
  });

  // Duplicate detection states
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [hasConfirmedDuplicate, setHasConfirmedDuplicate] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        customerName: lead.customerName,
        contactNumber: lead.contactNumber,
        fullAddress: lead.fullAddress || "",
        serviceType: lead.serviceType,
        inquirySource: lead.inquirySource,
        referenceName: lead.referenceName || ""
      });
      setError(null);
    } else {
      setFormData({ 
        customerName: "", 
        contactNumber: "", 
        fullAddress: "",
        serviceType: "INTERIOR_DESIGN", 
        inquirySource: "",
        referenceName: ""
      });
    }
  }, [lead, isOpen]);

  // Handle duplicate check
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only check for new leads, or if the number actually changed
      if (formData.contactNumber.length >= 10 && !lead) {
        setIsCheckingDuplicate(true);
        try {
          const res = await fetch(`/api/leads/check-duplicate?phone=${formData.contactNumber}`);
          const rawData = await res.json();
          const matchesList: DuplicateMatch[] = rawData?.matches || [];
          // Filter out the current lead if we're editing (though !lead prevents this)
          const filtered = (matchesList as any[]).filter((m: any) => {
            const mid = (m as any).id;
            const lid = (lead as any)?.id;
            return mid !== lid;
          });
          setDuplicates(filtered);
          if (filtered.length === 0) setHasConfirmedDuplicate(false);
        } catch (e) {
          console.error(e);
        } finally {
          setIsCheckingDuplicate(false);
        }
      } else {
        setDuplicates([]);
        setHasConfirmedDuplicate(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.contactNumber, lead]);

  useEffect(() => {
    if (error) setError(null);
  }, [formData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, forceRedirect = false) => {
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
        if (forceRedirect || lead) {
           const data = await res.json();
           router.push(`/leads/${data.id || lead?.id}`);
        }
        onSuccess();
      } else {
        const err = await res.json();
        setError(err.details || err.error || "Failed to save lead");
      }
    } catch (e) {
      console.error(e);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161f32]/50 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{lead ? "Edit Lead Profile" : "Capture New Lead"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{lead ? "Update contact information and service requirements" : "Add a fresh inquiry to your sales pipeline"}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X className="h-5 w-5" />
            </button>
        </div>
        
        {error && (
          <div className="mx-8 mt-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-lg flex items-center gap-3 text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Right Column Fields (First in DOM for RTL Tab) */}
            <div className="space-y-5 md:col-start-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">Contact Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    required
                    type="text" 
                    maxLength={10}
                    className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 pl-11 bg-white dark:bg-[#161f32] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all outline-none"
                    placeholder="Phone number"
                    value={formData.contactNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setFormData({...formData, contactNumber: val});
                    }}
                  />
                  {isCheckingDuplicate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>

                {duplicates.length > 0 && (
                  <div className="mt-3 p-4 bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-500/30 rounded-xl animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      <p className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest">Record Already Exists</p>
                    </div>

                    <div className="space-y-2">
                      {duplicates.map(d => (
                        <div key={d.id} className="flex items-center justify-between gap-4 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-amber-100/50 dark:border-amber-500/20 shadow-[0_2px_8px_-4px_rgba(180,83,9,0.1)] transition-all hover:border-amber-200 dark:hover:border-amber-500/40">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-amber-900 dark:text-amber-200 font-bold leading-none truncate">{d.location}</p>
                            <p className="text-[9px] text-amber-600/80 dark:text-amber-400 font-medium mt-1 truncate">
                              {d.name} <span className="mx-1 text-amber-300">|</span> {d.serviceType}
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => router.push(`/leads/${d.id}`)}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 dark:bg-amber-500 text-white text-[9px] font-bold rounded-md hover:bg-amber-700 transition-all active:scale-95 shadow-sm shadow-amber-200/50"
                          >
                            Open <ChevronRight className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-amber-200/30 dark:border-amber-500/20 flex items-center gap-2.5 ml-0.5">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          id="confirm-duplicate"
                          className="h-3.5 w-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500/20 transition-all cursor-pointer"
                          checked={hasConfirmedDuplicate}
                          onChange={e => setHasConfirmedDuplicate(e.target.checked)}
                        />
                      </div>
                      <label htmlFor="confirm-duplicate" className="text-[10px] font-bold text-amber-700/80 dark:text-amber-300 cursor-pointer select-none leading-none">
                        I understand, create duplicate lead anyway
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">Service Required</label>
                <select 
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 px-4 bg-white dark:bg-[#161f32] text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all appearance-none outline-none cursor-pointer"
                  value={formData.serviceType}
                  onChange={e => setFormData({...formData, serviceType: e.target.value})}
                >
                  <option value="Interior Design">Interior Design</option>
                  <option value="2BHK Interior">2BHK Interior</option>
                  <option value="3BHK Interior">3BHK Interior</option>
                  <option value="4BHK Interior">4BHK Interior</option>
                  <option value="Raw house">Raw house</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Left Column Fields (Second in DOM) */}
            <div className="space-y-5 md:col-start-1 md:row-start-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 pl-11 bg-white dark:bg-[#161f32] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all outline-none"
                    placeholder="Full name"
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">Inquiry Source *</label>
                <select 
                  required
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 px-4 bg-white dark:bg-[#161f32] text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all appearance-none outline-none cursor-pointer"
                  value={formData.inquirySource}
                  onChange={e => setFormData({...formData, inquirySource: e.target.value})}
                >
                  <option value="" disabled>--Select--</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="WEBSITE">Website</option>
                  <option value="DIRECT_CALL">Direct Call</option>
                  <option value="WALK_IN">Walk In</option>
                  <option value="THROUGH_REFERENCE">Reference</option>
                </select>
              </div>

              {formData.inquirySource === "THROUGH_REFERENCE" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">Reference Person Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 pl-11 bg-white dark:bg-[#161f32] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all outline-none"
                      placeholder="Name of reference person"
                      value={formData.referenceName}
                      onChange={e => setFormData({...formData, referenceName: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">Site Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 pl-11 bg-white dark:bg-[#161f32] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm transition-all outline-none"
                placeholder="Full site address / location details"
                value={formData.fullAddress}
                onChange={e => setFormData({...formData, fullAddress: e.target.value})}
              />
            </div>
          </div>


          <div className="pt-6 flex items-center justify-end gap-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors px-4 cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => handleSubmit(e as any, true)}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 border border-emerald-500/20 cursor-pointer"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ExternalLink className="h-4 w-4" /> Quick Visit</>}
            </button>

            <button
              type="submit"
              disabled={isLoading || (duplicates.length > 0 && !hasConfirmedDuplicate)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 border border-indigo-500/20 disabled:grayscale disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2">{lead ? "Save Changes" : "Create Lead"} <Check className="h-4 w-4" /></span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ArchiveConfirmationModal({ 
  isOpen, 
  isLoading, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  isLoading: boolean; 
  onClose: () => void; 
  onConfirm: (reason: string, tentativeDate: string | null) => void; 
}) {
  const [reason, setReason] = useState("Client Will Call");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const reasons = [
    { label: "Client Will Call", icon: "📞" },
    { label: "Possession Pending", icon: "🔑" },
    { label: "Site Under Construction", icon: "🏗️" },
    { label: "Budget On Hold", icon: "💰" }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
        <div className="p-6">
          <div className="bg-slate-100 dark:bg-slate-800 h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            <Archive className="h-7 w-7 text-slate-600 dark:text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center">Move to Passive Archive</h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-xs text-center leading-relaxed">
            Move this lead to <span className="text-slate-900 dark:text-white font-semibold">Passive Archive</span>. Active calls and meetings will be safely paused.
          </p>

          {/* Reason Selection */}
          <div className="mt-5 space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Archive Reason</label>
            <div className="grid grid-cols-2 gap-2">
              {reasons.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setReason(r.label)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer",
                    reason === r.label
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm dark:bg-indigo-600 dark:border-indigo-600"
                      : "bg-white dark:bg-[#161f32] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <span className="text-sm">{r.icon}</span>
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Tentative Timeline */}
          <div className="mt-4 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Expected Month / Possession
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">Optional</span>
            </div>

            {/* Quick Preset Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + 3);
                  setSelectedMonth(String(d.getMonth() + 1).padStart(2, "0"));
                  setSelectedYear(String(d.getFullYear()));
                }}
                className="px-2.5 py-1 bg-white dark:bg-[#161f32] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                +3 Months
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + 6);
                  setSelectedMonth(String(d.getMonth() + 1).padStart(2, "0"));
                  setSelectedYear(String(d.getFullYear()));
                }}
                className="px-2.5 py-1 bg-white dark:bg-[#161f32] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                +6 Months
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setFullYear(d.getFullYear() + 1);
                  setSelectedMonth(String(d.getMonth() + 1).padStart(2, "0"));
                  setSelectedYear(String(d.getFullYear()));
                }}
                className="px-2.5 py-1 bg-white dark:bg-[#161f32] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Next Year ({new Date().getFullYear() + 1})
              </button>
              {(selectedMonth || selectedYear) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth("");
                    setSelectedYear("");
                  }}
                  className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-500/30 rounded-lg text-[10px] font-semibold text-rose-600 dark:text-rose-300 transition-colors cursor-pointer ml-auto"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Dual Dropdowns */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161f32] py-2.5 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-slate-900 dark:focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Select Month --</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161f32] py-2.5 px-3 text-xs font-medium text-slate-800 dark:text-slate-200 focus:border-slate-900 dark:focus:border-indigo-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Select Year --</option>
                  {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
              {selectedMonth && selectedYear ? (
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  Selected: {["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][parseInt(selectedMonth, 10)]} {selectedYear}
                </span>
              ) : (
                "No automatic alarms will ring; this acts as a friendly guideline for your team."
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2">
            <button 
              disabled={isLoading} 
              onClick={() => {
                const dateVal = (selectedYear && selectedMonth) ? `${selectedYear}-${selectedMonth}-01` : null;
                onConfirm(reason, dateVal);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 py-2.5 rounded-xl text-white font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4 text-slate-300" />}
              Move to Archive
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ isOpen, isLoading, onClose, onConfirm }: { isOpen: boolean, isLoading: boolean, onClose: () => void, onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
        <div className="p-8 text-center">
          <div className="bg-rose-50 dark:bg-rose-950/40 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Move to Canceled Records?</h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4 text-sm">
            Are you sure you want to cancel this lead? It will be moved to <span className="text-slate-900 dark:text-white font-bold">Canceled Records</span> for safety. You can permanently delete it from there later.
          </p>
          <div className="mt-8 flex flex-col gap-2">
             <button 
               disabled={isLoading} 
               onClick={onConfirm}
               className="w-full bg-rose-600 hover:bg-rose-700 py-3 rounded-lg text-white font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
             >
               {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
               Move to Canceled
             </button>
             <button 
               onClick={onClose}
               className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 rounded-lg text-slate-600 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
             >
               Cancel
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function PermanentDeleteModal({ isOpen, isLoading, onClose, onConfirm }: { isOpen: boolean, isLoading: boolean, onClose: () => void, onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
        <div className="p-8 text-center">
          <div className="bg-rose-50 dark:bg-rose-950/40 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5">
            <Trash2 className="h-8 w-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Delete Lead Permanently?</h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4 text-sm text-left">
            This action cannot be undone. The lead will be permanently removed from:
          </p>
          <ul className="mt-3 text-slate-500 dark:text-slate-400 text-xs font-semibold space-y-1.5 text-left px-4 list-disc list-inside">
            <li>Lead Pipeline</li>
            <li>Follow-Ups</li>
            <li>Site Visits</li>
            <li>Analytics</li>
            <li>Customer History</li>
          </ul>
          <div className="mt-8 flex flex-col gap-2">
             <button 
               disabled={isLoading} 
               onClick={onConfirm}
               className="w-full bg-rose-600 hover:bg-rose-700 py-3 rounded-lg text-white font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 cursor-pointer"
             >
               {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
               Permanently Delete
             </button>
             <button 
               onClick={onClose}
               className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 rounded-lg text-slate-600 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
             >
               Cancel
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
