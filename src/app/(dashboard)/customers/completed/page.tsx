"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Search, User, Loader2, 
  ChevronRight, ExternalLink, Filter, RotateCcw,
  CheckCircle2, RotateCw, IndianRupee, Briefcase, Zap, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  customerName: string;
  project?: { id: string; name: string | null; completedOn: string | null } | null;
  contactNumber: string;
  serviceType: string;
  initialDealAmount: number;
  createdAt: string;
  updatedAt: string;
  inquirySource?: string;
  isFinanciallyClosed: boolean;
};

export default function CompletedProjectsPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    source: "ALL",
    service: "ALL",
    startDate: "",
    endDate: ""
  });
  const [sortBy, setSortBy] = useState("NEWEST");
  const [isReactivating, setIsReactivating] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers/completed");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch completed customers:", error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleReactivate = async (id: string) => {
    if (!confirm("Are you sure you want to reactivate this project? It will be moved back to active customers and financial/design locks will be removed.")) return;
    
    setIsReactivating(id);
    try {
      const res = await fetch(`/api/leads/${id}/reactivate-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Reactivated from Completed Archive" })
      });
      
      if (res.ok) {
        fetchCustomers();
      } else {
        alert("Failed to reactivate project");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsReactivating(null);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const displayName = customer.project?.name || customer.customerName;
    const matchesSearch = 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactNumber.includes(searchTerm) ||
      customer.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = filters.source === "ALL" || customer.inquirySource === filters.source;
    const matchesService = filters.service === "ALL" || customer.serviceType?.toLowerCase().replace(/_/g, " ") === filters.service.toLowerCase().replace(/_/g, " ");

    const conversionDateStr = customer.project?.completedOn || customer.updatedAt;
    const customerDate = new Date(conversionDateStr);
    const matchesStartDate = !filters.startDate || customerDate >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || customerDate <= new Date(filters.endDate + "T23:59:59");

    return matchesSearch && matchesSource && matchesService && matchesStartDate && matchesEndDate;
  }).sort((a, b) => {
    const aName = a.project?.name || a.customerName;
    const bName = b.project?.name || b.customerName;
    const aConversionDateStr = a.project?.completedOn || a.updatedAt;
    const bConversionDateStr = b.project?.completedOn || b.updatedAt;
    if (sortBy === "NEWEST") return new Date(bConversionDateStr).getTime() - new Date(aConversionDateStr).getTime();
    if (sortBy === "OLDEST") return new Date(aConversionDateStr).getTime() - new Date(bConversionDateStr).getTime();
    if (sortBy === "PROJECT_FIRST") {
      if (a.project?.name && !b.project?.name) return -1;
      if (!a.project?.name && b.project?.name) return 1;
      return aName.localeCompare(bName);
    }
    if (sortBy === "A-Z") return aName.localeCompare(bName);
    if (sortBy === "Z-A") return bName.localeCompare(aName);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Section - Matched to Customer Directory */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Complete Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Completed and archived project workspaces with full historical access.</p>
        </div>
        <div className="relative z-10 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50 px-4 py-2 rounded-lg">
           <span className="text-blue-700 dark:text-blue-400 font-bold text-sm">{filteredCustomers.length} Total Completed Projects</span>
        </div>
      </div>

      {/* Search and Action Bar - Matched to Customer Directory */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:max-w-xl group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white dark:bg-[#161f32] transition-all outline-none"
            placeholder="Search completed projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition shadow-sm",
              showFilters ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700" : "bg-white dark:bg-[#161f32] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Filter className="h-4 w-4" /> {showFilters ? "Hide Filters" : "Filters"}
          </button>
          {(searchTerm !== "" || filters.source !== "ALL" || filters.service !== "ALL" || filters.startDate !== "" || filters.endDate !== "" || sortBy !== "NEWEST") && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilters({ source: "ALL", service: "ALL", startDate: "", endDate: "" });
                setSortBy("NEWEST");
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#161f32] border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Compact Filter Options */}
      {showFilters && (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm animate-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <label className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight mb-1 ml-1">Acquisition Source</label>
              <select 
                className="w-full rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-white/70 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#111827] focus:border-emerald-500 outline-none transition-all cursor-pointer"
                value={filters.source}
                onChange={e => setFilters({...filters, source: e.target.value})}
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Sources</option>
                <option value="WHATSAPP" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">WhatsApp</option>
                <option value="FACEBOOK" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Facebook</option>
                <option value="INSTAGRAM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Instagram</option>
                <option value="WEBSITE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Website</option>
                <option value="DIRECT_CALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Direct Call</option>
                <option value="WALK_IN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Walk In</option>
                <option value="THROUGH_REFERENCE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Reference</option>
              </select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight mb-1 ml-1">Service Category</label>
              <select 
                className="w-full rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-white/70 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#111827] focus:border-emerald-500 outline-none transition-all cursor-pointer"
                value={filters.service}
                onChange={e => setFilters({...filters, service: e.target.value})}
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Services</option>
                <option value="Interior Design" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Interior Design</option>
                <option value="2BHK Interior" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2BHK Interior</option>
                <option value="3BHK Interior" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">3BHK Interior</option>
                <option value="4BHK Interior" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">4BHK Interior</option>
                <option value="Raw house" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Raw house</option>
                <option value="Office" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Office</option>
                <option value="Other" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Other</option>
              </select>
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight mb-1 ml-1">Sort By</label>
              <select 
                className="w-full rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-white/70 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#111827] focus:border-emerald-500 outline-none transition-all cursor-pointer"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="NEWEST" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Date: Newest First</option>
                <option value="OLDEST" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Date: Oldest First</option>
                <option value="PROJECT_FIRST" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Projects First</option>
                <option value="A-Z" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Alphabetical: A-Z</option>
                <option value="Z-A" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Alphabetical: Z-A</option>
              </select>
            </div>
            <div className="flex-[1.5] flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight mb-1 ml-1">Completion From</label>
                <input 
                  type="date"
                  className="w-full rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-white/70 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#111827] focus:border-emerald-500 outline-none transition-all"
                  value={filters.startDate}
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight mb-1 ml-1">Completion To</label>
                <input 
                  type="date"
                  className="w-full rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-white/70 dark:bg-[#161f32] py-1.5 px-3 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#111827] focus:border-emerald-500 outline-none transition-all"
                  value={filters.endDate}
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main List Container - Matched to Customer Directory */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/8 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <span className="text-sm font-medium">Loading Archive...</span>
          </div>
        ) : (
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800" style={{ maxHeight: 'calc(100vh - 420px)' }}>
            <table className="w-full divide-y divide-slate-200 dark:divide-slate-800 table-fixed" style={{ minWidth: '1000px' }}>
              <thead className="bg-slate-50/50 dark:bg-[#161f32]/80 sticky top-0 z-20 backdrop-blur-sm">
                <tr>
                  <th scope="col" className="w-[25%] py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer / Project</th>
                  <th scope="col" className="w-[20%] px-3 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service</th>
                  <th scope="col" className="w-[12%] px-3 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completion</th>
                  <th scope="col" className="w-[10%] px-3 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Final Deal</th>
                  <th scope="col" className="w-[13%] px-3 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="w-[20%] relative py-4 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="h-12 w-12 bg-slate-50 dark:bg-[#161f32] rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Completed Projects</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add a 'Project Completed' milestone to move a project here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const displayName = customer.project?.name || customer.customerName;
                    const compDate = customer.project?.completedOn || customer.updatedAt;
                    
                    return (
                      <tr 
                        key={customer.id} 
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer relative"
                      >
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap py-5 pl-8 pr-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-blue-50 dark:bg-blue-950/50 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold border border-blue-100 dark:border-blue-900/50">
                              {displayName.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                {displayName}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-tighter font-bold opacity-60">
                                {customer.customerName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
                            <Zap className="h-3.5 w-3.5 text-emerald-500" />
                            {customer.serviceType.replace("_", " ")}
                          </div>
                        </td>
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-300 italic">
                             {format(new Date(compDate), "dd MMM yyyy")}
                          </div>
                        </td>
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                          <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                            ₹{customer.initialDealAmount.toLocaleString()}
                          </div>
                        </td>
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                           <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 uppercase tracking-widest">
                                 COMPLETED
                              </span>
                              {customer.isFinanciallyClosed && (
                                 <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 uppercase tracking-widest">
                                    FIN. CLOSED
                                 </span>
                              )}
                           </div>
                        </td>
                        <td className="relative whitespace-nowrap py-5 pl-3 pr-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 router.push(`/customers/${customer.id}`);
                               }}
                               className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-emerald-100 dark:border-emerald-800/50"
                             >
                               Open Profile <ExternalLink className="h-3 w-3" />
                             </button>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleReactivate(customer.id);
                               }}
                               disabled={isReactivating === customer.id}
                               className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#161f32] hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm"
                             >
                               {isReactivating === customer.id ? (
                                 <Loader2 className="h-3 w-3 animate-spin" />
                               ) : (
                                 <>Reactivate <RotateCw className="h-3 w-3" /></>
                               )}
                             </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
