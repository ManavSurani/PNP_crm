"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import {
  Loader2, IndianRupee, ArrowDownCircle, ArrowUpCircle, 
  Wallet, TrendingUp, Plus, Trash2, Edit, Calendar, Info, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const INCOMING_CATS = ["Customer Advance", "Partial Payment", "Final Payment"];
const OUTGOING_CATS = ["Carpenter Payment", "Labour Payment", "Material Purchase", "Transport", "Site Expense", "Hardware Purchase", "Vendor Payment", "Miscellaneous"];

export default function CustomerFinancialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    type: "OUTGOING",
    category: OUTGOING_CATS[0],
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: ""
  });

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (res.ok) setCustomer(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCustomer(); }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, leadId: id, addedBy: "Admin" })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ type: "OUTGOING", category: OUTGOING_CATS[0], amount: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
        fetchCustomer();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tId: string) => {
    if (!confirm("Are you sure you want to permanently delete this transaction?")) return;
    try {
      await fetch(`/api/transactions/${tId}`, { method: "DELETE" });
      fetchCustomer();
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div>;
  if (!customer) return <div className="text-center p-12 text-slate-500">Customer not found</div>;

  const projectAmount = customer.orders?.reduce((acc: number, o: any) => acc + o.totalAmount, 0) || 0;
  const transactions = customer.transactions || [];
  const received = transactions.filter((t: any) => t.type === "INCOMING").reduce((acc: number, t: any) => acc + t.amount, 0);
  const expenses = transactions.filter((t: any) => t.type === "OUTGOING").reduce((acc: number, t: any) => acc + t.amount, 0);
  
  const pending = projectAmount - received;
  const netProfit = projectAmount - expenses;
  const profitMargin = projectAmount > 0 ? ((netProfit / projectAmount) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-8 rounded-xl shadow-sm">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="h-10 w-10 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg flex items-center justify-center border border-emerald-500/30">
               {customer.customerName.charAt(0)}
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight">{customer.customerName}</h1>
               <p className="text-emerald-400 text-sm font-medium">{customer.contactNumber}</p>
             </div>
           </div>
           <p className="text-slate-400 text-sm max-w-lg mt-3">Comprehensive financial ledger for all related active projects and material procurements.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-bold py-3 px-6 rounded-lg shadow whitespace-nowrap flex items-center gap-2 border border-emerald-400/20"
        >
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Project Value", val: projectAmount, prefix: "₹", color: "text-slate-900", icon: Wallet, bg: "bg-white", border: "border-slate-200" },
          { label: "Total Received", val: received, prefix: "₹", color: "text-emerald-600", icon: ArrowDownCircle, bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Pending Collection", val: pending, prefix: "₹", color: "text-amber-600", icon: Info, bg: "bg-amber-50", border: "border-amber-100" },
          { label: "Total Expenses", val: expenses, prefix: "₹", color: "text-rose-600", icon: ArrowUpCircle, bg: "bg-rose-50", border: "border-rose-100" },
          { label: "Net Profit / Margin", val: `${netProfit.toLocaleString()} (${profitMargin}%)`, prefix: "₹", color: "text-indigo-600", icon: TrendingUp, bg: "bg-indigo-50", border: "border-indigo-100" },
        ].map((card, i) => (
          <div key={i} className={cn("p-5 rounded-xl border shadow-sm", card.bg, card.border)}>
             <div className="flex items-center gap-2 mb-3">
                <card.icon className={cn("h-4 w-4", card.color)} />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</h3>
             </div>
             <p className={cn("text-xl font-black font-mono tracking-tight", card.color)}>
               {card.prefix}{typeof card.val === 'number' ? card.val.toLocaleString() : card.val}
             </p>
          </div>
        ))}
      </div>

      {/* Timeline/Table View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
         <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
             <Calendar className="h-4 w-4 text-slate-400" /> Transaction Timeline
           </h2>
           <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{transactions.length} Entries</span>
         </div>
         
         {transactions.length === 0 ? (
           <div className="p-16 text-center">
             <Wallet className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-500 font-medium">No financial records found.</p>
             <button onClick={() => setIsModalOpen(true)} className="mt-4 text-emerald-600 text-sm font-bold hover:underline">Log the first transaction</button>
           </div>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                 <tr>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Type</th>
                   <th className="px-6 py-4">Category</th>
                   <th className="px-6 py-4">Notes</th>
                   <th className="px-6 py-4 text-right">Amount</th>
                   <th className="px-6 py-4 text-center">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {transactions.map((t: any) => (
                   <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                       {format(new Date(t.date), "MMM dd, yyyy")}
                     </td>
                     <td className="px-6 py-4">
                       <span className={cn(
                         "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                         t.type === "INCOMING" ? "bg-emerald-50 text-emerald-700 border-emerald-100 border" : "bg-rose-50 text-rose-700 border-rose-100 border"
                       )}>
                         {t.type}
                       </span>
                     </td>
                     <td className="px-6 py-4 font-semibold text-slate-800">{t.category}</td>
                     <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{t.notes || "-"}</td>
                     <td className={cn(
                       "px-6 py-4 text-right font-mono font-bold whitespace-nowrap",
                       t.type === "INCOMING" ? "text-emerald-600" : "text-rose-600"
                     )}>
                       {t.type === "INCOMING" ? "+" : "-"}₹{t.amount.toLocaleString()}
                     </td>
                     <td className="px-6 py-4 text-center">
                       <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors opacity-0 group-hover:opacity-100">
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-500" /> Log Transaction</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...form, type: "OUTGOING", category: OUTGOING_CATS[0] })} className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border", form.type === "OUTGOING" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-500 border-slate-200")}>Expense</button>
                <button type="button" onClick={() => setForm({ ...form, type: "INCOMING", category: INCOMING_CATS[0] })} className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border", form.type === "INCOMING" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-500 border-slate-200")}>Received</button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                <select required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                   {(form.type === "OUTGOING" ? OUTGOING_CATS : INCOMING_CATS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                  <input type="date" required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Amount (₹)</label>
                  <input type="number" required min="1" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Notes / Narration</label>
                <textarea rows={2} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-300" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional details..."></textarea>
              </div>

              <button disabled={isSubmitting} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 mt-2 transition-all">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
