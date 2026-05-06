"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Wallet,
  IndianRupee,
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  User,
  Search,
  ChevronRight,
  Loader2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  X,
  History,
  Info,
  Pencil,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertCircle
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

type FinancialLog = {
  id: string;
  action: string;
  details: string;
  amount: number | null;
  createdAt: string;
}

type Customer = {
  id: string;
  customerName: string;
  initialDealAmount: number;
  initialDealNotes: string | null;
  project?: { name: string | null } | null;
  transactions: Transaction[];
}

export default function FinancialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [logs, setLogs] = useState<FinancialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showTransModal, setShowTransModal] = useState(false);
  const [modalType, setModalType] = useState<"RECEIVED" | "EXPENSE">("RECEIVED");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Deal Amount Modal
  const [showDealModal, setShowDealModal] = useState(false);

  useEffect(() => {
    fetchData();
    fetchLogs();
  }, [id]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (res.ok) setCustomer(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch(`/api/leads/${id}/financial-logs`);
      if (res.ok) setLogs(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  // Calculations
  const totalReceived = useMemo(() => customer?.transactions?.filter(t => t.type === "RECEIVED").reduce((sum, t) => sum + t.amount, 0) || 0, [customer]);
  const totalExpense = useMemo(() => customer?.transactions?.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0) || 0, [customer]);
  const initialDeal = customer?.initialDealAmount || 0;
  
  const totalProjectCost = initialDeal + totalExpense;
  const remainingDue = totalProjectCost - totalReceived;

  const filteredIncome = useMemo(() => 
    customer?.transactions?.filter(t => t.type === "RECEIVED" && 
      (t.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []
  , [customer, searchQuery]);

  const filteredExpense = useMemo(() => 
    customer?.transactions?.filter(t => t.type === "EXPENSE" && 
      (t.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []
  , [customer, searchQuery]);

  const handleDeleteTransaction = async (transId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const res = await fetch(`/api/transactions?id=${transId}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-slate-50/30">
      
      {/* --- COMPACT STICKY SUMMARY HEADER --- */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/customers/${id}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                {customer.customerName}
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded">Ledger</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {customer.project?.name || "Standard Project"}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center gap-1">
             <SummaryWidget label="Initial Deal Amount" value={initialDeal} color="text-slate-600" />
             <div className="h-8 w-px bg-slate-200 mx-2" />
             <SummaryWidget label="Total Expenses" value={totalExpense} color="text-rose-600" prefix="+" />
             <div className="h-8 w-px bg-slate-200 mx-2" />
             <SummaryWidget label="Current Total" value={totalProjectCost} color="text-slate-900" isBold />
             <div className="h-8 w-px bg-slate-200 mx-2" />
             <SummaryWidget label="Client Paid" value={totalReceived} color="text-emerald-600" prefix="-" />
             <div className="h-8 w-px bg-slate-200 mx-2" />
             <SummaryWidget label="Remaining Due" value={remainingDue} color={remainingDue > 0 ? "text-amber-600" : "text-emerald-600"} highlight={remainingDue > 0} />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => { setModalType("RECEIVED"); setEditingTransaction(null); setShowTransModal(true); }} className="h-9 px-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 flex items-center gap-2">
              <Plus className="h-3 w-3" /> Income
            </button>
            <button onClick={() => { setModalType("EXPENSE"); setEditingTransaction(null); setShowTransModal(true); }} className="h-9 px-4 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all shadow-md shadow-rose-600/10 flex items-center gap-2">
              <Plus className="h-3 w-3" /> Expense
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        
        {/* --- INITIAL DEAL SETUP / EDIT --- */}
        {initialDeal === 0 ? (
          <div className="mb-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <IndianRupee className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Setup Project Finance</h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">Enter the final agreed deal amount to activate the accounting workspace.</p>
            <button 
              onClick={() => setShowDealModal(true)}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
            >
              Enter Final Deal Amount
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            
            {/* --- MAIN LEDGER COLUMNS --- */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              
              {/* SEARCH & FILTERS */}
              <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none text-xs font-bold outline-none rounded-lg focus:ring-2 focus:ring-slate-900/5 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 pr-1">
                   <button onClick={() => setShowDealModal(true)} className="h-8 px-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-1.5">
                     <Pencil className="h-3 w-3" /> Edit Deal
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* --- INCOME SECTION --- */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Client Payments (Income)
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">₹{totalReceived.toLocaleString()} Paid</span>
                  </div>
                  <div className="flex-1 overflow-auto max-h-[500px] compact-scrollbar">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                        <tr>
                          <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Date</th>
                          <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Party / Note</th>
                          <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-tighter">Amount</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredIncome.map(t => (
                          <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap text-[10px] font-bold text-slate-500 italic">{format(new Date(t.date), "dd MMM")}</td>
                            <td className="px-4 py-2">
                              <p className="text-[11px] font-black text-slate-800 leading-tight">{t.paidTo}</p>
                              <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{t.description || t.category}</p>
                            </td>
                            <td className="px-4 py-2 text-right text-[11px] font-black text-emerald-600">₹{t.amount.toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingTransaction(t); setModalType("RECEIVED"); setShowTransModal(true); }} className="p-1 text-slate-400 hover:text-slate-900"><Pencil className="h-3 w-3" /></button>
                                <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredIncome.length === 0 && (
                          <tr><td colSpan={4} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No entries</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* --- EXPENSE SECTION --- */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Project Expenses (Cost)
                    </h3>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">₹{totalExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex-1 overflow-auto max-h-[500px] compact-scrollbar">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                        <tr>
                          <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Date</th>
                          <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Vendor / Item</th>
                          <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-tighter">Amount</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredExpense.map(t => (
                          <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap text-[10px] font-bold text-slate-500 italic">{format(new Date(t.date), "dd MMM")}</td>
                            <td className="px-4 py-2">
                              <p className="text-[11px] font-black text-slate-800 leading-tight">{t.paidTo}</p>
                              <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{t.description || t.category}</p>
                            </td>
                            <td className="px-4 py-2 text-right text-[11px] font-black text-rose-600">₹{t.amount.toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingTransaction(t); setModalType("EXPENSE"); setShowTransModal(true); }} className="p-1 text-slate-400 hover:text-slate-900"><Pencil className="h-3 w-3" /></button>
                                <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredExpense.length === 0 && (
                          <tr><td colSpan={4} className="py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">No entries</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* --- RIGHT SIDEBAR: HISTORY LOGS --- */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
                 <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                   <History className="h-3.5 w-3.5 text-slate-400" />
                   <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Financial History</h3>
                 </div>
                 <div className="flex-1 overflow-auto p-4 compact-scrollbar">
                    <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                       {logs.map((log, i) => (
                         <div key={log.id} className="relative flex items-start gap-4 animate-in fade-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className={cn(
                              "h-4 w-4 rounded-full border-2 border-white ring-1 ring-slate-100 flex items-center justify-center shrink-0 relative z-10",
                              log.action === "DEAL_UPDATE" ? "bg-indigo-500" : 
                              log.action === "INCOME_ADDED" ? "bg-emerald-500" :
                              log.action === "EXPENSE_ADDED" ? "bg-rose-500" : "bg-slate-400"
                            )}>
                              {log.action === "DEAL_UPDATE" ? <Pencil className="h-1.5 w-1.5 text-white" /> : <Plus className="h-1.5 w-1.5 text-white" />}
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-800 leading-tight mb-0.5">{log.details}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">{format(new Date(log.createdAt), "dd MMM, HH:mm")}</p>
                            </div>
                         </div>
                       ))}
                       {logs.length === 0 && (
                         <div className="text-center py-10 opacity-30">
                           <Info className="h-8 w-8 mx-auto mb-2" />
                           <p className="text-[9px] font-black uppercase tracking-widest">No History</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              </div>
            </div>
          )}
        </div>

      {/* --- MODALS --- */}
      {showTransModal && (
        <TransactionModal 
          type={modalType} 
          leadId={id} 
          customerName={customer?.customerName}
          editingData={editingTransaction}
          onClose={() => setShowTransModal(false)} 
          onSuccess={() => { fetchData(); fetchLogs(); }} 
        />
      )}

      {showDealModal && (
        <DealAmountModal 
          leadId={id} 
          currentAmount={customer?.initialDealAmount || 0}
          currentNotes={customer?.initialDealNotes || ""}
          onClose={() => setShowDealModal(false)}
          onSuccess={() => { fetchData(); fetchLogs(); }}
        />
      )}

    </div>
  );
}

function SummaryWidget({ label, value, color, isBold = false, prefix = "", highlight = false }: any) {
  return (
    <div className={cn("px-4 py-1.5 transition-all", highlight && "bg-slate-50 rounded-lg")}>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={cn("text-xs font-black tracking-tight", color, isBold ? "text-sm scale-105" : "")}>
        {prefix}₹{value.toLocaleString()}
      </p>
    </div>
  );
}

function TransactionModal({ type, leadId, customerName, editingData, onClose, onSuccess }: any) {
  const [amount, setAmount] = useState(editingData?.amount || "");
  const [paidTo, setPaidTo] = useState(editingData?.paidTo || (type === "RECEIVED" ? customerName : ""));
  const [category, setCategory] = useState(editingData?.category || (type === "RECEIVED" ? "Advance" : "Expense"));
  const [paymentMode, setPaymentMode] = useState(editingData?.paymentMode || "CASH");
  const [date, setDate] = useState(editingData?.date ? new Date(editingData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(editingData?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const isIncome = type === "RECEIVED";
    if (!amount || !date || (isIncome && !paidTo) || (!isIncome && !description)) {
      setErr(isIncome ? "Amount, Date and Party Name are required" : "Amount, Date and Note are required");
      return;
    }
    
    setIsSaving(true);
    try {
      const url = "/api/transactions";
      const method = editingData ? "PUT" : "POST";
      const body = {
        id: editingData?.id,
        leadId,
        type,
        amount: parseFloat(amount),
        date,
        paidTo: isIncome ? paidTo : description,
        category: isIncome ? category : "Expense",
        paymentMode: isIncome ? paymentMode : "CASH",
        description
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const d = await res.json();
        setErr(d.error || "Failed to save");
      }
    } catch (e) {
      setErr("Connection error");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = type === "RECEIVED" 
    ? ["Advance", "Installment", "Final Payment", "Other"]
    : ["Expense"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className={cn("px-6 py-4 flex items-center justify-between text-white", type === "RECEIVED" ? "bg-emerald-600" : "bg-rose-600")}>
          <h2 className="text-sm font-black uppercase tracking-widest">{editingData ? "Edit" : "New"} {type === "RECEIVED" ? "Income" : "Expense"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black uppercase rounded-lg">{err}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
              <input 
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</label>
              <input 
                type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              />
            </div>
          </div>

          {type === "RECEIVED" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Party Name
                </label>
                <input 
                  value={paidTo} onChange={e => setPaidTo(e.target.value)}
                  placeholder="e.g. Client Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none cursor-pointer">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Note {type === "EXPENSE" && "*"}</label>
            <input 
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder={type === "EXPENSE" ? "Required: Details of expense..." : "Internal remark..."}
              className={cn(
                "w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-slate-900/5 transition-all",
                type === "EXPENSE" && !description && "border-rose-200 ring-1 ring-rose-100"
              )}
            />
          </div>

          <button 
            type="submit" disabled={isSaving}
            className={cn(
              "w-full py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50",
              type === "RECEIVED" ? "bg-emerald-600 shadow-emerald-600/20" : "bg-rose-600 shadow-rose-600/20"
            )}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (editingData ? "Update Record" : `Add ${type === "RECEIVED" ? "Income" : "Expense"}`)}
          </button>
        </form>
      </div>
    </div>
  );
}

function DealAmountModal({ leadId, currentAmount, currentNotes, onClose, onSuccess }: any) {
  const [amount, setAmount] = useState(currentAmount || "");
  const [notes, setNotes] = useState(currentNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!amount) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          initialDealAmount: parseFloat(amount),
          initialDealNotes: notes
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Resetting the deal amount will keep transactions but clear the base project value. Continue?")) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          initialDealAmount: 0,
          initialDealNotes: ""
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-widest">Initial Deal Amount</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
           <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Agreed Amount (₹)</label>
             <input 
               type="number" value={amount} onChange={e => setAmount(e.target.value)}
               placeholder="Enter amount..."
               className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-black outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
               autoFocus
             />
           </div>
           <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deal Notes (Optional)</label>
             <textarea 
               value={notes} onChange={e => setNotes(e.target.value)}
               placeholder="e.g. Inclusive of GST, Excludes electrical work..."
               rows={3}
               className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none resize-none focus:ring-4 focus:ring-slate-900/5 transition-all"
             />
           </div>
           
           <div className="flex gap-2">
              {currentAmount > 0 && (
                <button 
                  onClick={handleDelete}
                  className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button 
                onClick={handleSave} disabled={isSaving}
                className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Deal Amount"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
