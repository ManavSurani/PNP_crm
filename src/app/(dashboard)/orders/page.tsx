"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CopyCheck, Loader2, Package, ArrowRight, Clock, IndianRupee,
  TrendingUp, AlertCircle, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  orderNo: string;
  totalAmount: number;
  advanceAmount: number;
  pendingAmount: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  lead: { customerName: string; serviceType: string; contactNumber: string };
};

const STAGES = ["CONFIRMED", "PRODUCTION", "INSTALLATION", "COMPLETED", "CANCELLED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      setOrders(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const moveStage = async (order: Order) => {
    const currentIdx = STAGES.indexOf(order.status);
    if (currentIdx >= STAGES.length - 1) return;
    const nextStage = STAGES[currentIdx + 1];
    setMovingId(order.id);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStage }),
      });
      fetchOrders();
    } catch (e) { console.error(e); }
    finally { setMovingId(null); }
  };

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPending = orders.reduce((s, o) => s + o.pendingAmount, 0);
  const activeOrders = orders.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border-b-4 border-amber-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Order Tracking</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Production & Installation Pipeline</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Orders", val: activeOrders, icon: Package, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { label: "Total Order Value", val: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Pending Due", val: `₹${totalPending.toLocaleString()}`, icon: AlertCircle, color: "text-rose-600 bg-rose-50 border-rose-100" },
        ].map((card, i) => (
          <div key={i} className={cn("p-6 rounded-2xl border-2 flex items-center gap-4", card.color)}>
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", card.color.split(" ").slice(1).join(" "))}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-60">{card.label}</p>
              <p className="text-2xl font-black mt-0.5">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-5 pl-8 pr-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order</th>
                  <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                  <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financials</th>
                  <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stage</th>
                  <th className="px-3 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {orders.map(order => {
                  const stageIdx = STAGES.indexOf(order.status);
                  const isLast = stageIdx >= STAGES.length - 1;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-6 pl-8 pr-3">
                        <Link href={`/orders/${order.id}`} className="hover:underline">
                          <p className="font-black text-slate-900 uppercase">{order.orderNo}</p>
                        </Link>
                        <p className="text-xs text-slate-400 font-bold mt-1"><Clock className="h-3 w-3 inline mr-1" />{format(new Date(order.createdAt), "dd MMM yyyy")}</p>
                      </td>
                      <td className="px-3 py-6">
                        <p className="font-black text-indigo-600">{order.lead.customerName}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">{order.lead.serviceType.replace(/_/g, " ")}</p>
                      </td>
                      <td className="px-3 py-6">
                        <p className="text-sm font-black text-slate-900">₹{order.totalAmount.toLocaleString()}</p>
                        <div className="flex gap-3 mt-1 text-xs font-black">
                          <span className="text-emerald-600">Paid: ₹{order.advanceAmount.toLocaleString()}</span>
                          {order.pendingAmount > 0 && <span className="text-rose-600">Due: ₹{order.pendingAmount.toLocaleString()}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-6">
                        {/* Stage Progress Pills */}
                        <div className="flex gap-1 flex-wrap">
                          {STAGES.filter(s => s !== "CANCELLED").map((stage, idx) => (
                            <span key={stage} className={cn(
                              "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              stageIdx >= idx ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                            )}>
                              {stage.slice(0, 4)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-6">
                        {!isLast ? (
                          <button
                            onClick={() => moveStage(order)}
                            disabled={movingId === order.id}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                          >
                            {movingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                            Next Stage
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-black text-emerald-600 uppercase">
                            <Check className="h-4 w-4" /> Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No orders yet. Convert a lead to start!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
