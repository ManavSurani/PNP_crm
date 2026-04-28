"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, IndianRupee, Loader2, Check, X, AlertCircle, TrendingUp, Clock, CreditCard, Landmark, Banknote, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const totalReceived = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Payment Receipts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage client payment inflows and historical transaction logs.</p>
        </div>
        <div className="relative z-10 flex flex-col md:items-end gap-3">
           <button
             onClick={() => setIsModalOpen(true)}
             className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md border border-indigo-500/20"
           >
             <Plus className="h-4 w-4" /> Record New Payment
           </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Realized", val: `₹${totalReceived.toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { label: "Transaction Count", val: payments.length, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Pending Dues", val: orders.length, icon: AlertCircle, color: "text-rose-600 bg-rose-50 border-rose-100" },
          { label: "Last Payment", val: payments[0] ? format(new Date(payments[0].createdAt), "dd MMM") : "—", icon: Clock, color: "text-slate-600 bg-slate-50 border-slate-100" },
        ].map((card, i) => (
          <div key={i} className={cn("bg-white p-5 rounded-xl border shadow-sm flex gap-4 items-center transition-all", card.color)}>
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white shadow-sm ring-1 ring-black/5">
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{card.label}</p>
              <p className="text-lg font-bold mt-0.5 tracking-tight">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm font-medium tracking-wide">Syncing Transactions...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th scope="col" className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order No / Customer</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Mode</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-3 py-4 text-right pr-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payments.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50 transition-all">
                    <td className="py-5 pl-8 pr-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">{p.order.orderNo}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{p.order.lead.customerName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-5">
                      <div className="flex items-center gap-2">
                         <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                           {p.paymentMode?.replace(/_/g, " ") || "UPI"}
                         </span>
                         {p.referenceNo && <span className="text-[10px] text-slate-400 font-medium">#{p.referenceNo}</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 text-xs text-slate-500 font-medium">
                      {format(new Date(p.createdAt), "dd MMM, yyyy")}
                    </td>
                    <td className="whitespace-nowrap py-5 px-3 text-right pr-8">
                       <div className="text-sm font-bold text-emerald-600">+₹{p.amount.toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 text-slate-300">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">No disbursements logged</h3>
                      <p className="mt-1 text-xs text-slate-500 font-medium italic">Pending client fulfillments will appear here.</p>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Record Receipt</h2>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide italic">Linking payment to active order</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Reference Order *</label>
                <select required className={inputCls} value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })}>
                  <option value="">Select an order with pending dues...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNo} | {o.lead.customerName} (₹{o.pendingAmount.toLocaleString()} due)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Collected Amount (₹) *</label>
                  <input required type="number" min="1" className={inputCls} placeholder="e.g. 50000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Payment Channel</label>
                  <select className={inputCls} value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                    <option value="UPI">UPI / Digital Wallet</option>
                    <option value="CASH">Hard Cash</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                    <option value="CHEQUE">Physical Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Transaction Identity (Ref No.)</label>
                <input type="text" className={inputCls} placeholder="UTR, Cheque No, or Reference ID" value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-semibold text-sm hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md border border-indigo-500/20">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Record Payment
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
