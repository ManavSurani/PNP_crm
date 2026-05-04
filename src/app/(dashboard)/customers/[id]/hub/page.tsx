"use client";

import { use, useState, useEffect } from "react";
import { 
  FileText, Palette, Wallet, Activity, User, 
  ChevronRight, Loader2, Clock, 
  LayoutGrid, Settings, HelpCircle, ArrowLeft
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
      className="group relative flex flex-col p-8 bg-white rounded-[24px] border border-slate-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-slate-300/50 overflow-hidden"
    >
      {/* Decorative Gradient Background */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-700",
        accentColor
      )} />
      
      {/* Icon Area */}
      <div className="flex items-start justify-between mb-8">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm border border-slate-100",
          iconBg
        )}>
          {icon}
        </div>
        
        {badge && (
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border self-start mt-2",
            badgeColor || "bg-rose-50 text-rose-600 border-rose-100"
          )}>
            {badge}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="space-y-2 flex-1">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm font-medium text-slate-400 group-hover:text-slate-500 transition-colors leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6 group-hover:border-slate-100 transition-colors">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-slate-500 transition-colors">
          Access Module
        </span>
        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:translate-x-1">
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
      <div className="flex h-screen items-center justify-center bg-[#fcfcfd]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary/20" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] selection:bg-primary/10">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 space-y-20">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link 
            href="/customers"
            className="group flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all"
          >
            <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </div>
            BACK TO DIRECTORY
          </Link>
          
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 tracking-widest uppercase">
            Portal <ChevronRight className="h-3 w-3" /> Customer Hub <ChevronRight className="h-3 w-3" /> {customer?.customerName || "Profile"}
          </div>
        </div>

        {/* Hero Header */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 to-transparent rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace Live</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
                  {customer?.customerName || "Client Portal"}
                </h1>
                <p className="text-lg md:text-xl font-medium text-slate-400 max-w-2xl">
                  A high-fidelity central hub for managing your project assets, commercial quotes, and site progress.
                </p>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                   <LayoutGrid className="h-6 w-6" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
                   <p className="text-sm font-bold text-slate-900">Verified Partner</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <HubCard 
            title="Quotation"
            subtitle="Review pending proposals and commercial estimates."
            icon={<FileText className="h-8 w-8 text-indigo-500" />}
            href={`/customers/${id}/quotations`}
            iconBg="bg-indigo-50/50 group-hover:bg-indigo-50"
            accentColor="bg-indigo-500"
          />
          
          <HubCard 
            title="Design"
            subtitle="Explore project blueprints, 3D renders and layouts."
            icon={<Palette className="h-8 w-8 text-rose-500" />}
            href="/design"
            iconBg="bg-rose-50/50 group-hover:bg-rose-50"
            accentColor="bg-rose-500"
          />

          <HubCard 
            title="Payment"
            subtitle="Track transaction history, invoices and balances."
            icon={<Wallet className="h-8 w-8 text-emerald-500" />}
            href="/payment"
            badge="Needs Action"
            badgeColor="bg-rose-50 text-rose-600 border-rose-100"
            iconBg="bg-emerald-50/50 group-hover:bg-emerald-50"
            accentColor="bg-emerald-500"
          />

          <HubCard 
            title="Project Progress"
            subtitle="Monitor site milestones and real-time execution status."
            icon={<Activity className="h-8 w-8 text-blue-500" />}
            href={`/customers/${id}/progress`}
            badge="Live"
            badgeColor="bg-emerald-50 text-emerald-700 border-emerald-100"
            iconBg="bg-blue-50/50 group-hover:bg-blue-50"
            accentColor="bg-blue-500"
          />

          <HubCard 
            title="Customer Details"
            subtitle="Update profile logistics and execution preferences."
            icon={<User className="h-8 w-8 text-slate-700" />}
            href="/customer-details"
            iconBg="bg-slate-100 group-hover:bg-slate-200"
            accentColor="bg-slate-900"
          />

          {/* Placeholder/Coming Soon Tile */}
          <div className="group flex flex-col items-center justify-center p-8 bg-slate-50/30 rounded-[24px] border border-slate-200 border-dashed opacity-40 hover:opacity-100 transition-all duration-500">
             <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-6">
               <Settings className="h-8 w-8 text-slate-300" />
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Add Ons</h3>
          </div>
        </div>

        {/* Modern Footer Section */}
        <div className="pt-20 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-10">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              PNP CRM PORTAL v2.4
            </p>
            <div className="h-4 w-px bg-slate-200 hidden md:block" />
            <div className="flex items-center gap-6">
              <Link href="#" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Documentation</Link>
              <Link href="#" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Support</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Need Assistance?</span>
          </div>
        </div>

      </div>
    </div>
  );
}
