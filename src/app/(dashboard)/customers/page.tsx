"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Search, User, Phone, MapPin, Loader2, 
  ChevronRight, Activity, Zap, ExternalLink, Filter, ArrowUpDown, X, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  customerName: string;
  project?: { id: string; name: string | null; startedOn?: string } | null;
  contactNumber: string;
  fullAddress: string | null;
  inquirySource: string;
  serviceType: string;
  createdAt: string;
  updatedAt: string;
  assignedStaff?: { name: string } | null;
};

export default function CustomersPage() {
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

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        console.error("Customers API returned non-array data:", data);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const displayName = customer.project?.name || customer.customerName;
    const matchesSearch = 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactNumber.includes(searchTerm) ||
      customer.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = filters.source === "ALL" || customer.inquirySource === filters.source;
    const matchesService = filters.service === "ALL" || customer.serviceType?.toLowerCase().replace(/_/g, " ") === filters.service.toLowerCase().replace(/_/g, " ");

    const conversionDateStr = customer.project?.startedOn || customer.createdAt;
    const customerDate = new Date(conversionDateStr);
    const matchesStartDate = !filters.startDate || customerDate >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || customerDate <= new Date(filters.endDate + "T23:59:59");

    return matchesSearch && matchesSource && matchesService && matchesStartDate && matchesEndDate;
  }).sort((a, b) => {
    const aName = a.project?.name || a.customerName;
    const bName = b.project?.name || b.customerName;
    const aConversionDateStr = a.project?.startedOn || a.createdAt;
    const bConversionDateStr = b.project?.startedOn || b.createdAt;
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Converted leads and active clients who have purchased your services.</p>
        </div>
        <div className="relative z-10 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-lg">
           <span className="text-emerald-700 font-bold text-sm">{filteredCustomers.length} Total Customers</span>
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
            className="block w-full rounded-lg border border-slate-200 py-2.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white transition-all outline-none"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition shadow-sm",
              showFilters ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Compact Filter Options */}
      {showFilters && (
        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 shadow-sm animate-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <label className="block text-[9px] font-bold text-emerald-700 uppercase tracking-tight mb-1 ml-1">Acquisition Source</label>
              <select 
                className="w-full rounded-lg border border-emerald-200 bg-white/70 py-1.5 px-3 text-xs focus:bg-white focus:border-emerald-500 outline-none transition-all cursor-pointer"
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
              <label className="block text-[9px] font-bold text-emerald-700 uppercase tracking-tight mb-1 ml-1">Service Category</label>
              <select 
                className="w-full rounded-lg border border-emerald-200 bg-white/70 py-1.5 px-3 text-xs focus:bg-white focus:border-emerald-500 outline-none transition-all cursor-pointer"
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
            <div className="min-w-[140px] flex-1">
              <label className="block text-[9px] font-bold text-emerald-700 uppercase tracking-tight mb-1 ml-1">Sort By</label>
              <select 
                className="w-full rounded-lg border border-emerald-200 bg-white/70 py-1.5 px-3 text-xs focus:bg-white focus:border-emerald-500 outline-none transition-all cursor-pointer"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="NEWEST">Date: Newest First</option>
                <option value="OLDEST">Date: Oldest First</option>
                <option value="PROJECT_FIRST">Projects First</option>
                <option value="A-Z">Alphabetical: A-Z</option>
                <option value="Z-A">Alphabetical: Z-A</option>
              </select>
            </div>
            <div className="flex-[1.5] flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-emerald-700 uppercase tracking-tight mb-1 ml-1">Conversion From</label>
                <input 
                  type="date"
                  className="w-full rounded-lg border border-emerald-200 bg-white/70 py-1.5 px-3 text-xs focus:bg-white focus:border-emerald-500 outline-none transition-all"
                  value={filters.startDate}
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] font-bold text-emerald-700 uppercase tracking-tight mb-1 ml-1">Conversion To</label>
                <input 
                  type="date"
                  className="w-full rounded-lg border border-emerald-200 bg-white/70 py-1.5 px-3 text-xs focus:bg-white focus:border-emerald-500 outline-none transition-all"
                  value={filters.endDate}
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main List Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <span className="text-sm font-medium">Loading Directory...</span>
          </div>
        ) : (
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            <table className="min-w-full divide-y divide-slate-200 table-fixed" style={{ minWidth: '800px' }}>
              <thead className="bg-slate-50/50 sticky top-0 z-20 backdrop-blur-sm">
                <tr>
                  <th scope="col" className="w-[30%] py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Profile</th>
                  <th scope="col" className="w-[25%] px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchased Service</th>
                  <th scope="col" className="w-[20%] px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Date</th>
                  <th scope="col" className="w-[15%] px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Handler</th>
                  <th scope="col" className="w-[10%] relative py-4 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 text-slate-300">
                        <User className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">No customers found</h3>
                      <p className="mt-1 text-xs text-slate-500">Convert a lead from the Lead Pipeline to see them here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const displayName = customer.project?.name || customer.customerName;
                    return (
                      <tr 
                        key={customer.id} 
                        className="group hover:bg-slate-50 transition-colors cursor-pointer relative"
                      >
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap py-5 pl-8 pr-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-semibold border border-emerald-100">
                              {displayName.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                                {displayName}
                                {customer.project?.name && (
                                  <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">Project</span>
                                )}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
                                <Phone className="h-3 w-3" />
                                <span>{customer.contactNumber}</span>
                                {customer.project?.name && (
                                  <>
                                    <span className="text-slate-300 mx-1">|</span>
                                    <span className="text-[10px] text-slate-400 italic">({customer.customerName})</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <Zap className="h-3.5 w-3.5 text-emerald-500" />
                          {customer.serviceType.replace("_", " ")}
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-400 font-medium flex items-center gap-1.5 max-w-[180px] truncate">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{customer.fullAddress || "Address varies"}</span>
                        </div>
                      </td>
                      <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                        <div className="mt-1.5 text-xs font-medium text-slate-600">{format(new Date(customer.project?.startedOn || customer.createdAt), "dd MMM yyyy")}</div>
                      </td>
                      <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                          <div className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] border border-white">
                             <User className="h-3 w-3 text-slate-500" />
                          </div>
                          {customer.assignedStaff?.name || "Internal"}
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-5 pl-3 pr-8 text-right">
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             router.push(`/customers/${customer.id}`);
                           }}
                           className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-emerald-100"
                         >
                           Open Profile <ExternalLink className="h-3 w-3" />
                         </button>
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
