"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Search, MoreHorizontal, User, Phone, MapPin, Loader2 } from "lucide-react";

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

  const filteredLeads = leads.filter(
    (lead) => 
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactNumber.includes(searchTerm) ||
      lead.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Lead Management</h1>
          <p className="text-sm text-slate-500">Track and manage all customer inquiries and leads.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={() => setIsModalOpen(true)}
            className="block rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-grow max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Search leads by name, phone, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="ml-3 font-medium">Loading leads...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6 uppercase tracking-wider">Customer Info</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Requirement</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status / Priority</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Assigned To</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <User className="mx-auto h-12 w-12 text-slate-300" />
                      <h3 className="mt-2 text-sm font-semibold text-slate-900">No leads found</h3>
                      <p className="mt-1 text-sm text-slate-500">Get started by creating a new lead.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border border-indigo-200">
                            <span className="text-indigo-700 font-bold">{lead.customerName.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              {lead.customerName}
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {lead.inquirySource.replace("_", " ")}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-500 flex items-center gap-1 group">
                              <Phone className="h-3 w-3" />
                              <a href={`tel:${lead.contactNumber}`} className="hover:underline">{lead.contactNumber}</a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-5">
                        <div className="text-sm font-medium text-slate-900">{lead.serviceType.replace("_", " ")}</div>
                        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1 max-w-[200px] truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{lead.fullAddress || "No address provided"}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          lead.status === "NEW_INQUIRY" ? "bg-amber-50 text-amber-700 ring-amber-600/20" :
                          lead.status === "WON_ORDER" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" :
                          lead.status === "CANCELLED" ? "bg-rose-50 text-rose-700 ring-rose-600/20" :
                          "bg-sky-50 text-sky-700 ring-sky-600/20"
                        }`}>
                          {lead.status.replace("_", " ")}
                        </span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            lead.priority === "HIGH" ? "text-rose-600" :
                            lead.priority === "MEDIUM" ? "text-amber-600" : "text-slate-600"
                          }`}>
                            {lead.priority} PRIORITY
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-5 text-sm">
                        <div className="text-slate-900">{lead.assignedStaff?.name || "Unassigned"}</div>
                        <div className="mt-1 text-xs text-slate-500">{format(new Date(lead.createdAt), "MMM d, yyyy")}</div>
                      </td>
                      <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right sm:pr-6">
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-100">
                          <span className="sr-only">Options</span>
                          <MoreHorizontal className="h-5 w-5" />
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

      <CreateLeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchLeads();
        }}
      />
    </div>
  );
}

function CreateLeadModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    contactNumber: "",
    serviceType: "SOFA_WORK",
    inquirySource: "WHATSAPP",
    priority: "MEDIUM"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        setFormData({ customerName: "", contactNumber: "", serviceType: "SOFA_WORK", inquirySource: "WHATSAPP", priority: "MEDIUM" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-200 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-900">Add New Lead</h3>
          <p className="text-sm text-slate-500">Enter customer inquiry details below.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium leading-6 text-slate-900">Customer Name *</label>
            <input 
              required
              type="text" 
              className="mt-1 block w-full rounded-md border-0 py-2 pl-3 bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-slate-900">Contact Number *</label>
            <input 
              required
              type="text" 
              className="mt-1 block w-full rounded-md border-0 py-2 pl-3 bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={formData.contactNumber}
              onChange={e => setFormData({...formData, contactNumber: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Service Type</label>
              <select 
                className="mt-1 block w-full rounded-md border-0 py-2 pl-3 pr-8 bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={formData.serviceType}
                onChange={e => setFormData({...formData, serviceType: e.target.value})}
              >
                <option value="SOFA_WORK">Sofa Work</option>
                <option value="MODULAR_KITCHEN">Modular Kitchen</option>
                <option value="WARDROBE">Wardrobe</option>
                <option value="INTERIOR_DESIGN">Interior Design</option>
                <option value="OFFICE_FURNITURE">Office Furniture</option>
                <option value="REPAIR_SERVICE">Repair Service</option>
                <option value="CUSTOM_FURNITURE">Custom Furniture</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Source</label>
              <select 
                className="mt-1 block w-full rounded-md border-0 py-2 pl-3 pr-8 bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={formData.inquirySource}
                onChange={e => setFormData({...formData, inquirySource: e.target.value})}
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WEBSITE">Website</option>
                <option value="DIRECT_CALL">Direct Call</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-4 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold leading-6 text-slate-900 hover:text-slate-600 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
