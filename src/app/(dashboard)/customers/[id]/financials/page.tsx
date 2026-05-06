"use client";

import { use, useState, useEffect, useMemo } from "react";
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
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  X,
  CreditCard,
  History,
  Info
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
  addedBy?: string;
}

type Customer = {
  id: string;
  customerName: string;
  project?: { name: string | null } | null;
  transactions: Transaction[];
}

export default function FinancialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "RECEIVED" | "EXPENSE">("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"RECEIVED" | "EXPENSE">("RECEIVED");

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [custRes, quotRes] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/project-quotations?customer_id=${id}`)
      ]);
      
      if (custRes.ok) setCustomer(await custRes.json());
      if (quotRes.ok) setQuotations(await quotRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  // Financial Calculations
  const totalProjectValue = useMemo(() => quotations.reduce((sum, q) => sum + q.amount, 0), [quotations]);
  const totalIncome = useMemo(() => customer?.transactions?.filter(t => t.type === "RECEIVED").reduce((sum, t) => sum + t.amount, 0) || 0, [customer]);
  const totalExpense = useMemo(() => customer?.transactions?.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0) || 0, [customer]);
  
  const balance = totalIncome - totalExpense;
  const pending = totalProjectValue - totalIncome;
  const profit = totalIncome - totalExpense; // As per user: Customer Payment Received - Total Expenses
  const expenseRatio = totalProjectValue > 0 ? (totalExpense / totalProjectValue) * 100 : 0;
  const collectionPercentage = totalProjectValue > 0 ? (totalIncome / totalProjectValue) * 100 : 0;

  const incomeTransactions = useMemo(() => 
    customer?.transactions?.filter(t => t.type === "RECEIVED" && 
      (t.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []
  , [customer, searchQuery]);

  const expenseTransactions = useMemo(() => 
    customer?.transactions?.filter(t => t.type === "EXPENSE" && 
      (t.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []
  , [customer, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" strokeWidth={1.5} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Ledger</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        
        {/* --- TOP HEADER --- */}
        <div className="flex items-center justify-between px-2 pt-2 mb-8">
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
            <span className="text-slate-900">FINANCIAL LEDGER</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{customer.customerName}</h1>
              <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-600/20">
                Financial Workspace
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" /> Project: <span className="text-slate-900 font-bold">{customer.project?.name || "Standard Project"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm min-w-[200px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Balance</p>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-black", balance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  ₹{balance.toLocaleString("en-IN")}
                </span>
                {balance >= 0 ? <ArrowUpRight className="h-5 w-5 text-emerald-500" /> : <ArrowDownRight className="h-5 w-5 text-rose-500" />}
              </div>
            </div>
            <button className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Project Value", value: totalProjectValue, icon: CreditCard, color: "text-slate-900", bg: "bg-white" },
            { label: "Remaining Pending", value: pending, icon: History, color: "text-amber-600", bg: "bg-amber-50/50" },
            { label: "Total Net Profit", value: profit, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50/50" },
            { label: "Expense Ratio", value: `${expenseRatio.toFixed(1)}%`, icon: PieChart, color: "text-rose-600", bg: "bg-rose-50/50" },
          ].map((card, i) => (
            <div key={i} className={cn("p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md", card.bg)}>
              <div className="flex items-start justify-between mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <card.icon className={cn("h-5 w-5 opacity-20", card.color)} />
              </div>
              <p className={cn("text-2xl font-black", card.color)}>
                {typeof card.value === 'number' ? `₹${card.value.toLocaleString("en-IN")}` : card.value}
              </p>
              {card.label === "Total Project Value" && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recovery</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{collectionPercentage.toFixed(1)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* --- CONTROLS & FILTERS --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-10 flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <input 
              placeholder="Search ledger entries by description or party name..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
              onClick={() => { setModalType("RECEIVED"); setShowModal(true); }}>
              <Plus className="h-4 w-4" /> Add Income
            </button>
            <button className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
              onClick={() => { setModalType("EXPENSE"); setShowModal(true); }}>
              <Plus className="h-4 w-4" /> Add Expense
            </button>
            <button className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* --- MAIN LEDGER LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- MONEY IN (INCOME) --- */}
          <div className="space-y-6">
            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-600/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total Collections</p>
                <h3 className="text-3xl font-black">₹{totalIncome.toLocaleString("en-IN")}</h3>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="h-7 w-7 text-white" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Income Ledger</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Credit</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {incomeTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-20 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No income records yet</p>
                        </td>
                      </tr>
                    ) : incomeTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-900">{format(new Date(t.date), "dd MMM, yyyy")}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{t.paidTo}</span>
                            <span className="text-[10px] text-slate-400 font-medium italic truncate max-w-[200px]">{t.description || "Credit entry"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-sm font-black text-emerald-600">+ ₹{t.amount.toLocaleString("en-IN")}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* --- MONEY OUT (EXPENSE) --- */}
          <div className="space-y-6">
            <div className="bg-rose-600 rounded-2xl p-6 text-white shadow-xl shadow-rose-600/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total Project Expenses</p>
                <h3 className="text-3xl font-black">₹{totalExpense.toLocaleString("en-IN")}</h3>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="h-7 w-7 text-white" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expense Ledger</span>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase">Debit</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenseTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-20 text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No expense records yet</p>
                        </td>
                      </tr>
                    ) : expenseTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-900">{format(new Date(t.date), "dd MMM, yyyy")}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{t.paidTo}</span>
                            <span className="text-[10px] text-slate-400 font-medium italic truncate max-w-[200px]">{t.description || "Debit entry"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-sm font-black text-rose-600">− ₹{t.amount.toLocaleString("en-IN")}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* --- ACTIVITY FEED --- */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3">
             <History className="h-5 w-5 text-slate-400" />
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Financial Activity</h3>
          </div>
          <div className="p-8">
             <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {customer.transactions.slice(0, 5).map((t, idx) => (
                  <div key={idx} className="relative flex items-start gap-6 group">
                     <div className={cn(
                       "h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-white relative z-10",
                       t.type === "RECEIVED" ? "bg-emerald-500" : "bg-rose-500"
                     )}>
                        {t.type === "RECEIVED" ? <Plus className="h-3.5 w-3.5 text-white" /> : <TrendingDown className="h-3.5 w-3.5 text-white" />}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                           <p className="text-sm font-bold text-slate-900">
                             {t.type === "RECEIVED" ? "Incoming Payment Recorded" : "Project Expense Logged"}
                           </p>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(t.date), "dd MMM, HH:mm")}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {t.type === "RECEIVED" ? `Received ₹${t.amount.toLocaleString("en-IN")} from customer via ${t.paymentMode}.` : `Spent ₹${t.amount.toLocaleString("en-IN")} for ${t.category} (${t.paidTo}).`}
                        </p>
                     </div>
                  </div>
                ))}
                {customer.transactions.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No activities recorded yet</p>
                  </div>
                )}
             </div>
          </div>
        </div>

      </div>

      {/* --- TRANSACTION MODAL --- */}
      {showModal && (
        <TransactionModal 
          type={modalType} 
          leadId={id} 
          onClose={() => setShowModal(false)} 
          onSuccess={fetchData} 
        />
      )}

    </div>
  );
}

function TransactionModal({ type, leadId, onClose, onSuccess }: { type: "RECEIVED" | "EXPENSE", leadId: string, onClose: () => void, onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [category, setCategory] = useState(type === "RECEIVED" ? "Customer Payment" : "Material");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paidTo || !date) {
      setErr("Please fill all required fields");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          type,
          amount: parseFloat(amount),
          date,
          paidTo,
          category,
          paymentMode,
          description
        })
      });
      
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const d = await res.json();
        setErr(d.error || "Failed to save transaction");
      }
    } catch (e) {
      setErr("Connection error");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = type === "RECEIVED" 
    ? ["Customer Payment", "Booking Advance", "Milestone Payment", "Tax/GST Payment", "Other"]
    : ["Material", "Labour", "Transport", "Contractor", "Site Expense", "Utility", "Other"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={cn("px-8 py-6 flex items-center justify-between text-white", type === "RECEIVED" ? "bg-emerald-600" : "bg-rose-600")}>
          <div className="flex items-center gap-3">
            <PlusCircle className="h-6 w-6" />
            <h2 className="text-xl font-black tracking-tight">Record {type === "RECEIVED" ? "Income" : "Expense"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {err && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold uppercase rounded-lg">{err}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
              <input 
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
              <input 
                type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {type === "RECEIVED" ? "Payer Name / Source" : "Vendor / Supplier Name"}
            </label>
            <input 
              value={paidTo} onChange={e => setPaidTo(e.target.value)}
              placeholder={type === "RECEIVED" ? "Customer Name or Bank" : "e.g. Asian Paints, Local Hardware"}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
              <select 
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
              <select 
                value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none cursor-pointer"
              >
                {["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "CREDIT_CARD", "OTHER"].map(m => (
                  <option key={m} value={m}>{m.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes / Description</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Internal notes about this transaction..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none resize-none"
            />
          </div>

          <button 
            type="submit" disabled={isSaving}
            className={cn(
              "w-full py-4 rounded-2xl text-white text-sm font-black uppercase tracking-widest shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50",
              type === "RECEIVED" ? "bg-emerald-600 shadow-emerald-600/20" : "bg-rose-600 shadow-rose-600/20"
            )}
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : `Record ${type === "RECEIVED" ? "Income" : "Expense"}`}
          </button>
        </form>
      </div>
    </div>
  );
}
