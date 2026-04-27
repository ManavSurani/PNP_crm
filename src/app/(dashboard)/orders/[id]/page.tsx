"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, Loader2, IndianRupee, TrendingUp, TrendingDown, 
  Package, Truck, Wrench, Wallet, Calendar, User, Phone, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(res => res.json())
      .then(data => { setOrder(data); setIsLoading(false); })
      .catch(console.error);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Analyzing Project Financials...</p>
      </div>
    );
  }

  if (!order) return <div className="p-10 text-center font-black uppercase text-slate-400">Order Not Found</div>;

  const totalReceived = order.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
  const totalExpenses = order.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0;
  const netProfit = totalReceived - totalExpenses;
  const profitMargin = totalReceived > 0 ? ((netProfit / totalReceived) * 100).toFixed(1) : "0";
  const projectedProfit = order.totalAmount - totalExpenses;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/orders" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-black uppercase text-xs tracking-widest">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <span className={cn(
          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
          order.status === "COMPLETED" ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
        )}>
          {order.status}
        </span>
      </div>

      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl relative overflow-hidden border-b-4 border-indigo-600">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-2">Project Financial Analysis</p>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">{order.orderNo}</h1>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                <User className="h-4 w-4 text-indigo-400" /> {order.lead.customerName}
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                <Package className="h-4 w-4 text-indigo-400" /> {order.lead.serviceType.replace(/_/g, " ")}
              </div>
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                <Calendar className="h-4 w-4 text-indigo-400" /> {format(new Date(order.createdAt), "dd MMM yyyy")}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-black uppercase mb-1">Contract Value</p>
            <p className="text-4xl font-black text-white">₹{order.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Financial Summary Grid (Module 15) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Received</p>
          <p className="text-2xl font-black text-emerald-600">₹{totalReceived.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter">Client Payments Collected</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-black text-rose-600">₹{totalExpenses.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter">Labour + Material + Other</p>
        </div>
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Net Cash Profit</p>
              <p className={cn("text-3xl font-black", netProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                ₹{netProfit.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                {profitMargin}% Actual Margin
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Projected at Finish</p>
              <p className="text-xl font-black text-white opacity-80">₹{projectedProfit.toLocaleString()}</p>
              <div className="mt-2 inline-flex items-center gap-1 bg-white/5 py-1 px-3 rounded-full border border-white/10">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] font-black uppercase">Auto-Calculated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payments List */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-100"><IndianRupee className="h-5 w-5 text-white" /></div>
            <h2 className="text-lg font-black text-slate-900 uppercase">Payment History</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {order.payments?.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4 text-[9px] font-black uppercase text-slate-400">Date</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase text-slate-400">Amount</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase text-slate-400">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 text-xs font-bold text-slate-600">{format(new Date(p.paymentDate || p.createdAt), "dd MMM yyyy")}</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-900">₹{p.amount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">{p.type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No payments recorded.</div>
            )}
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-2 rounded-xl shadow-lg shadow-rose-100"><Wallet className="h-5 w-5 text-white" /></div>
            <h2 className="text-lg font-black text-slate-900 uppercase">Expense Breakdown</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {order.expenses?.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4 text-[9px] font-black uppercase text-slate-400">Category</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase text-slate-400">Amount</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase text-slate-400">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.expenses.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">{e.category}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-rose-600">₹{e.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-[10px] font-bold text-slate-400 line-clamp-1">{e.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No expenses recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Formula Reminder (As per plan Module 15) */}
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-start gap-4">
        <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
        <div>
          <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">Standard Profit Formula</p>
          <p className="text-[11px] text-indigo-700 font-bold leading-relaxed opacity-70">
            Profit = Customer Payments − (Material Cost + Labour Cost + Transport Cost + Other Expenses). 
            This calculation is updated automatically in real-time as you record new payments or expenses.
          </p>
        </div>
      </div>
    </div>
  );
}
