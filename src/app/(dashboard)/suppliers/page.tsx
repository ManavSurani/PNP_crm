"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, Loader2, Check, X, Phone, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-slate-900 font-bold placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-sm";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", contactPerson: "", phone: "", gstNumber: "", address: ""
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      setSuppliers(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setIsModalOpen(false);
      setForm({ name: "", contactPerson: "", phone: "", gstNumber: "", address: "" });
      fetchSuppliers();
    } catch (error) { console.error(error); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-teal-500 relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Suppliers & Vendors</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Material suppliers, vendor contacts & GST records</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-teal-600 hover:bg-teal-500 px-8 py-5 rounded-2xl text-white font-black flex items-center gap-3 text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl"
        >
          <Plus className="h-5 w-5" /> Add Supplier
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Suppliers", val: suppliers.length, icon: Truck, color: "text-teal-600 bg-teal-50" },
          { label: "GST Registered", val: suppliers.filter(s => s.gstNumber).length, icon: Building2, color: "text-indigo-600 bg-indigo-50" },
          { label: "Active Contacts", val: suppliers.filter(s => s.phone).length, icon: Phone, color: "text-emerald-600 bg-emerald-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-center">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-teal-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 flex items-center gap-4">
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center font-black text-teal-700 text-lg uppercase">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white uppercase truncate">{s.name}</p>
                  <p className="text-xs text-teal-200 font-bold">{s.contactPerson || "No contact person"}</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {s.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-teal-500 shrink-0" />
                    <a href={`tel:${s.phone}`} className="text-sm font-black text-slate-900 hover:text-teal-600 transition-colors">{s.phone}</a>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{s.address}</p>
                  </div>
                )}
                {s.gstNumber && (
                  <div className="bg-indigo-50 p-3 rounded-xl flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="font-mono text-xs text-indigo-700 font-black uppercase">{s.gstNumber}</span>
                  </div>
                )}
                {!s.gstNumber && <p className="text-xs text-slate-400 italic font-bold">GST: Unregistered</p>}
              </div>
            </div>
          ))}
          {suppliers.length === 0 && (
            <div className="col-span-3 text-center py-24 text-slate-300">
              <Truck className="h-12 w-12 mx-auto mb-3" />
              <p className="font-black uppercase tracking-widest text-sm">No suppliers registered yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-teal-600 px-10 py-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><Truck className="h-6 w-6" /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Add Supplier</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Company / Vendor Name *</label>
                <input required className={inputCls} placeholder="e.g. Sharma Timber Co." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Contact Person</label>
                  <input className={inputCls} placeholder="Name" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Phone *</label>
                  <input required className={inputCls} placeholder="9876543210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">GST Number</label>
                <input className={cn(inputCls, "font-mono uppercase")} placeholder="27XXXXX..." value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Warehouse / Office Address</label>
                <textarea rows={2} className={inputCls} placeholder="Supplier address..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 px-10 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
