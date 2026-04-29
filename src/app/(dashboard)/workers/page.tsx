"use client";

import { useState, useEffect } from "react";
import { HardHat, Plus, Loader2, Check, X, Phone, IndianRupee, Wrench, User, Search, RotateCcw, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { val: "CARPENTER", label: "Carpenter", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { val: "HELPER", label: "Helper", color: "bg-slate-50 text-slate-500 border-slate-100" },
  { val: "PAINTER", label: "Painter", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { val: "ELECTRICIAN", label: "Electrician", color: "bg-amber-50 text-amber-700 border-amber-100" },
  { val: "DESIGNER", label: "Designer", color: "bg-primary/10 text-primary border-primary/20" },
  { val: "INSTALLATION", label: "Installation", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("NEWEST");

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

  const filtered = workers.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.phone.includes(search) ||
      w.role.toLowerCase().includes(search.toLowerCase());
    
    const wDate = new Date(w.createdAt);
    const matchesStart = !dateRange.start || wDate >= new Date(dateRange.start);
    const matchesEnd = !dateRange.end || wDate <= new Date(dateRange.end + "T23:59:59");
    
    return matchesSearch && matchesStart && matchesEnd;
  }).sort((a, b) => {
    if (sortBy === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "A-Z") return a.name.localeCompare(b.name);
    if (sortBy === "Z-A") return b.name.localeCompare(a.name);
    return 0;
  });

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
  const totalDailyCost = workers.reduce((s, w) => s + (Number(w.dailyRate) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Field Staff</h1>
          <p className="text-slate-500 text-sm mt-1">Manage carpenters, site helpers, and the execution team.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md border border-indigo-500/20"
        >
          <Plus className="h-4 w-4" /> Add New Staff
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          type="text"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
          placeholder="Search staff by name, phone or skill..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition shadow-sm",
            showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Filter className="h-4 w-4" /> {showFilters ? "Hide Options" : "More Filters"}
        </button>
        <button 
          onClick={() => {
            setSearch("");
            setDateRange({ start: "", end: "" });
            setSortBy("NEWEST");
          }}
          className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Sort Directory</label>
              <select 
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="NEWEST">Onboarded: Newest</option>
                <option value="OLDEST">Onboarded: Oldest</option>
                <option value="A-Z">Name: A-Z</option>
                <option value="Z-A">Name: Z-A</option>
              </select>
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Joined From</label>
              <input 
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={dateRange.start}
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
              />
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Joined To</label>
              <input 
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={dateRange.end}
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
              />
           </div>
        </div>
      )}

      {/* Summary KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Strength", val: workers.length, icon: User, color: "text-slate-600 bg-slate-50" },
          { label: "Carpenters", val: workers.filter(w => w.role === "CARPENTER").length, icon: Wrench, color: "text-indigo-600 bg-indigo-50" },
          { label: "Site Force", val: workers.filter(w => ["HELPER", "INSTALLATION"].includes(w.role)).length, icon: HardHat, color: "text-emerald-600 bg-emerald-50" },
          { label: "Est. Daily Pipeline", val: `₹${totalDailyCost.toLocaleString()}`, icon: IndianRupee, color: "text-rose-600 bg-rose-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-primary/30 transition-all">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-transform", card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Worker List Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm font-medium">Synchronizing Team Data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Member</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill / Role</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Details</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-8">Per Day Wage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(w => {
                  const role = roleMeta(w.role);
                  return (
                    <tr key={w.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-5 pl-8 pr-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-semibold border border-slate-200">
                            {w.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">{w.name}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400 uppercase tracking-wider">Verified Personnel</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-5">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border", role.color)}>
                          {role.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-5">
                        <div className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors transition-all">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <a href={`tel:${w.phone}`} className="text-xs font-medium">{w.phone}</a>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-5 px-3 text-right pr-8">
                        <div className="text-sm font-bold text-slate-900 leading-none">
                          ₹{Number(w.dailyRate || 0).toLocaleString()}
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">per working day</p>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 text-slate-300">
                        <User className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">No staff found</h3>
                      <p className="mt-1 text-xs text-slate-500">Try adjusting your search criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Onboard New Worker</h2>
                <p className="text-[11px] text-slate-500 font-medium">Enter personal and financial deployment details.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name *</label>
                <input required className={inputCls} placeholder="e.g. Rajesh Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-start-2">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Daily Rate (₹)</label>
                  <input type="number" min="0" className={inputCls} placeholder="750" value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: e.target.value })} />
                </div>
                <div className="col-start-1 row-start-1">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Phone Number *</label>
                  <input 
                    required 
                    maxLength={10}
                    className={inputCls} 
                    placeholder="10 digit number" 
                    value={form.phone} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setForm({ ...form, phone: val });
                    }} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Specialization</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button key={r.val} type="button" onClick={() => setForm({ ...form, role: r.val })}
                      className={cn("py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                        form.role === r.val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                      )}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-semibold text-sm hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md border border-indigo-500/20">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Complete Onboarding
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
