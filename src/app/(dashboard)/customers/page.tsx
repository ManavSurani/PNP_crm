"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Search, User, Phone, MapPin, Loader2, 
  ChevronRight, Activity, Zap, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  customerName: string;
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

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) => 
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactNumber.includes(searchTerm) ||
      customer.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      </div>

      {/* Main List Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
            <span className="text-sm font-medium">Loading Directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Profile</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchased Service</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Date</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Handler</th>
                  <th scope="col" className="relative py-4 pl-3 pr-8"><span className="sr-only">Actions</span></th>
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
                  filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className="group hover:bg-slate-50 transition-colors cursor-pointer relative"
                    >
                      <td onClick={() => router.push(`/customers/${customer.id}`)} className="whitespace-nowrap py-5 pl-8 pr-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-semibold border border-emerald-100">
                            {customer.customerName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                              {customer.customerName}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              <span>{customer.contactNumber}</span>
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
                        <div className="mt-1.5 text-xs font-medium text-slate-600">{format(new Date(customer.updatedAt), "dd MMM yyyy")}</div>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
