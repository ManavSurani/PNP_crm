"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CopyCheck, Loader2 } from "lucide-react";

type Order = {
  id: string;
  orderNo: string;
  totalAmount: number;
  advanceAmount: number;
  pendingAmount: number;
  status: string;
  createdAt: string;
  lead: { customerName: string; serviceType: string; contactNumber: string };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Order Tracking</h1>
          <p className="text-sm text-slate-500">Monitor active jobs, production status, and pending balances.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="ml-3 font-medium">Loading orders...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-slate-600 sm:pl-6 uppercase">Order ID</th>
                  <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Customer</th>
                  <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Financials</th>
                  <th className="px-3 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="py-3.5 pl-3 pr-4 text-right text-xs font-semibold text-slate-600 sm:pr-6 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                      <div className="text-sm font-bold text-slate-900">{order.orderNo}</div>
                      <div className="text-xs text-slate-500 mt-1">{format(new Date(order.createdAt), "MMM d, yyyy")}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5">
                      <div className="font-semibold text-indigo-600">{order.lead.customerName}</div>
                      <div className="text-sm text-slate-500 mt-1">{order.lead.serviceType.replace("_", " ")}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5">
                      <div className="text-sm font-semibold text-slate-900">Total: ₹{order.totalAmount.toLocaleString()}</div>
                      <div className="text-sm mt-1">
                        <span className="text-emerald-600 font-medium">Paid: ₹{order.advanceAmount.toLocaleString()}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-rose-600 font-medium">Due: ₹{order.pendingAmount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" :
                        order.status === "CONFIRMED" ? "bg-amber-50 text-amber-700 ring-amber-600/20" :
                        "bg-sky-50 text-sky-700 ring-sky-600/20"
                      }`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 justify-end w-full p-2 hover:bg-slate-100 rounded-md transition-colors">
                        <CopyCheck className="h-4 w-4" /> Move Stage
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-500">No active orders found. Convert a Lead to start working!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
