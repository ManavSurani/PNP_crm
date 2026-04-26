"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, IndianRupee, Loader2 } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("BANK_TRANSFER");
  const [referenceNo, setReferenceNo] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [paymentsRes, ordersRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/orders")
      ]);
      setPayments(await paymentsRes.json());
      const allOrders = await ordersRes.json();
      setOrders(allOrders.filter((o: any) => o.pendingAmount > 0)); // Only show orders with pending balances
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount, paymentMode, referenceNo })
      });
      setIsModalOpen(false);
      setOrderId(""); setAmount(""); setReferenceNo("");
      fetchData();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Incoming Payments</h1>
          <p className="text-sm text-slate-500">Record all incoming client payments against active orders.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button onClick={() => setIsModalOpen(true)} className="block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Record New Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin h-8 w-8 text-emerald-500" /></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6 uppercase">Order / Client</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Amount Received</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Mode & Ref</th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Date Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                    <div className="font-semibold text-slate-900">{p.order.orderNo}</div>
                    <div className="text-sm text-slate-500">{p.order.lead.customerName}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5 font-bold text-emerald-600">₹{p.amount.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-700">
                    {p.paymentMode.replace("_", " ")}
                    <br/><span className="text-xs text-slate-400">{p.referenceNo || "No Ref"}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-500">{format(new Date(p.createdAt), "MMM d, yyyy h:mm a")}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-500">No payments logged yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-200">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-semibold text-slate-900">Record Incoming Payment</h3>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900">Select Active Order * (Shows pending only)</label>
                  <select required className="mt-1 w-full rounded-md border-0 py-2 pl-3 bg-slate-50 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-emerald-600 sm:text-sm"
                    value={orderId} onChange={e => setOrderId(e.target.value)}>
                    <option value="" disabled>-- Select --</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.orderNo} - {o.lead.customerName} (Due: ₹{o.pendingAmount.toLocaleString()})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Amount Received (₹) *</label>
                  <input required type="number" className="mt-1 w-full rounded-md border-0 py-2 pl-3 bg-slate-50 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-emerald-600 sm:text-sm"
                    value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Payment Mode</label>
                  <select className="mt-1 w-full rounded-md border-0 py-2 pl-3 bg-slate-50 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-emerald-600 sm:text-sm"
                    value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900">Reference / Txn ID</label>
                  <input type="text" className="mt-1 w-full rounded-md border-0 py-2 pl-3 bg-slate-50 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-emerald-600 sm:text-sm"
                    value={referenceNo} onChange={e => setReferenceNo(e.target.value)} />
                </div>
                <div className="mt-6 flex items-center justify-end gap-x-4 border-t border-slate-100 pt-5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-semibold text-slate-900">Cancel</button>
                  <button type="submit" className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500">Save Payment</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
