"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Wallet,
  IndianRupee,
  ArrowLeft,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  User,
  Tag,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Loader2,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

type Transaction = {
  id: string;
  type: "RECEIVED" | "EXPENSE";
  amount: number;
  date: string;
  paidTo: string;
  category: string;
  paymentMode: string;
  description: string | null;
}

type Customer = {
  id: string;
  customerName: string;
  project?: { name: string | null } | null;
  orders: any[];
  transactions: Transaction[];
}

export default function FinancialsPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const initialType = searchParams.get("type") as "RECEIVED" | "EXPENSE" | null;
  const [typeFilter, setTypeFilter] = useState<"ALL" | "RECEIVED" | "EXPENSE">(initialType || "ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculations
  const projectAmount = useMemo(() => 
    customer?.orders?.reduce((acc, o) => acc + o.totalAmount, 0) || 0
  , [customer]);

  const received = useMemo(() => 
    customer?.transactions
      ?.filter(t => t.type === "RECEIVED")
      .reduce((acc, t) => acc + t.amount, 0) || 0
  , [customer]);

  const expenses = useMemo(() => 
    customer?.transactions
      ?.filter(t => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0) || 0
  , [customer]);

  const profit = projectAmount - expenses;
  const profitMargin = projectAmount > 0 ? (profit / projectAmount) * 100 : 0;

  // Filtered Data
  const filteredTransactions = useMemo(() => {
    if (!customer?.transactions) return [];
    return customer.transactions
      .filter(t => {
        const matchType = typeFilter === "ALL" || t.type === typeFilter;
        const matchSearch = t.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (t.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
        const matchCat = categoryFilter === "All Categories" || t.category === categoryFilter;
        return matchType && matchSearch && matchCat;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customer, typeFilter, searchQuery, categoryFilter]);

  const categories = useMemo(() => {
    if (!customer?.transactions) return [];
    return ["All Categories", ...Array.from(new Set(customer.transactions.map(t => t.category)))];
  }, [customer]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-10 text-center text-slate-500 font-bold">
        Data error. Please go back.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between px-2 pt-2 mb-6">
          <Link 
            href={`/customers/${id}`}
            className="group flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
          >
            <div className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-colors bg-white shadow-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
            </div>
            BACK
          </Link>
          
          <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
            <Link href="/customers" className="text-slate-300 hover:text-slate-500 transition-colors">Customer Directory</Link>
            <ChevronRight className="h-3 w-3 text-slate-200" /> 
            <Link href={`/customers/${id}`} className="text-slate-300 hover:text-slate-500 transition-colors">{customer.customerName.toUpperCase()}</Link>
            <ChevronRight className="h-3 w-3 text-slate-200" /> 
            <span className="text-slate-900">FINANCIALS</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-8">
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Ledger</h1>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Manage transactions and project billing for {customer.project?.name || customer.customerName}
              </p>
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-lg shadow-slate-900/10 hover:translate-y-[-1px] transition-all">
              <Download className="h-3.5 w-3.5" /> Export PDF
           </button>
        </div>
        
        {/* ── PROFITABILITY DASHBOARD ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
           <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative">Total Billing</p>
                 <h2 className="text-2xl font-black text-slate-900 relative">₹{projectAmount.toLocaleString("en-IN")}</h2>
                 <p className="text-[10px] text-emerald-600 font-bold mt-1 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                    Contract Value
                 </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative">Total Outflow</p>
                 <h2 className="text-2xl font-black text-rose-600 relative">₹{expenses.toLocaleString("en-IN")}</h2>
                 <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-slate-500 font-medium">{customer.transactions.filter(t => t.type === "EXPENSE").length} Entries</p>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-900/5 shadow-sm relative overflow-hidden group ring-2 ring-indigo-600/5">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative">Project Net Profit</p>
                 <h2 className="text-2xl font-black text-indigo-600 relative">₹{profit.toLocaleString("en-IN")}</h2>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                       {profitMargin.toFixed(1)}% Margin
                    </span>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-900/10 flex flex-col justify-between">
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Recovery</p>
                 <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-black text-white">₹{received.toLocaleString("en-IN")}</span>
                    <span className="text-xs font-bold text-emerald-400">
                       {projectAmount > 0 ? Math.round((received / projectAmount) * 100) : 0}%
                    </span>
                 </div>
                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${projectAmount > 0 ? (received/projectAmount)*100 : 0}%` }} 
                    />
                 </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Balance Due</span>
                    <span className="text-amber-400">₹{(projectAmount - received).toLocaleString("en-IN")}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
           <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                placeholder="Search by party, category or note..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-2 w-full md:w-auto">
              <select 
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
              >
                <option value="ALL">All Entries</option>
                <option value="RECEIVED">Received</option>
                <option value="EXPENSE">Expense</option>
              </select>

              <select 
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
        </div>

        {/* ── TRANSACTION LEDGER ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                 <FileText className="h-4 w-4 text-indigo-500" /> Detailed Ledger
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 Showing {filteredTransactions.length} of {customer.transactions.length} Records
              </p>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                       {["Date", "Entity / Note", "Category", "Mode", "Type", "Amount"].map(h => (
                         <th key={h} className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase">
                            {h}
                         </th>
                       ))}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                         <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-900">{format(new Date(t.date), "dd MMM, yyyy")}</span>
                               <span className="text-[9px] text-slate-400 font-medium uppercase">{format(new Date(t.date), "EEEE")}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-slate-800">{t.paidTo}</span>
                               <span className="text-xs text-slate-400 italic max-w-md truncate">{t.description || "Internal financial entry"}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                               {t.category}
                            </span>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                               <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {t.paymentMode}
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <span className={cn(
                               "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1",
                               t.type === "RECEIVED" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                               {t.type === "RECEIVED" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                               {t.type}
                            </span>
                         </td>
                         <td className="px-8 py-5 text-right whitespace-nowrap">
                            <span className={cn(
                               "text-lg font-black",
                               t.type === "RECEIVED" ? "text-emerald-600" : "text-rose-600"
                            )}>
                               {t.type === "RECEIVED" ? "+" : "−"} ₹{t.amount.toLocaleString("en-IN")}
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {filteredTransactions.length === 0 && (
             <div className="py-24 text-center">
                <PieChart className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No matching transactions found</h4>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
