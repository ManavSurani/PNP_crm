"use client";

import { use, useState, useEffect, useMemo } from "react";
import { 
  Palette, ArrowLeft, ChevronRight, Loader2, Plus, 
  Search, Filter, History, Info, Trash2, Pencil, Wallet,
  IndianRupee, X, AlertCircle, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Transaction = {
  id: string;
  type: "RECEIVED" | "EXPENSE";
  amount: number;
  date: string;
  paidTo: string;
  category: string;
  paymentMode: string;
  description: string | null;
  source: string;
  isSystemGenerated: boolean;
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

export default function DesignExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [logs, setLogs] = useState<FinancialLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showTransModal, setShowTransModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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
  const initialDeal = customer?.initialDealAmount || 0;
  const designExpenses = useMemo(() => 
    customer?.transactions?.filter(t => t.type === "EXPENSE" && t.source === "DESIGN") || []
  , [customer]);

  const totalDesignCost = useMemo(() => 
    designExpenses
      .filter(t => t.category === "Design Expense" || t.category === "Adjustment")
      .reduce((sum, t) => sum + t.amount, 0)
  , [designExpenses]);

  const designProfit = initialDeal - totalDesignCost;

  const handleDeleteTransaction = async (transId: string) => {
    if (!confirm("Are you sure you want to delete this design expense?")) return;
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
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* --- STICKY HEADER --- */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/customers/${id}`} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                {customer.customerName}
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-widest px-2 py-0.5 bg-rose-50 rounded border border-rose-100">Design Expenses</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                Project: {customer.project?.name || "Standard Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end pr-4 border-r border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Design Cost</p>
                <p className="text-sm font-black text-slate-900 tracking-tight">₹{totalDesignCost.toLocaleString()}</p>
             </div>
             <button 
              onClick={() => { setEditingTransaction(null); setShowTransModal(true); }}
              className="h-9 px-4 bg-rose-600 text-white rounded-lg flex items-center gap-2 text-[10px] font-black shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all uppercase tracking-widest"
             >
                <Plus className="h-4 w-4" /> Add Design Cost
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* --- INITIAL DEAL SETUP --- */}
        {initialDeal === 0 ? (
          <div className="mb-8 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Palette className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Setup Design Financials</h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">Enter the Initial Deal Amount to calculate your design-side profit margins.</p>
            <button 
              onClick={() => setShowDealModal(true)}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
            >
              Enter Initial Deal Amount
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            
            {/* Main Content */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
               
               {/* PROFIT SUMMARY SECTION */}
               <div className="grid grid-cols-3 gap-4">
                  <ProfitCard 
                    label="Initial Deal Amount" 
                    value={initialDeal} 
                    icon={<IndianRupee className="h-4 w-4" />} 
                    color="bg-slate-900" 
                  />
                  <ProfitCard 
                    label="Design Expenses" 
                    value={totalDesignCost} 
                    icon={<Wallet className="h-4 w-4 text-rose-400" />} 
                    color="bg-slate-800"
                    prefix="-"
                  />
                  <ProfitCard 
                    label="Remaining Profit" 
                    value={designProfit} 
                    icon={<TrendingUp className={cn("h-4 w-4", designProfit >= 0 ? "text-emerald-400" : "text-rose-400")} />} 
                    color={designProfit >= 0 ? "bg-emerald-600" : "bg-rose-600"}
                    isHighlight
                  />
               </div>

               {/* EXPENSE TABLE */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <Palette className="h-3.5 w-3.5 text-rose-500" />
                       Design Expense Ledger
                    </h3>
                  </div>
                  <div className="overflow-auto max-h-[600px] compact-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                          <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                          <th className="px-6 py-3 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {designExpenses.map(t => (
                          <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-slate-500 uppercase italic">
                               {format(new Date(t.date), "dd MMM yyyy")}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-[11px] font-black text-slate-900">{t.paidTo}</p>
                                {t.isSystemGenerated && (
                                   <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1 uppercase">
                                     <AlertCircle className="h-2 w-2" /> System
                                   </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">{t.description || t.category}</p>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-black text-rose-600 tracking-tight">
                               ₹{t.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingTransaction(t); setShowTransModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                                     <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                     <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                        {designExpenses.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-24 text-center">
                               <Palette className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Design Expenses Logged</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
               <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Info className="h-4 w-4" />
                     </div>
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">About Module</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
                     This module tracks internal design costs (renders, layouts, adjustment costs). It calculates design-side profit margins separate from overall project financials.
                  </p>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                     <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                     <p className="text-[10px] text-amber-700 font-bold leading-tight">
                        Payments or unrelated expenses are not subtracted here. Only "Design Source" entries impact these margins.
                     </p>
                  </div>
               </div>

               {/* RECENT ACTIVITY LOGS */}
               <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                        <History className="h-4 w-4" />
                     </div>
                     <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Design Activity</h3>
                  </div>
                  <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                      {logs.filter(l => l.action.includes("DESIGN") || l.action === "AUTO_EXPENSE_GENERATED").map((log, i) => (
                        <div key={log.id} className="relative flex items-start gap-4">
                           <div className={cn(
                             "h-4 w-4 rounded-full border-2 border-white ring-1 ring-slate-100 flex items-center justify-center shrink-0 relative z-10",
                             log.action === "AUTO_EXPENSE_GENERATED" ? "bg-amber-500 shadow-lg shadow-amber-500/20" : "bg-rose-500"
                           )}>
                              <div className="h-1 w-1 bg-white rounded-full" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-800 leading-tight mb-1">{log.details}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{format(new Date(log.createdAt), "dd MMM, HH:mm")}</p>
                           </div>
                        </div>
                      ))}
                      {logs.filter(l => l.action.includes("DESIGN") || l.action === "AUTO_EXPENSE_GENERATED").length === 0 && (
                        <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4">No recent design logs</p>
                      )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      {showTransModal && (
        <TransactionModal 
          leadId={id} 
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

function ProfitCard({ label, value, icon, color, isHighlight = false, prefix = "" }: any) {
  return (
    <div className={cn("p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden", isHighlight ? "bg-slate-900 text-white" : "bg-white")}>
       <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5", isHighlight ? "bg-white" : "bg-slate-900")} />
       <div className="flex items-center gap-3 mb-3 relative z-10">
          <div className={cn("p-2 rounded-lg", isHighlight ? "bg-white/10" : "bg-slate-50 text-slate-400")}>
             {icon}
          </div>
          <p className={cn("text-[9px] font-black uppercase tracking-widest", isHighlight ? "text-slate-400" : "text-slate-400")}>{label}</p>
       </div>
       <p className={cn("text-2xl font-black tracking-tight relative z-10", isHighlight ? "text-white" : "text-slate-900")}>
          {prefix}₹{value.toLocaleString()}
       </p>
    </div>
  );
}

function TransactionModal({ leadId, editingData, onClose, onSuccess }: any) {
  const [amount, setAmount] = useState(editingData?.amount || "");
  const [paidTo, setPaidTo] = useState(editingData?.paidTo || "");
  const [date, setDate] = useState(editingData?.date ? new Date(editingData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(editingData?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date || !paidTo) {
      setErr("Amount, Date and Party Name are required");
      return;
    }
    
    setIsSaving(true);
    try {
      const url = "/api/transactions";
      const method = editingData ? "PUT" : "POST";
      const body = {
        id: editingData?.id,
        leadId,
        type: "EXPENSE",
        amount: parseFloat(amount),
        date,
        paidTo,
        category: "Design Expense",
        paymentMode: "CASH",
        description,
        source: "DESIGN"
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest">{editingData ? "Edit" : "New"} Design Expense</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-black uppercase rounded-lg">{err}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
              <input 
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-rose-900/5 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</label>
              <input 
                type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-900/5 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Party / Designer Name</label>
            <input 
              value={paidTo} onChange={e => setPaidTo(e.target.value)}
              placeholder="e.g. 3D Renderer Name"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-900/5 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expense Note</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Living room 3D views..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium outline-none resize-none focus:ring-2 focus:ring-rose-900/5 transition-all"
            />
          </div>

          <button 
            type="submit" disabled={isSaving}
            className="w-full mt-2 py-3 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (editingData ? "Update Record" : "Log Design Expense")}
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
               placeholder="e.g. Shared between modules..."
               rows={3}
               className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none resize-none focus:ring-4 focus:ring-slate-900/5 transition-all"
             />
           </div>
           
           <button 
             onClick={handleSave} disabled={isSaving}
             className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Deal Amount"}
           </button>
        </div>
      </div>
    </div>
  );
}
