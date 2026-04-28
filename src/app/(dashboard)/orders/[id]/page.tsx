"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, Loader2, IndianRupee, TrendingUp, TrendingDown, 
  Package, Truck, Wrench, Wallet, Calendar, User, Phone, CheckCircle2,
  HardHat, Zap, Palette, Hammer, ShoppingCart, Check, AlertCircle,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "DESIGN", label: "Design", icon: Package },
  { id: "PROCURING", label: "Procuring", icon: ShoppingCart },
  { id: "CARPENTRY", label: "Carpentry", icon: Hammer },
  { id: "ELECTRICAL", label: "Electrical", icon: Zap },
  { id: "PAINTING", label: "Painting", icon: Palette },
  { id: "INSTALLATION", label: "Installation", icon: Wrench },
  { id: "COMPLETED", label: "Handover", icon: CheckCircle2 }
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then(data => { setOrder(data); setIsLoading(false); })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
        setOrder(null);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-slate-400 font-semibold tracking-wide text-xs">Synchronizing Deployment Intelligence...</p>
      </div>
    );
  }

  if (!order) return <div className="p-20 text-center font-semibold text-slate-400 uppercase tracking-[0.2em] text-xs underline underline-offset-8 decoration-slate-100">Project Not Profiled</div>;

  const totalReceived = order.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0;
  const totalExpenses = order.expenses?.reduce((s: number, e: any) => s + e.amount, 0) || 0;
  const netProfit = totalReceived - totalExpenses;
  const profitMargin = totalReceived > 0 ? ((netProfit / totalReceived) * 100).toFixed(1) : "0";
  const projectedProfit = order.totalAmount - totalExpenses;
  
  const currentStageIdx = STAGES.findIndex(s => s.id === order.status);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      {/* Dynamic Navigation Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <Link href="/orders" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold uppercase text-[10px] tracking-[0.2em] bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm w-fit">
          <ArrowLeft className="h-3.5 w-3.5" /> Logistic Pipeline
        </Link>
        <div className="flex items-center gap-3">
           <div className={cn(
             "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm border",
             order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-primary border-indigo-100"
           )}>
             Deployment State: {order.status}
           </div>
        </div>
      </div>

      {/* Enterprise Project Banner */}
      <div className="bg-white p-10 md:p-12 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-5 -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-8">
            <div className="space-y-2">
               <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-bold uppercase tracking-widest">Live Deployment</div>
               <h1 className="text-4xl font-bold tracking-tight text-slate-900 uppercase leading-none">{order.orderNo}</h1>
            </div>
            <div className="flex flex-wrap gap-8 items-center">
              <HeaderMetric icon={User} label="Project Owner" val={order.lead.customerName} />
              <div className="h-10 w-px bg-slate-100 hidden md:block" />
              <HeaderMetric icon={Package} label="Package Tier" val={order.packageType?.replace("_", " ") || "Full Combo"} />
              <div className="h-10 w-px bg-slate-100 hidden md:block" />
              <HeaderMetric icon={Calendar} label="Inception" val={format(new Date(order.createdAt), "dd MMM, yyyy")} />
            </div>
          </div>
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 min-w-[280px] shadow-sm">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Net Contract Value</p>
             <p className="text-4xl font-bold tracking-tighter text-slate-900">₹{order.totalAmount.toLocaleString()}</p>
             <div className="mt-5 flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Active Enterprise Asset</span>
             </div>
          </div>
        </div>
      </div>

      {/* Operational Lifecycle Stepper */}
      <section className="bg-white p-10 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-12 text-slate-400 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary" /> Tactical Execution Journey
         </h3>
         <div className="relative pt-6">
            <div className="absolute top-[38px] left-0 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div 
                className="h-full bg-primary transition-all duration-1000 ease-in-out shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }} 
               />
            </div>
            <div className="relative z-10 flex justify-between items-center">
               {STAGES.map((stage, idx) => {
                 const isActive = currentStageIdx >= idx;
                 const isCurrent = currentStageIdx === idx;
                 return (
                   <div key={stage.id} className="flex flex-col items-center gap-5">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500 border-2",
                        isCurrent ? "bg-primary text-white border-primary shadow-lg shadow-indigo-100 scale-110" : 
                        isActive ? "bg-white text-primary border-primary" : 
                        "bg-white text-slate-200 border-slate-100"
                      )}>
                        <stage.icon className="h-5 w-5" />
                      </div>
                      <div className="text-center group">
                         <p className={cn(
                           "text-[9px] font-bold uppercase tracking-widest",
                           isActive ? "text-slate-900" : "text-slate-300"
                         )}>{stage.label}</p>
                         {isCurrent && (
                           <span className="inline-block mt-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                         )}
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>
      </section>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Financial Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <StatCard label="Cash Collected" val={totalReceived} color="text-emerald-600" sub="Pay History" />
               <StatCard label="Operating Costs" val={totalExpenses} color="text-rose-600" sub="Material + Lab" />
               <StatCard label="Live Net Profit" val={netProfit} color="text-indigo-600" sub={`${profitMargin}% Margin`} isLarge />
            </div>

            {/* Project Personnel */}
            <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
               <div className="flex items-center justify-between gap-4 mb-8">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg"><HardHat className="h-5 w-5 text-white" /></div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Active Workforce</h3>
                 </div>
                 <button className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-slate-200 hover:bg-slate-100">Manage Team</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.assignments?.length > 0 ? order.assignments.map((asgn: any) => (
                    <div key={asgn.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm font-bold text-slate-900 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             {asgn.worker.name[0]}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900 uppercase">{asgn.worker.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asgn.worker.type}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest italic">{asgn.status}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter">{asgn.worker.phone}</p>
                       </div>
                    </div>
                  )) : (
                    <div className="col-span-2 py-12 text-center border-4 border-dashed border-slate-50 rounded-3xl">
                       <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No worker assignments recorded.</p>
                       <p className="text-[10px] text-slate-400 font-bold mt-2">Deploy your team to start production tracking.</p>
                    </div>
                  )}
               </div>
            </section>
         </div>

         {/* Transactions Sidebar */}
         <div className="space-y-8">
            <aside className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
               <h4 className="text-sm font-bold uppercase tracking-tighter text-slate-900 mb-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                  Recent Inflow <span className="text-[10px] text-emerald-500 font-bold">Payments</span>
               </h4>
               <div className="space-y-4">
                  {order.payments?.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                          <div>
                             <p className="text-xs font-bold text-slate-900 leading-none">₹{p.amount.toLocaleString()}</p>
                             <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{format(new Date(p.paymentDate || p.createdAt), "dd MMM")}</p>
                          </div>
                       </div>
                       <span className="text-[8px] font-bold uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">{p.type}</span>
                    </div>
                  ))}
               </div>
            </aside>

            <aside className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
               <h4 className="text-sm font-bold uppercase tracking-tighter text-slate-900 mb-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                  Project Outflow <span className="text-[10px] text-rose-500 font-bold">Expenses</span>
               </h4>
               <div className="space-y-4">
                  {order.expenses?.slice(0, 5).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 bg-rose-500 rounded-full" />
                          <div>
                             <p className="text-xs font-bold text-slate-900 leading-none">₹{e.amount.toLocaleString()}</p>
                             <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">{e.category}</p>
                          </div>
                       </div>
                       <span className="text-[8px] font-bold uppercase text-slate-400">{format(new Date(e.date || e.createdAt), "dd MMM")}</span>
                    </div>
                  ))}
               </div>
            </aside>
         </div>
      </div>
    </div>
  );
}

function HeaderMetric({ icon: Icon, label, val }: { icon: any, label: string, val: string }) {
  return (
    <div className="flex items-center gap-4">
       <div className="bg-white/5 p-2 rounded-xl border border-white/5"><Icon className="h-4 w-4 text-indigo-400" /></div>
       <div>
          <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-sm font-bold text-white leading-none">{val}</p>
       </div>
    </div>
  );
}

function StatCard({ label, val, color, sub, isLarge = false }: { label: string, val: number, color: string, sub: string, isLarge?: boolean }) {
  return (
    <div className={cn(
      "p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all",
      isLarge ? "bg-slate-900 text-white md:col-span-1" : "bg-white"
    )}>
       {isLarge && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-10" />}
       <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2", isLarge ? "text-indigo-400" : "text-slate-400")}>{label}</p>
       <p className={cn("text-3xl font-bold tracking-tight", color, isLarge && "text-white")}>₹{val.toLocaleString()}</p>
       <div className="mt-4 flex items-center justify-between">
          <p className={cn("text-[9px] font-bold uppercase tracking-[0.2em]", isLarge ? "text-slate-400" : "text-slate-300")}>{sub}</p>
          <TrendingUp className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
       </div>
    </div>
  );
}
