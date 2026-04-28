"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, Loader2, Check, X, Phone, MapPin, Building2, User, UserCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Vendor Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage material vendors, suppliers, and specialized service providers.</p>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md border border-indigo-500/20"
          >
            <Plus className="h-4 w-4" /> Add New Vendor
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Partners", val: suppliers.length, icon: Truck, color: "text-primary bg-indigo-50 border-indigo-100" },
          { label: "Verified GST", val: suppliers.filter(s => s.gstNumber).length, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { label: "Operational Contacts", val: suppliers.filter(s => s.phone).length, icon: Phone, color: "text-amber-600 bg-amber-50 border-amber-100" },
        ].map((card, i) => (
          <div key={i} className={cn("bg-white p-5 rounded-xl border shadow-sm flex gap-4 items-center transition-all", card.color)}>
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white shadow-sm ring-1 ring-black/5">
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{card.label}</p>
              <p className="text-lg font-bold mt-0.5 tracking-tight">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <span className="text-sm font-medium tracking-wide">Syncing Vendor Directory...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {suppliers.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                <div className="h-12 w-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-lg group-hover:text-primary group-hover:border-primary/20 transition-all">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{s.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <User className="h-3 w-3 text-slate-400" />
                    <p className="text-[11px] text-slate-500 font-medium truncate">{s.contactPerson || "Point of Contact Not Set"}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Contact</p>
                    {s.phone ? (
                      <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-primary">
                        <Phone className="h-3 w-3 text-slate-300" />
                        {s.phone}
                      </a>
                    ) : <span className="text-xs text-slate-300 italic font-medium">N/A</span>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tax Identity</p>
                    <div className="flex items-center gap-1.5">
                       <Building2 className="h-3 w-3 text-slate-300" />
                       <span className={cn(
                         "text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase",
                         s.gstNumber ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-mono" : "bg-slate-100 text-slate-400 border-slate-200"
                       )}>
                         {s.gstNumber || "Unregistered"}
                       </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Registered Address</p>
                   <div className="flex items-start gap-2">
                     <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
                     <p className="text-xs text-slate-500 font-medium leading-relaxed">{s.address || "Corporate address not provided."}</p>
                   </div>
                </div>
              </div>
            </div>
          ))}
          {suppliers.length === 0 && (
            <div className="col-span-1 md:col-span-2 xl:col-span-3 py-20 text-center border-2 border-dashed border-slate-200 rounded-xl">
               <Truck className="h-10 w-10 text-slate-200 mx-auto mb-4" />
               <h3 className="text-sm font-semibold text-slate-900">No vendors registered</h3>
               <p className="text-xs text-slate-500 mt-1">Register your first supply partner to manage material logistics.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Partner Registration</h2>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Onboarding new material vendor</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Entity Name *</label>
                <input required className={inputCls} placeholder="Legal company name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Key Contact Person</label>
                  <input className={inputCls} placeholder="Full Name" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Phone Number *</label>
                  <input required className={inputCls} placeholder="000 000 0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">GST Identification (Optional)</label>
                <input className={cn(inputCls, "font-mono uppercase")} placeholder="27XXXXX..." value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Operational Address</label>
                <textarea rows={2} className={inputCls} placeholder="Warehouse or corporate HQ address..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-semibold text-sm hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md border border-indigo-500/20">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 px-4 text-slate-900 font-medium placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm";
