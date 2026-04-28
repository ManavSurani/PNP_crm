"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  CalendarCheck,
  FileText,
  ShoppingCart,
  IndianRupee,
  Truck,
  HardHat,
  Banknote,
  TrendingUp,
  Settings,
  Star,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Business Intelligence", href: "/", icon: LayoutDashboard },
  { name: "Lead Pipeline", href: "/leads", icon: Users },
  { name: "Follow-Up Queue", href: "/follow-ups", icon: PhoneCall },
  { name: "Site Visits", href: "/meetings", icon: CalendarCheck },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Project Progress", href: "/orders", icon: ShoppingCart },
  { name: "Payment Receipts", href: "/payments", icon: IndianRupee },
  { name: "Interested Leads", href: "/interested", icon: Star },
  { name: "Vendor Directory", href: "/suppliers", icon: Truck },
  { name: "Field Staff", href: "/workers", icon: HardHat },
  { name: "Business Expenses", href: "/expenses", icon: Banknote },
  { name: "Reports & Analytics", href: "/reports", icon: TrendingUp },
  { name: "General Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-950 border-r border-white/5 shadow-2xl relative z-[50]">
      <div className="flex h-20 shrink-0 items-center px-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight uppercase">PNP <span className="text-indigo-400">CRM</span></span>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-6 scrollbar-hide">
        <nav className="flex-1 space-y-1 px-4">
          <div className="px-4 mb-4">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">CRM Modules</p>
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  "group flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400",
                      "mr-3.5 h-[18px] w-[18px] shrink-0 transition-colors"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </div>
                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 mt-auto border-t border-white/5">
         <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cloud Synced</p>
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[11px] text-slate-300 font-medium">System Ready</p>
            </div>
         </div>
      </div>
    </div>
  );
}
