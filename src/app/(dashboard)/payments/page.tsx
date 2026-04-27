"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, IndianRupee, Loader2, Check, X, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-slate-900 font-bold placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-sm";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    orderId: "", amount: "", paymentMode: "UPI", referenceNo: "", notes: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pr, or] = await Promise.all([fetch("/api/payments"), fetch("/api/orders")]);
      setPayments(await pr.json());
      const all = await or.json();
      setOrders(all.filter((o: any) => o.pendingAmount > 0));
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setIsModalOpen(false);
      setForm({ orderId: "", amount: "", paymentMode: "UPI", referenceNo: "", notes: "" });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-emerald-500 relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Incoming Payments</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Client payment ledger — All orders</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 bg-emerald-600 hover:bg-emerald-500 px-8 py-5 rounded-2xl text-white font-black flex items-center gap-3 text-sm uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-emerald-500/30"
        >
          <Plus className="h-5 w-5" /> Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Received", val: `₹${totalReceived.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Transactions", val: payments.length, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50" },
          { label: "Orders with Dues", val: orders.length, icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
          { label: "Latest Entry", val: payments[0] ? format(new Date(payments[0].createdAt), "dd MMM") : "—", icon: Clock, color: "text-slate-600 bg-slate-50" },
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

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-emerald-500" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-50">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-5 pl-8 pr-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order / Client</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mode & Ref</th>
                <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-all">
                  <td className="py-5 pl-8 pr-3">
                    <p className="font-black text-slate-900 uppercase">{p.order.orderNo}</p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{p.order.lead.customerName}</p>
                  </td>
                  <td className="px-3 py-5">
                    <p className="text-xl font-black text-emerald-600">₹{p.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-3 py-5">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest">
                      {p.paymentMode?.replace(/_/g, " ") || "UPI"}
                    </span>
                    {p.referenceNo && <p className="text-xs text-slate-400 font-bold mt-1">{p.referenceNo}</p>}
                  </td>
                  <td className="px-3 py-5 text-sm text-slate-500 font-bold">
                    {format(new Date(p.createdAt), "dd MMM yyyy, h:mm a")}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (<tr><td colSpan={4} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No payments logged yet.</td></tr>)}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-emerald-600 px-10 py-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl"><IndianRupee className="h-6 w-6" /></div>
                <h2 className="text-xl font-black uppercase tracking-tight">Record Payment</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Order (Pending Balance) *</label>
                <select required className={inputCls} value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })}>
                  <option value="">Select Order...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNo} — {o.lead.customerName} (₹{o.pendingAmount.toLocaleString()} due)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Amount (₹) *</label>
                <input required type="number" min="1" className={inputCls} placeholder="e.g. 25000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Payment Mode</label>
                  <select className={inputCls} value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Txn / Ref ID</label>
                  <input type="text" className={inputCls} placeholder="UTR / Ref No." value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 px-10 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
