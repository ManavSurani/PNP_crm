"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Trash2, Search, ArrowRight, RotateCcw, 
  Loader2, User, ShoppingCart, 
  ChevronRight, Calendar, AlertCircle,
  MoreHorizontal, Eye, ArrowLeft, Filter
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CanceledData = {
  leads: any[];
  orders: any[];
};

export default function CanceledArchivePage() {
  const router = useRouter();
  const [data, setData] = useState<CanceledData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"leads" | "orders">("leads");
  const [search, setSearch] = useState("");
  const [filterCancelReason, setFilterCancelReason] = useState("ALL");

  const CANCEL_REASONS = [
    "No Response",
    "Not Interested",
    "Budget Issue",
    "Already Purchased",
    "Wrong Number",
    "Project Postponed",
    "Need Turnkey",
  ];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/canceled");
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReactivateLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}/reactivate`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}) // Ensure body is present for NextAuth compatibility
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleReactivateOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}/reactivate`, { 
        method: "POST" 
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const currentList = activeTab === "leads" ? data?.leads || [] : data?.orders || [];
  const filteredList = currentList.filter(item => {
    const term = search.toLowerCase();
    const matchesSearch = activeTab === "leads" 
      ? item.customerName.toLowerCase().includes(term) || item.contactNumber.includes(term)
      : (item.customerName || "").toLowerCase().includes(term) || (item.contactNumber || "").includes(term);
    
    const matchesReason = filterCancelReason === "ALL" || item.cancelReason === filterCancelReason;
    return matchesSearch && matchesReason;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">

      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500 rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-rose-500" /> Canceled Archive
          </h1>
          <p className="text-slate-500 text-sm mt-1">Review and reactivate lost opportunities or canceled deployments.</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 w-full md:w-auto">
           <button 
             onClick={() => setActiveTab("leads")}
             className={cn(
               "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-1 md:flex-none",
               activeTab === "leads" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
             <User className="h-4 w-4" /> Canceled Leads ({data?.leads.length || 0})
           </button>
           <button 
             onClick={() => setActiveTab("orders")}
             className={cn(
               "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-1 md:flex-none",
               activeTab === "orders" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
             <ShoppingCart className="h-4 w-4" /> Aborted Orders ({data?.orders.length || 0})
           </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 flex-grow w-full md:max-w-2xl group ml-auto justify-end">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <select 
              className="block w-full rounded-lg border border-slate-200 py-2.5 px-4 text-slate-900 bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm outline-none cursor-pointer"
              value={filterCancelReason}
              onChange={e => setFilterCancelReason(e.target.value)}
            >
              <option value="ALL">All Reasons</option>
              {CANCEL_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {(search !== "" || filterCancelReason !== "ALL") && (
            <button 
              onClick={() => {
                setSearch("");
                setFilterCancelReason("ALL");
              }}
              className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm shrink-0"
              title="Reset Filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Archive List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-3" />
            <p className="text-sm font-medium">Indexing Archive...</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200" style={{ maxHeight: 'calc(100vh - 320px)' }}>
             <table className="min-w-full divide-y divide-slate-200 table-fixed" style={{ minWidth: '800px' }}>
               <thead className="bg-slate-50/50 sticky top-0 z-20 backdrop-blur-sm">
                 <tr>
                    <th scope="col" className="w-[40%] py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Identity</th>
                    <th scope="col" className="w-[30%] px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancellation Intel</th>
                    <th scope="col" className="w-[15%] px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Logged</th>
                    <th scope="col" className="w-[10%] py-4 pr-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Restore</th>
                    <th scope="col" className="w-[5%] relative py-4 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 bg-white">
                 {filteredList.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="py-24 text-center">
                        <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 text-slate-300">
                           <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase">Archive Empty</h3>
                        <p className="text-xs text-slate-500 mt-1">No canceled records found matching your current filter.</p>
                     </td>
                   </tr>
                 ) : filteredList.map((item) => (
                   <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors cursor-default">
                      <td className="py-5 pl-0 pr-3">
                         <div className="flex items-center h-full">
                           <div className="w-1 self-stretch shrink-0 bg-rose-500" />
                           <div className="flex items-center gap-4 pl-7">
                              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200 shadow-sm group-hover:bg-rose-50 group-hover:text-rose-500 group-hover:border-rose-100 transition-all uppercase">
                               {item.customerName?.charAt(0) || "?"}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-rose-600 transition-colors">
                                  {item.customerName || "Unnamed Record"}
                               </span>
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                                  {activeTab === "leads" ? (
                                    <>Type: {item.serviceType?.replace("_", " ") || "Not Specified"}</>
                                  ) : (
                                    <>Type: {item.serviceType?.replace("_", " ") || "Not Specified"}</>
                                  )}
                               </span>
                            </div>
                         </div>
                       </div>
                      </td>
                      <td className="px-3 py-5">
                         <div className="max-w-xs">
                            <p className="text-xs font-semibold text-slate-700 leading-relaxed italic line-clamp-2">
                               {item.cancelReason || "No context provided"}
                            </p>
                            {activeTab === "leads" && item.assignedStaff && (
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 flex items-center gap-1">
                                 <User className="h-2.5 w-2.5" /> Handler: {item.assignedStaff.name}
                              </p>
                            )}
                         </div>
                      </td>
                      <td className="px-3 py-5">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                               <Calendar className="h-3.5 w-3.5 text-slate-300" />
                               {format(new Date(item.updatedAt), "dd MMM yyyy")}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Logged at {format(new Date(item.updatedAt), "HH:mm")}</span>
                         </div>
                      </td>
                      <td className="py-5 pr-4 text-right">
                         <div className="flex items-center justify-end">
                            {activeTab === "leads" && (
                              <button 
                                onClick={() => handleReactivateLead(item.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-100 active:scale-95 whitespace-nowrap"
                              >
                                 <RotateCcw className="h-3 w-3" /> Reactivate
                              </button>
                            )}
                            {activeTab === "orders" && (
                              <button 
                                onClick={() => handleReactivateOrder(item.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-100 active:scale-95 whitespace-nowrap"
                              >
                                 <RotateCcw className="h-3 w-3" /> Reactivate
                              </button>
                            )}
                         </div>
                      </td>
                      <td className="px-3 py-5 pr-8 text-right relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === item.id ? null : item.id);
                            }}
                            className={cn(
                              "p-2 rounded-lg text-slate-400 hover:text-slate-900 transition-all border outline-none focus:ring-0",
                              menuOpenId === item.id ? "bg-slate-100 border-slate-200 text-slate-900" : "hover:bg-slate-50 border-transparent hover:border-slate-200"
                            )}
                          >
                             <MoreHorizontal className="h-4 w-4" />
                          </button>

                         {menuOpenId === item.id && (
                           <div className="absolute right-8 top-12 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-[100] py-1.5 animate-in fade-in zoom-in-95 duration-100">
                             <Link 
                               href={activeTab === "leads" ? `/leads/${item.id}` : `/customers/${item.id}`}
                               className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                             >
                               <Eye className="h-3.5 w-3.5 text-indigo-500" /> Visit Profile
                             </Link>
                           </div>
                         )}
                      </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
