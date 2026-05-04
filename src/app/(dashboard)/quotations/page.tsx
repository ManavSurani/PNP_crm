"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2, ChevronRight, Search, IndianRupee, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CustomerSummary {
  id: string;
  customerName: string;
  totalQuoted: number;
  totalPaid: number;
  pendingAmount: number;
  quotationCount: number;
  status: "FULLY_PAID" | "PARTIAL" | "PENDING";
}

export default function QuotationOverviewPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/project-quotations/overview");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching quotation overview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = customers.filter((c) =>
    c.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const grandTotal   = customers.reduce((s, c) => s + c.totalQuoted, 0);
  const grandPaid    = customers.reduce((s, c) => s + c.totalPaid, 0);
  const grandPending = customers.reduce((s, c) => s + c.pendingAmount, 0);

  const statusConfig = {
    FULLY_PAID: { label: "Paid",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    PARTIAL:    { label: "Partial", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    PENDING:    { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-5 -mr-32 -mt-32" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Quotation Overview</h1>
          <p className="text-slate-500 text-sm">All customer quotations — click a row to view the full project ledger.</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clients</p>
            <p className="text-xl font-black text-slate-900">{customers.length}</p>
          </div>
        </div>
      </div>

      {/* Grand Totals */}
      {customers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Quoted",    value: grandTotal,   color: "text-slate-900", bg: "bg-white", border: "border-slate-100" },
            { label: "Total Collected", value: grandPaid,    color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100" },
            { label: "Outstanding",     value: grandPending, color: grandPending > 0 ? "text-amber-600" : "text-emerald-600", bg: grandPending > 0 ? "bg-amber-50/50" : "bg-emerald-50/50", border: grandPending > 0 ? "border-amber-100" : "border-emerald-100" },
          ].map((card) => (
            <div key={card.label} className={`${card.bg} ${card.border} border rounded-xl p-5 shadow-sm`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <p className={`text-2xl font-black mt-2 ${card.color}`}>₹{card.value.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <span className="text-sm font-medium">Loading quotations...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <FileText className="h-10 w-10 text-slate-200 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-900">No quotations found</h3>
          <p className="text-xs text-slate-400 mt-1">Quotations will appear here after they are added to a customer.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="py-4 pl-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fields</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Quoted</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</th>
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-4 pr-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => {
                const st = statusConfig[c.status];
                return (
                  <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-500 text-sm">
                          {c.customerName.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.customerName}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {c.quotationCount} field{c.quotationCount !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="py-4 font-black text-slate-900 text-sm">₹{c.totalQuoted.toLocaleString("en-IN")}</td>
                    <td className="py-4 font-bold text-emerald-600 text-sm">₹{c.totalPaid.toLocaleString("en-IN")}</td>
                    <td className="py-4 font-bold text-sm" style={{ color: c.pendingAmount > 0 ? "#D97706" : "#10B981" }}>
                      ₹{c.pendingAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", st.cls)}>
                        {st.label}
                      </span>
                    </td>
                    <td className="py-4 pr-6 text-right">
                      <Link
                        href={`/customers/${c.id}/quotations`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all group-hover:shadow-sm"
                      >
                        Open <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
