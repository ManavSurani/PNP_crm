"use client";

import { useState, useEffect } from "react";
import { HardHat, Plus, Loader2, Check, X, Phone, IndianRupee, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-slate-900 font-bold placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-sm";

const ROLES = [
  { val: "CARPENTER", label: "Carpenter", color: "bg-amber-500" },
  { val: "HELPER", label: "Helper", color: "bg-slate-500" },
  { val: "PAINTER", label: "Painter", color: "bg-sky-500" },
  { val: "ELECTRICIAN", label: "Electrician", color: "bg-yellow-500" },
  { val: "DESIGNER", label: "Designer", color: "bg-indigo-500" },
  { val: "INSTALLATION", label: "Installation", color: "bg-emerald-500" },
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", role: "CARPENTER", dailyRate: "" });

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/workers");
      setWorkers(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setIsModalOpen(false);
      setForm({ name: "", phone: "", role: "CARPENTER", dailyRate: "" });
      fetchWorkers();
    } catch (error) { console.error(error); }
    finally { setIsSaving(false); }
  };

  const roleMeta = (role: string) => ROLES.find(r => r.val === role) || ROLES[1];
  const totalDailyCost = workers.reduce((s, w) => s + (w.dailyRate || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-orange-500 relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Worker Directory</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Carpenters, helpers, painters & site team</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-orange-600 hover:bg-orange-500 px-8 py-5 rounded-2xl text-white font-black flex items-center gap-3 text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl"
        >
          <Plus className="h-5 w-5" /> Add Worker
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Workers", val: workers.length, icon: HardHat, color: "text-orange-600 bg-orange-50" },
          { label: "Carpenters", val: workers.filter(w => w.role === "CARPENTER").length, icon: Wrench, color: "text-amber-600 bg-amber-50" },
          { label: "On-Site Team", val: workers.filter(w => ["HELPER", "INSTALLATION"].includes(w.role)).length, icon: HardHat, color: "text-emerald-600 bg-emerald-50" },
          { label: "Daily Cost (Full Team)", val: `₹${totalDailyCost.toLocaleString()}`, icon: IndianRupee, color: "text-indigo-600 bg-indigo-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-center">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Worker Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-orange-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map(w => {
            const role = roleMeta(w.role);
            return (
              <div key={w.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 flex items-center gap-4">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-lg uppercase", role.color)}>
                    {w.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white uppercase truncate">{w.name}</p>
                    <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-white", role.color)}>
                      {role.label}
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {w.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-orange-500 shrink-0" />
                      <a href={`tel:${w.phone}`} className="text-sm font-black text-slate-900 hover:text-orange-600 transition-colors">{w.phone}</a>
                    </div>
                  )}
                  <div className="bg-orange-50 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-orange-500" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Rate</p>
                    </div>
                    <p className="font-black text-orange-600">
                      {w.dailyRate ? `₹${Number(w.dailyRate).toLocaleString()} / Day` : "Not Set"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {workers.length === 0 && (
            <div className="col-span-3 text-center py-24 text-slate-300">
              <HardHat className="h-12 w-12 mx-auto mb-3" />
              <p className="font-black uppercase tracking-widest text-sm">No workers in the directory yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-orange-600 px-10 py-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><HardHat className="h-6 w-6" /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Add Worker</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Full Name *</label>
                <input required className={inputCls} placeholder="e.g. Ramesh Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Phone *</label>
                  <input required className={inputCls} placeholder="9876543210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Daily Rate (₹)</label>
                  <input type="number" min="0" className={inputCls} placeholder="600" value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Specialization</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button key={r.val} type="button" onClick={() => setForm({ ...form, role: r.val })}
                      className={cn("py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all",
                        form.role === r.val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      )}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-orange-600 hover:bg-orange-700 px-10 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
