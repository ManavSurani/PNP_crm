"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  PhoneCall,
  CalendarCheck,
  Truck,
  Banknote,
  TrendingUp,
  Settings,
  Star,
  Trash2,
  Layers,
  ChevronDown,
  ChevronRight,
  FolderCheck,
  RefreshCw,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { cn } from "@/lib/utils";

const groups = [
  {
    title: "LEADS",
    items: [
      { name: "Lead Pipeline", href: "/leads", icon: Users },
      { name: "Follow-Up Queue", href: "/follow-ups", icon: PhoneCall },
      { name: "Interested Leads", href: "/interested", icon: Star },
      { name: "Site Visits", href: "/meetings", icon: CalendarCheck },
    ]
  },
  {
    title: "CUSTOMERS",
    items: [
      { name: "Customer Directory", href: "/customers", icon: Briefcase },
      { name: "Complete Projects", href: "/customers/completed", icon: FolderCheck },
      { name: "Vendor Directory", href: "/suppliers", icon: Truck },
      { name: "Work Fields", href: "/fields", icon: Layers },
    ]
  },
  {
    title: "ANALYTICS",
    items: [
      { name: "Business Intelligence", href: "/", icon: LayoutDashboard },
      { name: "Business Analytics", href: "/analytics", icon: Banknote },
      { name: "Reports & Analytics", href: "/reports", icon: TrendingUp },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Canceled Archive", href: "/canceled", icon: Trash2 },
      { name: "General Settings", href: "/settings", icon: Settings },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["LEADS", "CUSTOMERS", "ANALYTICS", "SYSTEM"]);
  const [tunnelStatus, setTunnelStatus] = useState<{ online: boolean; url: string | null; loading: boolean }>({
    online: false,
    url: null,
    loading: true,
  });
  const [connecting, setConnecting] = useState(false);

  const fetchTunnelStatus = async () => {
    try {
      const res = await fetch("/api/system/tunnel");
      if (res.ok) {
        const data = await res.json();
        setTunnelStatus({ online: data.online, url: data.url, loading: false });
      } else {
        setTunnelStatus({ online: false, url: null, loading: false });
      }
    } catch {
      setTunnelStatus({ online: false, url: null, loading: false });
    }
  };

  useEffect(() => {
    fetchTunnelStatus();
    const interval = setInterval(fetchTunnelStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectTunnel = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/system/tunnel", { method: "POST" });
      const data = await res.json();
      if (data.success && data.online) {
        setTunnelStatus({ online: true, url: data.url, loading: false });
      } else {
        alert(data.error || "Could not connect to internet. Please check your network.");
        setTunnelStatus({ online: false, url: null, loading: false });
      }
    } catch {
      alert("Connection attempt failed. Please check internet.");
    } finally {
      setConnecting(false);
    }
  };

  // Auto-expand group if it contains the active route
  useEffect(() => {
    groups.forEach(group => {
      const hasActive = group.items.some(item => 
        pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
      );
      if (hasActive && !expandedGroups.includes(group.title)) {
        setExpandedGroups(prev => [...prev, group.title]);
      }
    });
  }, [pathname, expandedGroups]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="flex h-full w-64 flex-col bg-slate-950 border-r border-white/5 shadow-2xl relative z-[50] group/sidebar">
      <Link href="/leads" className="flex h-20 shrink-0 items-center px-8 border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-10 w-10 group-hover:scale-105" />
          <span className="text-lg font-bold text-white tracking-tight uppercase">PNP <span className="text-indigo-400">CRM</span></span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-6 sidebar-scroll group-hover/sidebar:sidebar-scroll-hover">
        <nav className="flex-1 space-y-6 px-4">
          {groups.map((group) => {
            const isExpanded = expandedGroups.includes(group.title);
            return (
              <div key={group.title} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between px-4 py-2 text-[10px] font-black text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-[0.2em] group"
                >
                  {group.title}
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {group.items.map((item) => {
                      const allMatches = groups.flatMap(g => g.items).filter(i =>
                        pathname === i.href || (i.href !== "/" && pathname.startsWith(i.href + "/")) || (i.href !== "/" && pathname === i.href)
                      );
                      const bestMatch = allMatches.sort((a, b) => b.href.length - a.href.length)[0];
                      const isActive = item.href === bestMatch?.href || pathname === item.href;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            isActive
                              ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                            "group/item flex items-center justify-between rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200"
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon
                              className={cn(
                                isActive ? "text-indigo-400" : "text-slate-500 group-hover/item:text-slate-400",
                                "mr-3.5 h-[16px] w-[16px] shrink-0 transition-colors"
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </div>
                          {isActive && <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-4 mt-auto border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Sync Tunnel</p>
            {tunnelStatus.online ? (
              <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            ) : (
              <span className="text-[9px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                OFFLINE
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  tunnelStatus.online
                    ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    : "bg-rose-500"
                )}
              />
              <p className="text-[11px] text-slate-200 font-medium truncate">
                {tunnelStatus.online ? "Tunnel Online" : "Offline Mode"}
              </p>
            </div>

            {!tunnelStatus.online && (
              <button
                onClick={handleConnectTunnel}
                disabled={connecting}
                className="flex items-center gap-1 text-[10px] font-semibold text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 px-2 py-1 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                title="Retry connecting Ngrok tunnel"
              >
                <RefreshCw className={cn("h-3 w-3", connecting && "animate-spin")} />
                {connecting ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
