"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  User, Shield, Smartphone, LogOut, Loader2, Save, 
  Key, Globe, Clock, Monitor, RefreshCcw, AlertCircle,
  Zap, Check, Settings as SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile States
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  // Security States
  const [sessionTimeout, setSessionTimeout] = useState(2592000);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // System States (WhatsApp Dispatch)
  const [dispatchNumber, setDispatchNumber] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setProfileForm(prev => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || "",
      }));
    }
    fetchSessions();
    fetchSettings();
  }, [session]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/settings/sessions");
      const data = await res.json();
      if (Array.isArray(data)) setActiveSessions(data);
    } catch (err) { console.error(err); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.sessionMaxAge) setSessionTimeout(data.sessionMaxAge);
      if (data.whatsappDispatchNumber) setDispatchNumber(data.whatsappDispatchNumber);
    } catch (err) { console.error(err); }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profileForm, type: "profile" }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        update({ name: profileForm.name, email: profileForm.email });
        setProfileForm(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
      } else {
        setMessage({ type: "error", text: data.error || "Update failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Connection error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "security", sessionMaxAge: sessionTimeout }),
      });
      if (res.ok) setMessage({ type: "success", text: "Session settings updated!" });
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleSystemSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "system", whatsappDispatchNumber: dispatchNumber }),
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const terminateSession = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/sessions?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchSessions();
    } catch (err) { console.error(err); }
  };

  const terminateAllOthers = async () => {
    if (!confirm("Are you sure you want to log out all other devices?")) return;
    try {
      const res = await fetch(`/api/settings/sessions?all=true`, { method: "DELETE" });
      if (res.ok) fetchSessions();
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: "profile", label: "Identity Profile", icon: User },
    { id: "system", label: "System Config", icon: SettingsIcon },
    { id: "security", label: "Advanced Security", icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-5 -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage your identity, active sessions, and global security policies.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {message.text && (
            <div className={cn(
              "p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
              message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
            )}>
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Profile Credentials
                </h2>
              </div>
              <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-amber-500" /> Change Password
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                        value={profileForm.currentPassword}
                        onChange={e => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                        value={profileForm.newPassword}
                        onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "system" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-600" /> System Configuration
                </h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                       <Zap className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">WhatsApp Lead Dispatch</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Communication Gateway</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Dispatch Target Number</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="e.g. 8799544606"
                        className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold focus:border-primary outline-none transition-all"
                        value={dispatchNumber}
                        onChange={(e) => setDispatchNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                      <button 
                        onClick={handleSystemSave}
                        className={cn(
                          "px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm border",
                          isSaved 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                            : "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700 active:scale-95"
                        )}
                      >
                        {isSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                        {isSaved ? "Saved" : "Save Changes"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 italic mt-2 leading-relaxed">
                      If set, clicking the WhatsApp button on a Lead page will forward the lead's contact info directly to this number instead of the customer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              {/* Session Timeout */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" /> Session Expiration
                  </h2>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-md">
                      <p className="text-sm font-semibold text-slate-900">Configurable Timeout</p>
                      <p className="text-xs text-slate-500 mt-1">Define how long a user session remains active before requiring re-authentication.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select 
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                        value={sessionTimeout}
                        onChange={e => setSessionTimeout(parseInt(e.target.value))}
                        disabled={session?.user?.role !== "ADMIN"}
                      >
                        <option value={300}>5 Minutes</option>
                        <option value={3600}>1 Hour</option>
                        <option value={86400}>24 Hours</option>
                        <option value={604800}>7 Days</option>
                        <option value={2592000}>30 Days</option>
                      </select>
                      {session?.user?.role === "ADMIN" && (
                         <button 
                          onClick={handleSecuritySubmit}
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                         >
                            <Save className="h-4 w-4" />
                         </button>
                      )}
                    </div>
                  </div>
                  {session?.user?.role !== "ADMIN" && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                      <AlertCircle className="h-3.5 w-3.5" /> Only administrators can modify global timeout policies.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Devices */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-emerald-600" /> Logged Devices
                  </h2>
                  <button 
                    onClick={terminateAllOthers}
                    className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  >
                    Logout All Others
                  </button>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-3">
                    {activeSessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center border transition-all",
                            s.sessionToken === session?.sessionToken ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-100" : "bg-white text-slate-400 border-slate-100"
                          )}>
                            {s.userAgent?.includes("Mobile") ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{s.userAgent || "Unknown Device"}</p>
                              {s.sessionToken === session?.sessionToken && (
                                <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-bold rounded-md uppercase tracking-widest">Current</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide">
                              Last active: {format(new Date(s.lastActive), "MMM dd, hh:mm a")} • {s.ipAddress || "Active IP"}
                            </p>
                          </div>
                        </div>
                        {s.sessionToken !== session?.sessionToken && (
                          <button 
                            onClick={() => terminateSession(s.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {activeSessions.length === 0 && (
                      <div className="py-12 text-center text-slate-400 font-medium text-xs">No session data synchronized.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
