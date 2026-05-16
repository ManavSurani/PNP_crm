"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  User, Shield, Smartphone, LogOut, Loader2, Save, 
  Key, Globe, Clock, Monitor, RefreshCcw, AlertCircle,
  Zap, Check, Settings as SettingsIcon, Database, Lock,
  Trash2, MoreHorizontal, ExternalLink, AlertTriangle, Search, Filter, RotateCcw, Activity, MapPin, ChevronRight, Phone
} from "lucide-react";
import PinModal from "@/components/analytics/PinModal";
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
  const [originalDispatchNumber, setOriginalDispatchNumber] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Backup & Restore States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Analytics PIN States
  const [isAnalyticsPinEnabled, setIsAnalyticsPinEnabled] = useState(false);
  const [hasPinSetup, setHasPinSetup] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"verify" | "setup" | "confirm">("verify");
  const [pinError, setPinError] = useState("");
  const [tempPin, setTempPin] = useState("");
  const [verifiedCurrentPin, setVerifiedCurrentPin] = useState("");

  // Customer Clean Up States
  const [customers, setCustomers] = useState<any[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleanupUnlocked, setIsCleanupUnlocked] = useState(false);
  const [pinPurpose, setPinPurpose] = useState<"configure" | "unlock">("configure");

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
    
    // Reset cleanup unlock when switching tabs
    if (activeTab !== "customer-cleanup") {
      setIsCleanupUnlocked(false);
    }

    if (activeTab === "customer-cleanup") {
      fetchCustomers();
    }
  }, [session, activeTab]);

  const fetchCustomers = async () => {
    setIsCustomersLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) { console.error(err); }
    finally { setIsCustomersLoading(false); }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${permanentDeleteId}?permanent=true`, { method: "DELETE" });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== permanentDeleteId));
        setPermanentDeleteId(null);
        setMessage({ type: "success", text: "Customer permanently deleted" });
      }
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

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
      if (data.whatsappDispatchNumber) {
        setDispatchNumber(data.whatsappDispatchNumber);
        setOriginalDispatchNumber(data.whatsappDispatchNumber);
      }
      setIsAnalyticsPinEnabled(data.isAnalyticsPinEnabled);
      setHasPinSetup(!!data.analyticsPin);
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
        setOriginalDispatchNumber(dispatchNumber);
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

  const handleTogglePinProtection = async (enabled: boolean) => {
    if (enabled && !hasPinSetup) {
      setPinModalMode("setup");
      setShowPinModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analytics-security", isAnalyticsPinEnabled: enabled }),
      });
      if (res.ok) {
        setIsAnalyticsPinEnabled(enabled);
        setMessage({ type: "success", text: `PIN Protection ${enabled ? "enabled" : "disabled"}` });
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handlePinModalSuccess = async (pin: string) => {
    setPinError("");
    
    if (pinPurpose === "unlock") {
      setIsLoading(true);
      try {
        const res = await fetch("/api/analytics/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });
        if (res.ok) {
          setIsCleanupUnlocked(true);
          setShowPinModal(false);
          setPinPurpose("configure"); // Reset for next use
        } else {
          setPinError("Incorrect PIN");
        }
      } catch (e) { setPinError("Connection error"); }
      finally { setIsLoading(false); }
      return;
    }

    if (pinModalMode === "verify") {
      // Verify current PIN before allowing change
      setIsLoading(true);
      try {
        const res = await fetch("/api/analytics/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });
        if (res.ok) {
          setVerifiedCurrentPin(pin);
          setPinModalMode("setup");
        } else {
          setPinError("Current PIN is incorrect");
        }
      } catch (e) { setPinError("Connection error"); }
      finally { setIsLoading(false); }
      return;
    }

    if (pinModalMode === "setup") {
      setTempPin(pin);
      setPinModalMode("confirm");
      return;
    }

    if (pinModalMode === "confirm") {
      if (pin !== tempPin) {
        setPinError("PINs do not match");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            type: "analytics-security", 
            pin, 
            currentPin: verifiedCurrentPin 
          }),
        });
        if (res.ok) {
          setMessage({ type: "success", text: hasPinSetup ? "Security PIN updated successfully" : "Security PIN configured" });
          setHasPinSetup(true);
          setIsAnalyticsPinEnabled(true);
          setShowPinModal(false);
          setVerifiedCurrentPin("");
        } else {
          setPinError("Failed to save PIN");
        }
      } catch (e) { setPinError("Connection error"); }
      finally { setIsLoading(false); }
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await fetch("/api/settings/backup");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Backup failed");
      }
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") ?? "";
      const fileNameMatch = contentDisposition.match(/filename="(.+?)"/);
      const fileName = fileNameMatch?.[1] ?? "PNP-CRM-Backup.pnpcrm";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Backup created successfully" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Failed to create backup" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setShowRestoreModal(false);
    setMessage({ type: "", text: "" });
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/settings/restore", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Backup restored successfully. Refreshing..." });
        // Delay reload to allow Prisma to settle
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Restore failed" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Connection error during restore" });
    } finally {
      // Don't stop loading if success, let it reload
    }
  };

  const tabs = [
    { id: "profile", label: "Identity Profile", icon: User },
    { id: "system", label: "System Config", icon: SettingsIcon },
    { id: "security", label: "Advanced Security", icon: Shield },
    { id: "customer-cleanup", label: "Customer Clean Up", icon: Trash2 },
    { id: "backup", label: "Backup & Restore", icon: Database },
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
                      <p className="text-sm font-bold text-slate-900">Recovery &amp; WhatsApp Dispatch Number</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Password Recovery + Communication Gateway</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="e.g. 8799544606"
                        className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold focus:border-primary outline-none transition-all"
                        value={dispatchNumber}
                        onChange={(e) => {
                          setDispatchNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                        }}
                      />
                      {dispatchNumber === originalDispatchNumber && originalDispatchNumber !== "" ? (
                        <div className="px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                          <Check className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Saved</span>
                        </div>
                      ) : (
                        <button 
                          onClick={handleSystemSave}
                          disabled={isLoading || (originalDispatchNumber !== "" && dispatchNumber === originalDispatchNumber)}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100 border border-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          {originalDispatchNumber === "" ? "Save" : "Save Changes"}
                        </button>
                      )}
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg space-y-1.5">
                      <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">How this number is used</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed">
                        <span className="font-bold">🔑 Forgot Password:</span> On the Login page, clicking "Forgot Password?" asks for this number to verify identity before allowing a password reset. Set this first, otherwise password recovery will not work.
                      </p>
                      <p className="text-[10px] text-amber-700 leading-relaxed">
                        <span className="font-bold">💬 WhatsApp Dispatch:</span> Clicking the WhatsApp button on a Lead page forwards the lead's contact to this number.
                      </p>
                    </div>
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

              {/* Analytics PIN Security */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" /> Business Analytics Security
                  </h2>
                </div>
                <div className="p-8 space-y-6">
                   <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">PIN Protection</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-xs uppercase tracking-wider">
                          Require a 4-digit PIN to access Business Analytics.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {hasPinSetup && (
                          <button 
                            onClick={() => {
                              setPinModalMode("verify");
                              setPinPurpose("configure");
                              setShowPinModal(true);
                            }}
                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                          >
                            Change PIN
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!isAnalyticsPinEnabled && !hasPinSetup) {
                              setPinPurpose("configure");
                            }
                            handleTogglePinProtection(!isAnalyticsPinEnabled);
                          }}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            isAnalyticsPinEnabled ? "bg-primary" : "bg-slate-200"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            isAnalyticsPinEnabled ? "translate-x-5" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>

          )}

          {activeTab === "backup" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" /> Backup & Restore
                </h2>
                <p className="text-slate-500 text-[10px] font-medium mt-1 uppercase tracking-wider">Securely export and restore your PNP CRM database and configuration.</p>
              </div>
              
              <div className="p-8 space-y-10">
                {/* Create Backup Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      CREATE SECURE BACKUP
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Export all CRM business data into an encrypted restore file.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">BACKUP FORMAT</label>
                      <input
                        type="text"
                        readOnly
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-500"
                        value="Encrypted .pnpcrm File"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">INCLUDED DATA</label>
                      <input
                        type="text"
                        readOnly
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-500"
                        value="Customers, Leads, Projects, Payments, Analytics"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleCreateBackup}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 min-w-[160px] justify-center"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isLoading ? "Creating Backup..." : "Create Backup"}
                    </button>
                  </div>
                </div>
                
                <div className="border-t border-slate-100" />
                
                {/* Restore Backup Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      RESTORE BACKUP
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Import and restore a previously exported PNP CRM backup.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative group">
                      <input
                        type="file"
                        accept=".pnpcrm"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="backup-upload"
                      />
                      <label
                        htmlFor="backup-upload"
                        className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium cursor-pointer hover:border-primary transition-all group"
                      >
                        <span className="text-slate-500">{selectedFile ? selectedFile.name : "No backup file selected"}</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-3 py-1 bg-primary/5 rounded-lg">Select File</span>
                      </label>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => setShowRestoreModal(true)}
                        disabled={!selectedFile || isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 min-w-[160px] justify-center"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        Import Backup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "customer-cleanup" && (
            isAnalyticsPinEnabled && !isCleanupUnlocked ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                 <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl rotate-3">
                    <Lock className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-base font-bold text-slate-900 uppercase tracking-widest">Access Restricted</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 mb-8 max-w-xs text-center leading-relaxed">
                   Security PIN verification required to access customer cleanup tools.
                 </p>
                 <button 
                   onClick={() => {
                      setPinModalMode("verify");
                      setPinPurpose("unlock");
                      setShowPinModal(true);
                   }}
                   className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 active:scale-95 transition-all flex items-center gap-2"
                 >
                   <Shield className="h-4 w-4" /> Unlock Tab
                 </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Permanent Data Removal</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Purge customer records and associated history</p>
                    </div>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search customers..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:bg-white focus:border-rose-300 outline-none transition-all"
                      value={customerSearchTerm}
                      onChange={e => setCustomerSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto min-h-[400px]">
                  {isCustomersLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-3" />
                      <span className="text-xs font-bold uppercase tracking-widest">Scanning Directory...</span>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/30">
                        <tr>
                          <th className="py-4 pl-8 pr-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Profile</th>
                          <th className="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service</th>
                          <th className="px-3 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Handler</th>
                          <th className="relative py-4 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {customers.filter(c => 
                          c.customerName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                          c.contactNumber.includes(customerSearchTerm)
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center">
                              <Activity className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching customers identified</p>
                            </td>
                          </tr>
                        ) : (
                          customers.filter(c => 
                            c.customerName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                            c.contactNumber.includes(customerSearchTerm)
                          ).map((customer) => {
                            const displayName = customer.project?.name || customer.customerName;
                            return (
                              <tr key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="whitespace-nowrap py-4 pl-8 pr-3">
                                  <div className="flex items-center">
                                    <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-xs">
                                      {displayName.charAt(0)}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                        {displayName}
                                        {customer.project?.name && (
                                          <span className="px-1 py-0.5 bg-slate-100 text-[8px] font-black text-slate-400 rounded uppercase tracking-tighter border border-slate-200">Project</span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                        <Phone className="h-2.5 w-2.5" /> {customer.contactNumber}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4">
                                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                                    <Zap className="h-3 w-3 text-amber-500" />
                                    {customer.serviceType.replace("_", " ")}
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-1 truncate max-w-[120px]">
                                    <MapPin className="h-2.5 w-2.5" /> {customer.fullAddress || "No address"}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4">
                                  <div className="text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center border border-white">
                                      <User className="h-2.5 w-2.5 text-slate-400" />
                                    </div>
                                    {customer.assignedStaff?.name || "Internal"}
                                  </div>
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-8 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button 
                                      onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                                      className={cn(
                                        "p-2 rounded-lg transition-all",
                                        openMenuId === customer.id ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 shadow-sm"
                                      )}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                    
                                    {openMenuId === customer.id && (
                                      <>
                                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white text-slate-900 shadow-xl border border-slate-200 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                          <div className="p-1">
                                            <button 
                                              onClick={() => { window.open(`/customers/${customer.id}`, '_blank'); setOpenMenuId(null); }}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors text-left"
                                            >
                                              <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> View Profile
                                            </button>
                                            <div className="h-px bg-slate-100 my-1" />
                                            <button 
                                              onClick={() => { setPermanentDeleteId(customer.id); setOpenMenuId(null); }}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-50 text-rose-600 rounded-lg transition-colors text-left"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" /> Delete Permanently
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-200 group-hover:text-rose-400 transition-all" />
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-6">
              <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Restore Backup?</h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              This action will replace all current CRM data, settings, and branding with the contents of the selected backup file. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                disabled={isLoading}
                onClick={() => setShowRestoreModal(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isLoading}
                onClick={handleRestoreBackup}
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Restoring..." : "Restore Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && activeTab === "backup" && selectedFile && !showRestoreModal && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <Database className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-6 tracking-tight">Restoring Backup...</h2>
          <p className="text-slate-500 text-sm mt-2">Please do not close this window.</p>
        </div>
      )}

      {showPinModal && (
        <PinModal
          title={pinModalMode === "verify" ? "Current Security PIN" : pinModalMode === "setup" ? "New Security PIN" : "Confirm New PIN"}
          subtitle={pinModalMode === "verify" ? "Enter your current PIN to continue." : pinModalMode === "setup" ? "Create a 4-digit security PIN." : "Re-enter your new PIN to confirm."}
          mode={pinModalMode}
          onSuccess={handlePinModalSuccess}
          onCancel={() => {
            setShowPinModal(false);
            setVerifiedCurrentPin("");
            setPinError("");
          }}
          isLoading={isLoading}
          error={pinError}
        />
      )}

      {/* Customer Permanent Delete Modal */}
      {permanentDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="bg-rose-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Erase Customer Data?</h3>
              <p className="mt-2 text-slate-500 font-medium leading-relaxed px-4 text-xs uppercase tracking-wider">
                This will permanently destroy this customer and all their associated projects, payments, and history. <span className="text-rose-600 font-black">THIS CANNOT BE UNDONE.</span>
              </p>
              <div className="mt-8 flex flex-col gap-2">
                 <button 
                   disabled={isDeleting} 
                   onClick={handlePermanentDelete}
                   className="w-full bg-rose-600 hover:bg-rose-700 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
                 >
                   {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                   Confirm Destruction
                 </button>
                 <button 
                   onClick={() => setPermanentDeleteId(null)}
                   className="w-full bg-slate-50 hover:bg-slate-100 py-3.5 rounded-xl text-slate-500 font-bold text-xs uppercase tracking-widest transition-colors"
                 >
                   Cancel
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
