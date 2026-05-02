"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  CopyCheck, Loader2, Package, ArrowRight, Clock, IndianRupee,
  TrendingUp, AlertCircle, Check, Search, Filter, ArrowUpDown, RotateCcw, ChevronRight, ArrowLeft
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

const STAGES = ["DESIGN", "PROCURING", "CARPENTRY", "ELECTRICAL", "PAINTING", "INSTALLATION", "COMPLETED"];
const FINAL_STAGES = ["COMPLETED", "CANCELLED"];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("NEWEST");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error("Orders API returned non-array data:", data);
        setOrders([]);
      }
    } catch (e) { 
      console.error("Failed to fetch orders:", e);
      setOrders([]);
    }
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

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.lead.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" ? !FINAL_STAGES.includes(o.status) : o.status === statusFilter;
    
    const oDate = new Date(o.createdAt);
    const matchesStart = !dateRange.start || oDate >= new Date(dateRange.start);
    const matchesEnd = !dateRange.end || oDate <= new Date(dateRange.end + "T23:59:59");

    if (statusFilter === "COMPLETED") return matchesSearch && o.status === "COMPLETED" && matchesStart && matchesEnd;
    if (statusFilter === "CANCELLED") return matchesSearch && o.status === "CANCELLED" && matchesStart && matchesEnd;

    return matchesSearch && matchesStatus && matchesStart && matchesEnd;
  }).sort((a, b) => {
    if (sortBy === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "A-Z") return a.lead.customerName.localeCompare(b.lead.customerName);
    if (sortBy === "Z-A") return b.lead.customerName.localeCompare(a.lead.customerName);
    return 0;
  });

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPending = filteredOrders.reduce((s, o) => s + o.pendingAmount, 0);
  const activeOrders = filteredOrders.filter(o => !FINAL_STAGES.includes(o.status)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500 rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Project Progress</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time tracking of production and installation milestones.</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow w-full md:max-w-xl group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-200 py-2.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white transition-all outline-none"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Active Projects</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition shadow-sm",
              showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Filter className="h-4 w-4" /> {showFilters ? "Hide" : "Filters"}
          </button>
          <button 
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
              setDateRange({ start: "", end: "" });
              setSortBy("NEWEST");
            }}
            className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Sort Projects</label>
              <select 
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="NEWEST">Deployment: Newest</option>
                <option value="OLDEST">Deployment: Oldest</option>
                <option value="A-Z">Customer: A-Z</option>
                <option value="Z-A">Customer: Z-A</option>
              </select>
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">From Date</label>
              <input 
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={dateRange.start}
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
              />
           </div>
           <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">To Date</label>
              <input 
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none"
                value={dateRange.end}
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
              />
           </div>
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Orders", val: activeOrders, icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Order Value", val: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Pending Payments", val: `₹${totalPending.toLocaleString()}`, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors", card.bg, card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className="text-xl font-semibold text-slate-900 mt-0.5">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
             <span className="text-sm font-medium">Loading Production Data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="py-4 pl-8 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Details</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Details</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stage</th>
                  <th className="px-3 py-4 text-right pr-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filteredOrders.map(order => {
                  const stageIdx = STAGES.indexOf(order.status);
                  const isLast = FINAL_STAGES.includes(order.status);
                  return (
                    <tr key={order.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-5 pl-8 pr-3">
                        <Link href={`/orders/${order.id}`} className="block">
                          <p className="text-xs font-bold text-primary tracking-wider">{order.orderNo}</p>
                          <p className="text-[11px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                             <Clock className="h-3 w-3" />
                             {format(new Date(order.createdAt), "dd MMM yyyy")}
                          </p>
                        </Link>
                      </td>
                      <td className="px-3 py-5">
                        <p className="text-sm font-semibold text-slate-900">{order.lead.customerName}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1 tracking-tight">{order.lead.serviceType.replace(/_/g, " ")}</p>
                      </td>
                      <td className="px-3 py-5">
                        <p className="text-sm font-bold text-slate-900 tracking-tight">₹{order.totalAmount.toLocaleString()}</p>
                        <div className="flex gap-2 mt-1 text-[10px] font-medium">
                          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Paid: ₹{order.advanceAmount?.toLocaleString() || 0}</span>
                          {order.pendingAmount > 0 && <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Due: ₹{order.pendingAmount.toLocaleString()}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-5">
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {STAGES.map((stage, idx) => (
                            <span key={stage} className={cn(
                              "px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-tight transition-all",
                              stageIdx >= idx ? "bg-primary text-white" : "bg-slate-100 text-slate-300"
                            )}>
                              {stage === "MATERIAL_PROCUREMENT" ? "PROC" : stage.slice(0, 4)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-5 pr-8 text-right">
                        {!isLast ? (
                          <button
                            onClick={() => moveStage(order)}
                            disabled={movingId === order.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-50 shadow-sm border border-indigo-500/20"
                          >
                            {movingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                            Move to {STAGES[stageIdx + 1] || "Finish"}
                          </button>
                        ) : (
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide",
                            order.status === "CANCELLED" ? "text-rose-600" : "text-emerald-600"
                          )}>
                             <div className={cn("h-1.5 w-1.5 rounded-full", order.status === "CANCELLED" ? "bg-rose-500" : "bg-emerald-500")} />
                            {order.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] italic">No matching projects found. Try adjusting your search or filters.</td></tr>
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
