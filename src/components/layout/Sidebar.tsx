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
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Follow-ups", href: "/follow-ups", icon: PhoneCall },
  { name: "Meetings", href: "/meetings", icon: CalendarCheck },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Payments", href: "/payments", icon: IndianRupee },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Workers", href: "/workers", icon: HardHat },
  { name: "Expenses", href: "/expenses", icon: Banknote },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800">
      <div className="flex h-16 shrink-0 items-center px-6 bg-slate-950">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          PNP CRM
        </h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-4">
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                  "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300",
                    "mr-3 h-5 w-5 shrink-0 transition-colors"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
