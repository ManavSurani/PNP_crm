"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Wallet, Loader2, Check, X, TrendingDown, PieChart, Package, Wrench, IndianRupee, Filter, RotateCcw, Search, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { val: "MATERIAL", label: "Raw Materials", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { val: "WORKER_WAGE", label: "Labor Charges", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { val: "PETTY_CASH", label: "Petty Cash", color: "bg-slate-50 text-slate-500 border-slate-100" },
  { val: "SHOWROOM", label: "Showroom Expenses", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { val: "MARKETING", label: "Marketing", color: "bg-sky-50 text-sky-700 border-sky-100" },
  { val: "TRANSPORT", label: "Transport & Logistics", color: "bg-amber-50 text-amber-700 border-amber-100" },
];

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("NEWEST");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    category: "MATERIAL",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions?type=EXPENSE");
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        console.error("Expenses API returned non-array data:", data);
        setExpenses([]);
      }
    } catch (e) { 
      console.error("Failed to fetch expenses:", e);
      setExpenses([]);
    }
    finally { setIsLoading(false); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          type: "EXPENSE",
          paidTo: "Vendor / Supplier",
        }),
      });
      setIsModalOpen(false);
      setForm({ category: "MATERIAL", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
      fetchExpenses();
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const filtered = expenses.filter(e => {
    const matchesCat = filterCat === "ALL" || e.category === filterCat;
    const matchesSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase());
    
    const eDate = new Date(e.date);
    const matchesStart = !dateRange.start || eDate >= new Date(dateRange.start);
    const matchesEnd = !dateRange.end || eDate <= new Date(dateRange.end + "T23:59:59");

    return matchesCat && matchesSearch && matchesStart && matchesEnd;
  }).sort((a, b) => {
    if (sortBy === "NEWEST") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "OLDEST") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === "AMT_HIGH") return b.amount - a.amount;
    if (sortBy === "AMT_LOW") return a.amount - b.amount;
    return 0;
  });

  const breakdown = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.val).reduce((s, e) => s + (Number(e.amount) || 0), 0),
    count: expenses.filter(e => e.category === cat.val).length,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Business Expenses</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Track your operations costs and monthly expenditures.</p>
        </div>
        <div className="relative z-10 flex flex-col md:items-end gap-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Spent</p>
          <div className="flex items-center gap-3">
             <span className="text-2xl font-bold text-slate-900">₹{totalExpenses.toLocaleString()}</span>
             <button
               onClick={() => setIsModalOpen(true)}
               className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md border border-indigo-500/20"
             >
               <Plus className="h-4 w-4" /> Add New Expense
             </button>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scroll/Grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        <button
          onClick={() => setFilterCat("ALL")}
          className={cn(
            "p-5 rounded-xl border min-w-[160px] text-left transition-all shrink-0",
            filterCat === "ALL" ? "bg-slate-900 border-slate-900 shadow-lg" : "bg-white border-slate-200 hover:border-primary/30"
          )}
        >
          <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", filterCat === "ALL" ? "text-slate-400" : "text-slate-400")}>Consolidated</p>
          <p className={cn("text-lg font-bold", filterCat === "ALL" ? "text-white" : "text-slate-900")}>₹{totalExpenses.toLocaleString()}</p>
          <p className={cn("text-[10px] font-medium mt-0.5", filterCat === "ALL" ? "text-indigo-400" : "text-slate-400")}>{expenses.length} Records</p>
        </button>
        {breakdown.map(cat => (
          <button key={cat.val}
            onClick={() => setFilterCat(filterCat === cat.val ? "ALL" : cat.val)}
            className={cn(
              "p-5 rounded-xl border min-w-[160px] text-left transition-all shrink-0 group",
              filterCat === cat.val ? "bg-primary border-primary shadow-lg" : "bg-white border-slate-200 hover:border-primary/30"
            )}>
            <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", filterCat === cat.val ? "text-white/60" : "text-slate-400")}>{cat.label}</p>
            <p className={cn("text-lg font-bold", filterCat === cat.val ? "text-white" : "text-slate-900")}>₹{cat.total.toLocaleString()}</p>
            <p className={cn("text-[10px] font-medium mt-0.5", filterCat === cat.val ? "text-white/60" : "text-slate-400")}>{cat.count} Entries</p>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
            placeholder="Search in descriptions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 border rounded-xl text-sm font-semibold transition shadow-sm",
              showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className="h-4 w-4" /> {showFilters ? "Hide" : "Filters"}
          </button>
          <button 
            onClick={() => {
              setSearch("");
              setFilterCat("ALL");
              setDateRange({ start: "", end: "" });
              setSortBy("NEWEST");
            }}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Sort By</label>
              <select 
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="NEWEST">Date: Newest First</option>
                <option value="OLDEST">Date: Oldest First</option>
                <option value="AMT_HIGH">Amount: High to Low</option>
                <option value="AMT_LOW">Amount: Low to High</option>
              </select>
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">From Date</label>
              <input 
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={dateRange.start}
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
              />
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">To Date</label>
              <input 
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={dateRange.end}
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
              />
           </div>
        </div>
      )}

      {/* Main List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm font-medium">Fetching Financial Records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
             <table className="min-w-full divide-y divide-slate-200">
               <thead className="bg-slate-50/50">
                 <tr>
                   <th scope="col" className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                   <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                   <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                   <th scope="col" className="px-3 py-4 text-right pr-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                 </tr>
               </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map(exp => {
                    return (
                      <tr key={exp.id} className="group hover:bg-slate-50 transition-all">
                        <td className="whitespace-nowrap py-5 pl-8 pr-3">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border bg-slate-100 text-slate-700">
                            {exp.category?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-3 py-5">
                           <p className="text-sm font-medium text-slate-700 max-w-sm truncate">{exp.description || "No detail provided"}</p>
                           {exp.lead && <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Project: {exp.lead.customerName}</p>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-xs text-slate-500 font-medium">
                          {format(new Date(exp.date), "dd MMM, yyyy")}
                        </td>
                        <td className="whitespace-nowrap py-5 px-3 text-right pr-8">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                            ₹{exp.amount.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                 {filtered.length === 0 && (
                   <tr>
                     <td colSpan={4} className="py-20 text-center">
                       <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 text-slate-300">
                         <Wallet className="h-6 w-6" />
                       </div>
                       <h3 className="text-sm font-semibold text-slate-900">No transactions found</h3>
                       <p className="mt-1 text-xs text-slate-500">Record an expense to see it in your ledger.</p>
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
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Record Expense</h2>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Financial Outflow documentation</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Classification</label>
                <select className={inputCls} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-start-2">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Transaction Date *</label>
                  <input required type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="col-start-1 row-start-1">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Amount (₹) *</label>
                  <input required type="number" min="1" className={inputCls} placeholder="e.g. 5000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Narration / Notes *</label>
                <textarea required rows={3} className={inputCls} 
                  placeholder="Material purchased, site overheads, worker disbursements..." 
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} 
                />
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-semibold text-sm hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md border border-indigo-500/20">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Record Expense
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
