"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, Loader2 } from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      setSuppliers(await res.json());
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contactPerson, phone, gstNumber, address })
      });
      setIsModalOpen(false);
      setName(""); setContactPerson(""); setPhone(""); setGstNumber(""); setAddress("");
      fetchSuppliers();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Suppliers & Vendors</h1>
          <p className="text-sm text-slate-500">Manage all material suppliers, vendor contacts, and GST records.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button onClick={() => setIsModalOpen(true)} className="block rounded-lg bg-teal-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-teal-500 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
           <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-teal-500" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6 uppercase">Company Name</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Contact Person</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">GST Registration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {suppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-sm text-slate-500 mt-1 max-w-xs truncate">{s.address || "No address provided"}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5">
                    <div className="font-medium text-slate-800">{s.contactPerson || "Unknown"}</div>
                    <div className="text-sm text-slate-500 mt-1">{s.phone}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5">
                    {s.gstNumber ? (
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">{s.gstNumber}</span>
                    ) : <span className="text-sm text-slate-400 italic">Unregistered</span>}
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-slate-500">No suppliers tracked yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-200">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Truck className="h-5 w-5 text-teal-500" />
                <h3 className="text-lg font-semibold text-slate-900">Register New Supplier</h3>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900">Company / Vendor Name *</label>
                  <input required type="text" className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-teal-500" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Contact Person</label>
                  <input type="text" className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-teal-500" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Primary Phone *</label>
                  <input required type="text" className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-teal-500" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">GST Number</label>
                  <input type="text" className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm font-mono uppercase focus:ring-2 focus:ring-teal-500" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Warehouse Address</label>
                  <textarea rows={2} className="mt-1 w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-teal-500" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-semibold text-slate-700">Cancel</button>
                  <button type="submit" className="rounded-md bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500">Save Supplier</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
