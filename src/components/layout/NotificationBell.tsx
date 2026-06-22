"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bell, PhoneCall, Home, AlertCircle, ClipboardCheck, 
  CheckCircle2, Loader2, Calendar, Clock, ChevronRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "FOLLOW_UP" | "SITE_VISIT" | "OVERDUE" | "TASK";
  title: string;
  description: string;
  time: string;
  date: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  link: string;
  category: string;
  isRead?: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | "Follow-Ups" | "Site Visits" | "Overdue">("All");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Listen for custom refresh event
    const handleRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener("refresh-notifications", handleRefresh);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("refresh-notifications", handleRefresh);
    };
  }, []);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "All") return true;
    if (activeTab === "Follow-Ups") return n.category === "Follow-Ups";
    if (activeTab === "Site Visits") return n.category === "Site Visits";
    if (activeTab === "Overdue") return n.category === "Overdue";
    return true;
  });

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set([...Array.from(prev), id]));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "FOLLOW_UP": return <PhoneCall className="h-4 w-4" />;
      case "SITE_VISIT": return <Home className="h-4 w-4" />;
      case "OVERDUE": return <AlertCircle className="h-4 w-4" />;
      default: return <ClipboardCheck className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string, type: string) => {
    if (type === "OVERDUE") return "bg-rose-500";
    if (priority === "HIGH") return "bg-amber-500";
    return "bg-sky-500";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative -m-2.5 p-2.5 text-slate-400 hover:text-slate-500 transition-colors rounded-full",
          isOpen && "text-slate-600 bg-slate-50"
        )}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse-soft">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 focus:outline-none overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors"
              >
                Mark all as read
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-4 p-1 bg-slate-100 rounded-lg">
              {["All", "Follow-Ups", "Site Visits", "Overdue"].map((tab) => {
                const count = tab === "All" 
                    ? notifications.length 
                    : notifications.filter(n => n.category === tab).length;
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all",
                      activeTab === tab 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    )}
                  >
                    {tab === "All" ? "All" : tab.split(" ")[0]}
                    {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Checking alerts...</span>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {filteredNotifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => {
                        markAsRead(n.id);
                        setIsOpen(false);
                    }}
                    className={cn(
                      "group flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors relative",
                      !readIds.has(n.id) && "bg-indigo-50/30"
                    )}
                  >
                    <div className={cn(
                      "mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      n.type === "OVERDUE" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                      n.type === "FOLLOW_UP" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                      n.type === "SITE_VISIT" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      "bg-slate-50 text-slate-600 border border-slate-100"
                    )}>
                      {getIcon(n.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate tracking-tight">{n.title}</span>
                        <div className={cn("h-1.5 w-1.5 rounded-full", getPriorityColor(n.priority, n.type))} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5 line-clamp-2">
                        {n.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">
                          <Clock className="h-2.5 w-2.5" />
                          {n.time}
                        </div>
                        {n.type === "OVERDUE" && (
                          <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Urgent</span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all mt-3" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight">No new notifications</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50/50 border-top border-slate-100">
            <button 
              className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-3 w-3" /> View All Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
