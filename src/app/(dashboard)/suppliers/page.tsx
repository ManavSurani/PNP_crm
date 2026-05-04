"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, Loader2, Check, X, Phone, MapPin, Building2, User, ShieldCheck, Search, RotateCcw, Filter, Pencil, Trash2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "SUPPLIERS" | "PROJECT_VENDORS";

export default function SuppliersPage() {
  const [tab, setTab] = useState<TabType>("SUPPLIERS");

  // ── Suppliers ─────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("NEWEST");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", gstNumber: "", address: "" });

  // ── Project Vendors ───────────────────────────────────────
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [vendorSearch, setVendorSearch] = useState("");
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editingVendor, setEditingVendor] = useState({ name: "", phone: "" });

  // ── Add Project Vendor Modal ───────────────────────────────
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [vendorForm, setVendorForm] = useState({ fieldId: "", name: "", phone: "" });
  const [isVendorSaving, setIsVendorSaving] = useState(false);

  useEffect(() => { fetchSuppliers(); }, []);
  useEffect(() => { if (tab === "PROJECT_VENDORS" && vendors.length === 0) fetchVendors(); }, [tab]);

  const fetchSuppliers = async () => {
    setIsLoadingSuppliers(true);
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) setSuppliers(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoadingSuppliers(false); }
  };

  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) setVendors(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoadingVendors(false); }
  };

  const fetchFields = async () => {
    try {
      const res = await fetch("/api/fields");
      if (res.ok) setFields(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleAddProjectVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.fieldId || !vendorForm.name || !vendorForm.phone) return;
    setIsVendorSaving(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm),
      });
      if (res.ok) {
        setIsVendorModalOpen(false);
        setVendorForm({ fieldId: "", name: "", phone: "" });
        fetchVendors();
      }
    } catch (error) { console.error(error); }
    finally { setIsVendorSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setIsModalOpen(false);
      setForm({ name: "", contactPerson: "", phone: "", gstNumber: "", address: "" });
      fetchSuppliers();
    } catch (error) { console.error(error); }
    finally { setIsSaving(false); }
  };

  const handleEditVendor = async (id: string) => {
    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingVendor),
      });
      if (res.ok) {
        setVendors(vendors.map((v) => v.id === id ? { ...v, ...editingVendor } : v));
        setEditingVendorId(null);
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteVendor = async (vendor: any) => {
    if (!confirm(`Delete vendor "${vendor.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, { method: "DELETE" });
      if (res.ok) setVendors(vendors.filter((v) => v.id !== vendor.id));
    } catch (error) { console.error(error); }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) || s.contactPerson?.toLowerCase().includes(q) || s.phone.includes(q);
    const sDate = new Date(s.createdAt);
    const matchesStart = !dateRange.start || sDate >= new Date(dateRange.start);
    const matchesEnd = !dateRange.end || sDate <= new Date(dateRange.end + "T23:59:59");
    return matchesSearch && matchesStart && matchesEnd;
  }).sort((a, b) => {
    if (sortBy === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "A-Z") return a.name.localeCompare(b.name);
    if (sortBy === "Z-A") return b.name.localeCompare(a.name);
    return 0;
  });

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.phone.includes(vendorSearch) ||
    v.field?.name?.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Vendor Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage material vendors, suppliers, and specialized service providers.</p>
        </div>
        {tab === "SUPPLIERS" && (
          <div className="relative z-10">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md"
            >
              <Plus className="h-4 w-4" /> Add New Vendor
            </button>
          </div>
        )}
        {tab === "PROJECT_VENDORS" && (
          <div className="relative z-10">
            <button
              onClick={() => { setIsVendorModalOpen(true); fetchFields(); }}
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md"
            >
              <Plus className="h-4 w-4" /> Add New Vendor
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: "SUPPLIERS", label: "Material Suppliers", icon: Truck },
          { key: "PROJECT_VENDORS", label: "Project Vendors", icon: Wrench },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
              tab === key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── SUPPLIERS TAB ─────────────────────────────────── */}
      {tab === "SUPPLIERS" && (
        <>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" className={inputCls + " pl-12"} placeholder="Search vendors by name, contact or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={cn("flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition shadow-sm", showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <Filter className="h-4 w-4" /> {showFilters ? "Hide Options" : "More Filters"}
            </button>
            <button onClick={() => { setSearch(""); setDateRange({ start: "", end: "" }); setSortBy("NEWEST"); }} className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Sort Directory</label>
                <select className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="NEWEST">Joined: Newest</option>
                  <option value="OLDEST">Joined: Oldest</option>
                  <option value="A-Z">Name: A-Z</option>
                  <option value="Z-A">Name: Z-A</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Registration From</label>
                <input type="date" className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Registration To</label>
                <input type="date" className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:border-primary outline-none" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Active Partners", val: suppliers.length, icon: Truck, color: "text-primary bg-indigo-50 border-indigo-100" },
              { label: "Verified GST", val: suppliers.filter((s) => s.gstNumber).length, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
              { label: "Operational Contacts", val: suppliers.filter((s) => s.phone).length, icon: Phone, color: "text-amber-600 bg-amber-50 border-amber-100" },
            ].map((card, i) => (
              <div key={i} className={cn("bg-white p-5 rounded-xl border shadow-sm flex gap-4 items-center", card.color)}>
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-white shadow-sm ring-1 ring-black/5">
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{card.label}</p>
                  <p className="text-lg font-bold mt-0.5 tracking-tight">{card.val}</p>
                </div>
              </div>
            ))}
          </div>

          {isLoadingSuppliers ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span className="text-sm font-medium">Syncing Vendor Directory...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSuppliers.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4 pl-7">
                    <div className="h-12 w-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-lg group-hover:text-primary group-hover:border-primary/20 transition-all">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{s.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <User className="h-3 w-3 text-slate-400" />
                        <p className="text-[11px] text-slate-500 font-medium truncate">{s.contactPerson || "Point of Contact Not Set"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contact</p>
                        {s.phone ? (
                          <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-primary">
                            <Phone className="h-3 w-3 text-slate-300" />{s.phone}
                          </a>
                        ) : <span className="text-xs text-slate-300 italic font-medium">N/A</span>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tax Identity</p>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-slate-300" />
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase", s.gstNumber ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-mono" : "bg-slate-100 text-slate-400 border-slate-200")}>
                            {s.gstNumber || "Unregistered"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 pt-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registered Address</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{s.address || "Corporate address not provided."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredSuppliers.length === 0 && (
                <div className="col-span-3 py-20 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <Truck className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-sm font-semibold text-slate-900">No vendors found</h3>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── PROJECT VENDORS TAB ───────────────────────────── */}
      {tab === "PROJECT_VENDORS" && (
        <>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className={inputCls + " pl-12"}
              placeholder="Search by name, phone or field..."
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
            />
          </div>

          {isLoadingVendors ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="py-4 pl-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Name</th>
                    <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Field / Category</th>
                    <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                    <th className="py-4 pr-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <Wrench className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-slate-900">No project vendors found</h3>
                        <p className="text-xs text-slate-400 mt-1">Add vendors through the customer quotation flow.</p>
                      </td>
                    </tr>
                  ) : filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 pl-6">
                        {editingVendorId === vendor.id ? (
                          <input
                            autoFocus
                            className="border border-emerald-300 rounded-lg px-3 py-2 text-sm font-bold focus:border-emerald-500 outline-none w-48"
                            value={editingVendor.name}
                            onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-sm">
                              {vendor.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{vendor.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">
                          {vendor.field?.name ?? "—"}
                        </span>
                      </td>
                      <td className="py-4">
                        {editingVendorId === vendor.id ? (
                          <input
                            type="tel"
                            maxLength={10}
                            className="border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 outline-none w-40"
                            value={editingVendor.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 10) setEditingVendor({ ...editingVendor, phone: val });
                            }}
                          />
                        ) : (
                          <a href={`tel:${vendor.phone}`} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                            <Phone className="h-3 w-3 text-slate-300" />{vendor.phone}
                          </a>
                        )}
                      </td>
                      <td className="py-4 pr-6 text-right">
                        {editingVendorId === vendor.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditVendor(vendor.id)} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingVendorId(null)} className="p-2 border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-100 transition-all">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingVendorId(vendor.id); setEditingVendor({ name: vendor.name, phone: vendor.phone }); }} className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteVendor(vendor)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Partner Registration</h2>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Onboarding new material vendor</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Entity Name *</label>
                <input required className={inputCls} placeholder="Legal company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-start-2">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Phone Number *</label>
                  <input required maxLength={10} className={inputCls} placeholder="10 digit number" value={form.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setForm({ ...form, phone: v }); }} />
                </div>
                <div className="col-start-1 row-start-1">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Key Contact Person</label>
                  <input className={inputCls} placeholder="Full Name" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">GST Identification (Optional)</label>
                <input className={cn(inputCls, "font-mono uppercase")} placeholder="27XXXXX..." value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Operational Address</label>
                <textarea rows={2} className={inputCls} placeholder="Warehouse or corporate HQ address..." value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-semibold text-sm hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Vendor Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Add Project Vendor</h2>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Link vendor to a work field</p>
              </div>
              <button
                onClick={() => { setIsVendorModalOpen(false); setVendorForm({ fieldId: "", name: "", phone: "" }); }}
                className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddProjectVendor} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Work Field *</label>
                <select
                  required
                  className={inputCls}
                  value={vendorForm.fieldId}
                  onChange={(e) => setVendorForm({ ...vendorForm, fieldId: e.target.value })}
                >
                  <option value="" disabled>Select a field...</option>
                  {fields.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Vendor Name *</label>
                  <input
                    required
                    className={inputCls}
                    placeholder="e.g. Ramesh Electricals"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Phone Number *</label>
                  <input
                    required
                    maxLength={10}
                    className={inputCls}
                    placeholder="10 digit number"
                    value={vendorForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setVendorForm({ ...vendorForm, phone: val });
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsVendorModalOpen(false); setVendorForm({ fieldId: "", name: "", phone: "" }); }}
                  className="text-slate-400 font-semibold text-sm hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVendorSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 px-8 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md"
                >
                  {isVendorSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Add Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 px-4 text-slate-900 font-medium placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm";
