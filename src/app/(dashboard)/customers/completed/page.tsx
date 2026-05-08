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
  isFinanciallyClosed: boolean;
};

export default function CompletedProjectsPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
    return (
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactNumber.includes(searchTerm) ||
      customer.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Section - Matched to Customer Directory */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Complete Projects</h1>
          <p className="text-slate-500 text-sm mt-1">Completed and archived project workspaces with full historical access.</p>
        </div>
        <div className="relative z-10 bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg">
           <span className="text-blue-700 font-bold text-sm">{filteredCustomers.length} Total Completed Projects</span>
        </div>
      </div>

      {/* Search and Action Bar - Matched to Customer Directory */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:max-w-xl group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 py-2.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white transition-all outline-none"
            placeholder="Search completed projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => {
              setSearchTerm("");
              fetchCustomers();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* Main List Container - Matched to Customer Directory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <span className="text-sm font-medium">Loading Archive...</span>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer / Project</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Final Deal</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative py-4 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 text-slate-300">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">No Completed Projects</h3>
                      <p className="mt-1 text-xs text-slate-500">Add a 'Project Completed' milestone to move a project here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const displayName = customer.project?.name || customer.customerName;
                    const compDate = customer.project?.completedOn || customer.updatedAt;
                    
                    return (
                      <tr 
                        key={customer.id} 
                        className="group hover:bg-slate-50 transition-colors cursor-pointer relative"
                      >
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap py-5 pl-8 pr-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-semibold border border-blue-100">
                              {displayName.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                {displayName}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5 uppercase tracking-tighter font-bold opacity-60">
                                {customer.customerName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                          <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                            <Zap className="h-3.5 w-3.5 text-emerald-500" />
                            {customer.serviceType.replace("_", " ")}
                          </div>
                        </td>
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                          <div className="text-xs font-medium text-slate-600 italic">
                             {format(new Date(compDate), "dd MMM yyyy")}
                          </div>
                        </td>
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                          <div className="text-sm font-bold text-slate-900 tracking-tight">
                            ₹{customer.initialDealAmount.toLocaleString()}
                          </div>
                        </td>
                        <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap px-3 py-5">
                           <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest">
                                 COMPLETED
                              </span>
                              {customer.isFinanciallyClosed && (
                                 <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-widest">
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
                               className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-emerald-100"
                             >
                               Open Workspace <ExternalLink className="h-3 w-3" />
                             </button>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleReactivate(customer.id);
                               }}
                               disabled={isReactivating === customer.id}
                               className="text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-2 shadow-sm"
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
