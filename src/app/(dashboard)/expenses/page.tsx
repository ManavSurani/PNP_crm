"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Wallet, Loader2, Check, X, TrendingDown, PieChart, Package, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-slate-900 font-bold placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-sm";

const CATEGORIES = [
  { val: "MATERIAL", label: "Raw Material", color: "bg-amber-100 text-amber-700" },
  { val: "WORKER_WAGE", label: "Worker Wage", color: "bg-indigo-100 text-indigo-700" },
  { val: "PETTY_CASH", label: "Petty Cash", color: "bg-slate-100 text-slate-700" },
  { val: "SHOWROOM", label: "Showroom", color: "bg-purple-100 text-purple-700" },
  { val: "MARKETING", label: "Marketing / Ads", color: "bg-sky-100 text-sky-700" },
  { val: "TRANSPORT", label: "Transport", color: "bg-orange-100 text-orange-700" },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("ALL");

  const [form, setForm] = useState({
    category: "MATERIAL",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/expenses");
      setExpenses(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setIsModalOpen(false);
      setForm({ category: "MATERIAL", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
      fetchExpenses();
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const filtered = filterCat === "ALL" ? expenses : expenses.filter(e => e.category === filterCat);

  // Category breakdown
  const breakdown = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.val).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === cat.val).length,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-rose-500 relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Expense Ledger</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Operational cost tracking — All categories</p>
        </div>
        <div className="relative z-10 text-right">
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Total Spent</p>
          <p className="text-3xl font-black text-rose-400">₹{totalExpenses.toLocaleString()}</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 bg-rose-600 hover:bg-rose-500 px-6 py-4 rounded-2xl text-white font-black flex items-center gap-2 text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl"
          >
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Category Breakdown Cards (P3) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {breakdown.map(cat => (
          <button key={cat.val}
            onClick={() => setFilterCat(filterCat === cat.val ? "ALL" : cat.val)}
            className={cn(
              "p-4 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
              filterCat === cat.val ? "border-slate-900 bg-slate-900 text-white" : "bg-white border-slate-100"
            )}>
            <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", filterCat === cat.val ? "text-slate-400" : "text-slate-400")}>{cat.label}</p>
            <p className={cn("text-lg font-black", filterCat === cat.val ? "text-white" : "text-slate-900")}>₹{cat.total.toLocaleString()}</p>
            <p className={cn("text-[10px] font-bold mt-0.5", filterCat === cat.val ? "text-slate-400" : "text-slate-400")}>{cat.count} entries</p>
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-rose-500" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-50">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-5 pl-8 pr-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filtered.map(exp => {
                const cat = CATEGORIES.find(c => c.val === exp.category);
                return (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-all">
                    <td className="py-5 pl-8 pr-3">
                      <span className={cn("px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest", cat?.color || "bg-slate-100 text-slate-700")}>
                        {cat?.label || exp.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-5">
                      <p className="text-xl font-black text-rose-600">₹{exp.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-3 py-5">
                      <p className="text-sm text-slate-700 font-bold max-w-sm truncate">{exp.description || "—"}</p>
                    </td>
                    <td className="px-3 py-5 text-sm text-slate-500 font-bold">
                      {format(new Date(exp.date || exp.createdAt), "dd MMM yyyy")}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No expenses found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-rose-600 px-10 py-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><Wallet className="h-6 w-6" /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Add Expense</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Category</label>
                <select className={inputCls} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Amount (₹) *</label>
                  <input required type="number" min="1" className={inputCls} placeholder="e.g. 5000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Date *</label>
                  <input required type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Description *</label>
                <textarea required rows={3} className={inputCls} placeholder="Material purchased from supplier, worker wages for project #12..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-rose-600 hover:bg-rose-700 px-10 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
