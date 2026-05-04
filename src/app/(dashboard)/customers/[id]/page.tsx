"use client";

import { use, useState, useEffect } from "react";
import { 
  FileText, Palette, Wallet, Activity, User, 
  ChevronRight, Loader2, Clock, 
  LayoutGrid, Settings, HelpCircle, ArrowLeft,
  CheckCircle2, ArrowRight
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
  accentColor: string;
  iconBg: string;
}

const HubCard = ({ title, subtitle, icon, href, badge, badgeColor, accentColor, iconBg }: HubCardProps) => {
  return (
    <Link 
      href={href}
      className="group relative flex flex-col p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200 overflow-hidden"
    >
      {/* Decorative Accent Corner */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-0 group-hover:opacity-10 transition-opacity duration-500",
        accentColor
      )} />
      
      {/* Icon Area */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 border border-slate-100",
          iconBg
        )}>
          {icon}
        </div>
        
        {badge && (
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
            badgeColor || "bg-rose-50 text-rose-600 border-rose-100"
          )}>
            {badge}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="space-y-1.5 flex-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2 group-hover:border-emerald-50 transition-colors">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">
          Open Module
        </span>
        <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
};

export default function CustomerHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchCustomer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-8">
      
      {/* Navigation & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link 
          href="/customers"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors group"
        >
          <div className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center group-hover:border-emerald-200 bg-white shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </div>
          BACK
        </Link>
        
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          <Link href="/customers" className="hover:text-emerald-600 transition-colors text-indigo-400/80">Customer Directory</Link>
          <ChevronRight className="h-3 w-3 text-slate-300" /> 
          <span className="text-slate-900 font-black">{customer?.customerName || "Profile"}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] -ml-24 -mb-24" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Active Workspace</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                {customer?.customerName || "Client Portal"}
              </h1>
              <p className="text-xs md:text-sm font-medium text-slate-500 max-w-xl leading-relaxed">
                Welcome to your centralized project hub. Manage quotations, track design progress, and monitor site execution in real-time.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex items-center gap-3">
               <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
                 <LayoutGrid className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Client</p>
                 <p className="text-xs font-bold text-slate-900">Partner ID: #{id.slice(-4).toUpperCase()}</p>
               </div>
            </div>
            <Link 
              href={`/customers/${id}/details`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <User className="h-4 w-4" /> View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Section Label */}
      <div className="flex items-center gap-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Project Modules</h2>
        <div className="h-px w-full bg-slate-200" />
      </div>

      {/* Tile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HubCard 
          title="Quotations"
          subtitle="Proposals, cost estimates & approvals."
          icon={<FileText className="h-6 w-6 text-indigo-500" />}
          href={`/customers/${id}/quotations`}
          iconBg="bg-indigo-50 border-indigo-100"
          accentColor="bg-indigo-500"
        />
        
        <HubCard 
          title="Designs"
          subtitle="3D Renders, layouts & moodboards."
          icon={<Palette className="h-6 w-6 text-rose-500" />}
          href="/design"
          iconBg="bg-rose-50 border-rose-100"
          accentColor="bg-rose-500"
        />

        <HubCard 
          title="Financials"
          subtitle="Payments, ledger & expenses."
          icon={<Wallet className="h-6 w-6 text-emerald-500" />}
          href={`/customers/${id}/financials`}
          badge="Audit Sync"
          badgeColor="bg-emerald-50 text-emerald-600 border-emerald-100"
          iconBg="bg-emerald-50 border-emerald-100"
          accentColor="bg-emerald-500"
        />

        <HubCard 
          title="Project Progress"
          subtitle="Site milestones & execution logs."
          icon={<Activity className="h-6 w-6 text-blue-500" />}
          href="/orders"
          badge="Live Status"
          badgeColor="bg-blue-50 text-blue-600 border-blue-100"
          iconBg="bg-blue-50 border-blue-100"
          accentColor="bg-blue-500"
        />

        <HubCard 
          title="Customer Logistics"
          subtitle="Address, contacts & preferences."
          icon={<User className="h-6 w-6 text-slate-700" />}
          href={`/customers/${id}/details`}
          iconBg="bg-slate-100 border-slate-200"
          accentColor="bg-slate-900"
        />

        {/* Support Tile */}
        <div className="group flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-xl border border-slate-200 border-dashed transition-all hover:border-emerald-300 hover:bg-emerald-50/30">
           <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
             <HelpCircle className="h-6 w-6 text-slate-400" />
           </div>
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Portal Support</h3>
           <p className="text-[9px] text-slate-400 mt-1 uppercase">24/7 Assistance</p>
        </div>
      </div>


    </div>
  );
}
