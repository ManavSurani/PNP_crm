"use client";

import { use, useState, useEffect } from "react";
import { 
  FileText, Palette, Wallet, Activity, User, 
  ChevronRight, Loader2, ArrowLeft,
  Pencil, Check, X, LayoutGrid, HelpCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HubCardProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  badgeColor?: string;
  iconBg: string;
}

const HubCard = ({ title, subtitle, icon, href, badge, badgeColor, iconBg }: HubCardProps) => {
  return (
    <Link 
      href={href}
      className="group flex flex-col p-4 bg-white rounded-[14px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08)] hover:-translate-y-1 relative h-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg transition-colors duration-300", iconBg)}>
          {icon}
        </div>
        {badge && (
          <span className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] rounded-full border", badgeColor)}>
            {badge}
          </span>
        )}
      </div>
      
      <div className="flex-1 space-y-0.5">
        <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">
          OPEN MODULE
        </span>
        <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all border border-slate-100 group-hover:border-emerald-100">
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
};

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [tempProject, setTempProject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleUpdateProject = async () => {
    if (tempProject === (customer?.project?.name || customer?.customerName)) {
      setIsEditingProject(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: tempProject.trim() || null }),
      });

      if (res.ok) {
        setIsEditingProject(false);
        fetchCustomer();
      }
    } catch (error) {
      console.error("Error updating project name:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const primaryTitle = (customer?.project?.name || customer?.customerName || "NISARG").toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-3 pb-0 px-4 md:px-6">
      {/* 🔝 Top Navigation Section */}
      <div className="flex items-center justify-between px-2 pt-2">
        <Link 
          href="/customers"
          className="group flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
        >
          <div className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-colors bg-white shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
          </div>
          BACK
        </Link>
        
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
          {customer?.isProjectCompleted ? (
            <Link href="/customers/completed" className="text-blue-400 hover:text-blue-500 transition-colors">Complete Projects</Link>
          ) : (
            <Link href="/customers" className="text-slate-300 hover:text-slate-500 transition-colors">Customer Directory</Link>
          )}
          <ChevronRight className="h-3 w-3 text-slate-200" /> 
          <span className="text-slate-900">{customer?.customerName?.toUpperCase()}</span>
        </div>
      </div>

      {/* 🧑💼 Workspace Header (Hero Section) */}
      <div className="bg-white p-4 md:p-5 rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Active Workspace</span>
            </div>
            
            <div className="relative group/name max-w-fit">
              {isEditingProject ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    className="text-xl md:text-2xl font-black text-slate-900 tracking-tight outline-none border-b-2 border-emerald-500 bg-transparent uppercase"
                    value={tempProject}
                    onChange={(e) => setTempProject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateProject();
                      if (e.key === "Escape") setIsEditingProject(false);
                    }}
                  />
                  <div className="flex gap-1">
                    <button onClick={handleUpdateProject} disabled={isSubmitting} className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-all"><Check className="h-5 w-5" /></button>
                    <button onClick={() => setIsEditingProject(false)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all"><X className="h-5 w-5" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {primaryTitle}
                  </h1>
                  <button 
                    onClick={() => {
                      setTempProject(customer?.project?.name || customer?.customerName || "");
                      setIsEditingProject(true);
                    }}
                    className="p-1.5 bg-slate-50 text-slate-300 hover:text-emerald-600 rounded-lg border border-slate-100 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-slate-400 font-medium max-w-xl leading-relaxed text-sm">
              Welcome to your centralized project hub. Manage quotations, track design progress, and monitor site execution in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg">
                   <LayoutGrid className="h-5.5 w-5.5" />
                </div>
                <div className="space-y-0.5">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Client</p>
                   <p className="text-xs font-bold text-slate-900 tracking-tight">Partner ID: #619F</p>
                </div>
             </div>
             <Link 
               href={`/customers/${id}/details`}
               className="h-9 px-5 bg-emerald-600 text-white rounded-lg flex items-center gap-2 text-[10px] font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all hover:-translate-y-0.5 uppercase tracking-widest"
             >
                <User className="h-4 w-4" /> VIEW PROFILE
             </Link>
          </div>
        </div>
      </div>

      {/* 📦 Project Modules Section */}
      <div className="flex items-center gap-4 px-2 pt-2">
         <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Project Modules</h2>
         <div className="h-px w-full bg-slate-100" />
      </div>

      {/* 🧱 Module Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <HubCard 
          title="Quotations"
          subtitle="Proposals, cost estimates & approvals."
          icon={<FileText className="h-6 w-6 text-indigo-500" />}
          href={`/customers/${id}/quotations`}
          iconBg="bg-indigo-50"
        />
        <HubCard 
          title="Design Expenses"
          subtitle="Track renders, layouts & design costs."
          icon={<Palette className="h-6 w-6 text-rose-500" />}
          href={`/customers/${id}/design`}
          iconBg="bg-rose-50"
        />
        <HubCard 
          title="Financials"
          subtitle="Payments, ledger & expenses."
          icon={<Wallet className="h-6 w-6 text-emerald-500" />}
          href={`/customers/${id}/financials`}
          badge="AUDIT SYNC"
          badgeColor="bg-emerald-50 text-emerald-600 border-emerald-100"
          iconBg="bg-emerald-50"
        />
        <HubCard 
          title="Project Progress"
          subtitle="Site milestones & execution logs."
          icon={<Activity className="h-6 w-6 text-blue-500" />}
          href={`/customers/${id}/progress`}
          badge="LIVE STATUS"
          badgeColor="bg-blue-50 text-blue-600 border-blue-100"
          iconBg="bg-blue-50"
        />
        <HubCard 
          title="Customer Logistics"
          subtitle="Address, contacts & preferences."
          icon={<User className="h-6 w-6 text-slate-500" />}
          href={`/customers/${id}/details`}
          iconBg="bg-slate-50"
        />
        
        {/* Support Card Style (Empty State Style) */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/30 rounded-[14px] border-2 border-dashed border-slate-200 group hover:bg-emerald-50/20 hover:border-emerald-200 transition-all duration-300 h-full">
           <div className="h-10 w-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center mb-2 text-slate-300 shadow-sm group-hover:scale-110 transition-transform">
              <HelpCircle className="h-5 w-5" />
           </div>
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center mb-1 group-hover:text-emerald-600 transition-colors">PORTAL SUPPORT</p>
           <p className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter">24/7 ASSISTANCE</p>
        </div>
      </div>
    </div>
  );
}
