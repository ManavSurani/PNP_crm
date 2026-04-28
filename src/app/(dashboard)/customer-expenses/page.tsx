"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, IndianRupee, ArrowRight, Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MasterExpensesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchFinancials = async () => {
    try {
      const res = await fetch("/api/financials");
      if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchFinancials(); }, []);

  const filtered = customers.filter(c => 
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactNumber.includes(search)
  );

  let globalWorkAmount = 0;
  let globalReceived = 0;
  let globalExpenses = 0;

  const data = filtered.map(c => {
    const projectAmount = c.orders?.reduce((acc: number, o: any) => acc + o.totalAmount, 0) || 0;
    const received = c.transactions?.filter((t: any) => t.type === "RECEIVED").reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
    const expenses = c.transactions?.filter((t: any) => t.type === "EXPENSE").reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
    const pending = projectAmount - received;
    
    globalWorkAmount += projectAmount;
    globalReceived += received;
    globalExpenses += expenses;

    return { ...c, projectAmount, received, expenses, pending };
  }).filter(c => c.expenses > 0); // Only show accounts with actual expenses

  const globalPending = globalWorkAmount - globalReceived;
  const globalProfit = globalWorkAmount - globalExpenses;

  if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Expenditure</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor all outgoing capital, vendor payments, and project-level costs.</p>
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Project Value", val: globalWorkAmount, color: "text-slate-900", icon: Wallet, bg: "bg-slate-50 border-slate-200" },
          { label: "Total Outflow (Expenses)", val: globalExpenses, color: "text-rose-600", icon: ArrowUpCircle, bg: "bg-rose-50 border-rose-100" },
          { label: "Accounts with Expenses", val: data.length, color: "text-amber-600", icon: TrendingUp, bg: "bg-amber-50 border-amber-100", isCount: true },
          { label: "Estimated Net Margin", val: globalProfit, color: "text-indigo-600", icon: TrendingUp, bg: "bg-indigo-50 border-indigo-100" },
        ].map((card, i) => (
          <div key={i} className={cn("p-5 rounded-xl border shadow-sm", card.bg)}>
             <div className="flex items-center gap-2 mb-3">
                <card.icon className={cn("h-4 w-4", card.color)} />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</h3>
             </div>
             <p className={cn("text-2xl font-black font-mono tracking-tight", card.color)}>
               {card.isCount ? card.val : `₹${card.val.toLocaleString()}`}
             </p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Ledgers</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search financials..."
              className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full md:w-64 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4 text-right">Proj. Value</th>
                <th className="px-6 py-4 text-right">Received</th>
                <th className="px-6 py-4 text-right">Expenses</th>
                <th className="px-6 py-4 text-right">Pending</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{c.customerName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.contactNumber}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">
                       {c.orders?.length || 0} Projects Active
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">₹{c.projectAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-emerald-600">₹{c.received.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-rose-600">₹{c.expenses.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-amber-600">₹{c.pending.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/customers/${c.id}/financials?type=EXPENSE`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
                    >
                      Ledger <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No active financial ledgers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
