"use client";

import { useState } from "react";
import { 
  Settings as SettingsIcon, User, Lock, Bell, 
  Shield, Languages, Palette, Save, LogOut
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", name: "My Profile", icon: User },
    { id: "security", name: "Security", icon: Lock },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "system", name: "System Config", icon: SettingsIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl relative overflow-hidden border-b-4 border-slate-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight leading-none">Settings</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-3">Platform Configuration & Profile Management</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
          <div className="pt-8">
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-10 min-h-[500px]">
          {activeTab === "profile" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
                <div className="h-20 w-20 rounded-3xl bg-indigo-600 flex items-center justify-center font-black text-3xl text-white shadow-xl shadow-indigo-100">
                  {session?.user?.name?.[0] || "A"}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-none">{session?.user?.name || "Admin User"}</h2>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2 inline-flex items-center gap-2">
                    <Shield className="h-3 w-3" /> System Role: {session?.user?.role || "SUPER ADMIN"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" value={session?.user?.name || ""} disabled className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input type="text" value={session?.user?.email || ""} disabled className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900" />
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Shield className="h-3 w-3 text-indigo-500" /> Administrative Access
                </p>
                <p className="text-[11px] text-indigo-700 font-bold opacity-70 leading-relaxed capitalize">
                  Your account has full administrative privileges. You can manage all modules, users, and financial reports across PNP CRM.
                </p>
              </div>
            </div>
          )}

          {activeTab !== "profile" && (
            <div className="flex h-full items-center justify-center flex-col gap-4 text-center">
              <div className="bg-slate-50 p-8 rounded-full"><SettingsIcon className="h-12 w-12 text-slate-200" /></div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Configuration Locked</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Module under development for system security.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
