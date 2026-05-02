"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, IndianRupee, ArrowRight, Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Plus, Check, X, RotateCcw, Filter, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("NEWEST");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    orderId: "", amount: "", paymentMode: "UPI", referenceNo: "", notes: ""
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/financials");
      if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedCustomer = customers.find(l => l.id === form.orderId);
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          leadId: form.orderId,
          type: "RECEIVED",
          date: new Date().toISOString().split("T")[0],
          paidTo: selectedCustomer?.customerName || "Customer",
          category: "Payment Received",
          description: form.notes || `Payment receipt via ${form.paymentMode}`
        }),
      });
      setIsModalOpen(false);
      setForm({ orderId: "", amount: "", paymentMode: "UPI", referenceNo: "", notes: "" });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const filtered = customers.filter(c => 
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactNumber.includes(search)
  );

  let globalWorkAmount = 0;
  let globalReceived = 0;

  const data = filtered.map(c => {
    const projectAmount = c.orders?.reduce((acc: number, o: any) => acc + o.totalAmount, 0) || 0;
    const received = c.transactions?.filter((t: any) => t.type === "RECEIVED").reduce((acc: number, t: any) => acc + t.amount, 0) || 0;
    const pending = projectAmount - received;
    const rate = projectAmount > 0 ? (received / projectAmount) * 100 : 0;
    
    globalWorkAmount += projectAmount;
    globalReceived += received;

    return { ...c, projectAmount, received, pending, rate };
  }).filter(c => {
    if (statusFilter === "PENDING") return c.received === 0 && c.projectAmount > 0;
    if (statusFilter === "PARTIAL") return c.received > 0 && c.pending > 0;
    if (statusFilter === "CLEARED") return c.pending <= 0 && c.projectAmount > 0;
    
    const cDate = new Date(c.createdAt);
    const matchesStart = !dateRange.start || cDate >= new Date(dateRange.start);
    const matchesEnd = !dateRange.end || cDate <= new Date(dateRange.end + "T23:59:59");
    
    return (c.received > 5 || c.projectAmount > 0) && matchesStart && matchesEnd;
  }).sort((a, b) => {
    if (sortBy === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "A-Z") return a.customerName.localeCompare(b.customerName);
    if (sortBy === "Z-A") return b.customerName.localeCompare(a.customerName);
    return 0;
  });

  const globalPending = globalWorkAmount - globalReceived;
  const collectionRate = globalWorkAmount > 0 ? (globalReceived / globalWorkAmount) * 100 : 0;

  if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">

      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Receipts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage project-wise collection targets, advances, and recovery status.</p>
        </div>
        <div className="relative z-10">
           <button
             onClick={() => setIsModalOpen(true)}
             className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20 border border-indigo-500/20"
           >
             <Plus className="h-5 w-5" /> Record Receipt
           </button>
        </div>
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Billing", val: globalWorkAmount, color: "text-slate-900", icon: Wallet, bg: "bg-slate-50 border-slate-200" },
          { label: "Collected Amount", val: globalReceived, color: "text-emerald-600", icon: ArrowDownCircle, bg: "bg-emerald-50 border-emerald-100" },
          { label: "Pending Dues", val: globalPending, color: "text-rose-600", icon: ArrowUpCircle, bg: "bg-rose-50 border-rose-100" },
          { label: "Collection Health", val: collectionRate, color: "text-indigo-600", icon: TrendingUp, bg: "bg-indigo-50 border-indigo-100", isPercent: true },
        ].map((card, i) => (
          <div key={i} className={cn("p-5 rounded-xl border shadow-sm", card.bg)}>
             <div className="flex items-center gap-2 mb-3">
                <card.icon className={cn("h-4 w-4", card.color)} />
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</h3>
             </div>
             <p className={cn("text-2xl font-black font-mono tracking-tight", card.color)}>
               {card.isPercent ? `${card.val.toFixed(1)}%` : `₹${card.val.toLocaleString()}`}
             </p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Collection Ledger</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {["ALL", "PENDING", "PARTIAL", "CLEARED"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                    statusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full md:w-64 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm",
                showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Filter className="h-3.5 w-3.5" /> {showFilters ? "Hide" : "More"}
            </button>
            <button 
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setDateRange({ start: "", end: "" });
                setSortBy("NEWEST");
              }}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
             <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Sort Ledger</label>
                <select 
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-600 outline-none font-medium"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="NEWEST">Account: Newest</option>
                  <option value="OLDEST">Account: Oldest</option>
                  <option value="A-Z">Customer: A-Z</option>
                  <option value="Z-A">Customer: Z-A</option>
                </select>
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Onboarded From</label>
                <input 
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-600 outline-none"
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Onboarded To</label>
                <input 
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-indigo-600 outline-none"
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                />
             </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4 text-right">Proj. Value</th>
                <th className="px-6 py-4 text-right">Received</th>
                <th className="px-6 py-4 text-right text-rose-600">Pending</th>
                <th className="px-6 py-4">Collection Rate</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => {
                const rate = c.projectAmount > 0 ? (c.received / c.projectAmount) * 100 : 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors relative group">
                    <td className="px-6 py-4 pl-10 relative">
                      {/* Status Bar */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1",
                        rate >= 100 ? "bg-emerald-500" : rate > 0 ? "bg-indigo-500" : "bg-rose-500"
                      )} />
                      <p className="font-bold text-slate-900">{c.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.contactNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">₹{c.projectAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-emerald-600">₹{c.received.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">₹{c.pending.toLocaleString()}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, rate)}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{rate.toFixed(0)}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/customers/${c.id}/financials?type=RECEIVED`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
                      >
                        Receipts <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Receipt */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Record Payment Receipt</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Customer / Project *</label>
                <select required className={inputCls} value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })}>
                  <option value="">Select Account...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName} | {c.contactNumber}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-start-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Payment Channel</label>
                  <select className={inputCls} value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                    <option value="UPI">UPI / Digital</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className="col-start-1 row-start-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Amount (₹) *</label>
                  <input required type="number" min="1" className={inputCls} placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Reference / Note</label>
                <input type="text" className={inputCls} placeholder="Ref No, UTR, or Details" value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 font-bold text-[11px] uppercase px-4">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 text-xs transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Create Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-3 px-4 text-slate-900 font-bold placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none text-sm";
