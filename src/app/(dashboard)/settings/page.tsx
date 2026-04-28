"use client";

import { useState } from "react";
import { 
  Settings as SettingsIcon, User, Lock, Bell, 
  Shield, Languages, Palette, Save, LogOut, ChevronRight
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "security", name: "Security", icon: Lock },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "system", name: "System Config", icon: SettingsIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">General Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure your personal profile and system preferences.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 space-y-1.5 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-sm font-semibold transition-all group",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
                {tab.name}
              </div>
              {activeTab === tab.id && <ChevronRight className="h-4 w-4 opacity-50" />}
            </button>
          ))}
          <div className="pt-6 mt-6 border-t border-slate-200">
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all group"
            >
              <LogOut className="h-4 w-4 text-rose-400 group-hover:text-rose-600" /> End Current Session
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[540px]">
          {activeTab === "profile" && (
            <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-6 pb-2">
                <div className="h-16 w-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-2xl text-indigo-600 shadow-sm">
                  {session?.user?.name?.[0] || "A"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{session?.user?.name || "Corporate Admin"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                      <Shield className="h-3 w-3" /> {session?.user?.role || "SUPER ADMIN"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">• Global Permissions</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Account Identity</label>
                   <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-100 text-sm font-semibold text-slate-700">
                     {session?.user?.name || "N/A"}
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Registered Endpoint</label>
                   <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-100 text-sm font-semibold text-slate-700">
                     {session?.user?.email || "N/A"}
                   </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100/50 p-6 rounded-xl flex gap-5 items-start">
                <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                   <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">Privileged Session Active</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Your current session is cryptographically signed with root-level access. You have universal authority to override system configurations and access sensitive financial data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "profile" && ( activeTab === "notifications" || activeTab === "system" || activeTab === "security" ) && (
            <div className="flex h-[540px] items-center justify-center flex-col gap-6 p-10 text-center animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600/10 rounded-full blur-2xl" />
                <div className="relative bg-white p-8 rounded-full shadow-lg border border-slate-100">
                  <SettingsIcon className="h-12 w-12 text-slate-300 animate-spin-slow" />
                </div>
              </div>
              <div className="max-w-xs space-y-2">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Configuration Locked</p>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Advanced system configuration modules are currently being hardened. Please contact the technical supervisor for manual overrides.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
