"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Check, X, Phone, Search, Pencil, Trash2, Wrench } from "lucide-react";

export default function SuppliersPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [vendorSearch, setVendorSearch] = useState("");
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editingVendor, setEditingVendor] = useState({ name: "", phone: "" });

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [vendorForm, setVendorForm] = useState({ fieldId: "", name: "", phone: "" });
  const [newContactsList, setNewContactsList] = useState<{name: string, phone: string}[]>([]);
  const [isVendorSaving, setIsVendorSaving] = useState(false);

  useEffect(() => { fetchVendors(); }, []);

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
    const validContacts = newContactsList.filter(c => c.phone.trim().length === 10);
    if (!vendorForm.fieldId || !vendorForm.name.trim() || vendorForm.phone.trim().length !== 10) return;
    
    const allContacts = [{ name: "", phone: vendorForm.phone }, ...validContacts];
    
    setIsVendorSaving(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: vendorForm.fieldId,
          name: vendorForm.name,
          contacts: allContacts
        }),
      });
      if (res.ok) {
        setIsVendorModalOpen(false);
        setVendorForm({ fieldId: "", name: "", phone: "" });
        setNewContactsList([]);
        fetchVendors();
      }
    } catch (error) { console.error(error); }
    finally { setIsVendorSaving(false); }
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

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.phone.includes(vendorSearch) ||
    v.field?.name?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.contacts?.some((c: any) => c.phone.includes(vendorSearch) || (c.name && c.name.toLowerCase().includes(vendorSearch.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Vendor Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage project vendors and specialized service providers.</p>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => { setIsVendorModalOpen(true); fetchFields(); }}
            className="bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md"
          >
            <Plus className="h-4 w-4" /> Add New Vendor
          </button>
        </div>
      </div>

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
                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Numbers</th>
                <th className="py-4 pr-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Wrench className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-sm font-bold text-slate-900">No project vendors found</h3>
                    <p className="text-xs text-slate-400 mt-1">Add vendors through the customer quotation flow or here.</p>
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
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
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
                      <div className="flex flex-col gap-1">
                        <a href={`tel:${vendor.phone}`} className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                          <Phone className="h-3 w-3 text-slate-300" />{vendor.phone}
                        </a>
                        {vendor.contacts?.map((c: any, i: number) => (
                          <a key={i} href={`tel:${c.phone}`} className="text-xs font-medium text-slate-500 flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                            <Phone className="h-3 w-3 text-slate-200" />{c.phone} {c.name && <span className="text-[10px] text-slate-400">({c.name})</span>}
                          </a>
                        ))}
                      </div>
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

      {/* Add Project Vendor Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Add Project Vendor</h2>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Link vendor to a work field</p>
              </div>
              <button
                onClick={() => { setIsVendorModalOpen(false); setVendorForm({ fieldId: "", name: "", phone: "" }); setNewContactsList([]); }}
                className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddProjectVendor} className="p-8 space-y-6">
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
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Company / Vendor Name *</label>
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

              {newContactsList.length > 0 && (
                <div className="space-y-4 max-h-[260px] overflow-y-auto overflow-x-hidden px-1 pr-4 pb-4 mt-6 border-t border-slate-100 pt-6">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 block">Additional Contacts</label>
                  {newContactsList.map((contact, index) => (
                    <div key={index} className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 relative group mt-2">
                      <button 
                        type="button"
                        onClick={() => setNewContactsList(newContactsList.filter((_, i) => i !== index))}
                        className="absolute -top-2.5 -right-2.5 h-7 w-7 bg-white border border-rose-200 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm z-10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Person Name (Optional)</label>
                          <input 
                            placeholder="e.g. John Doe"
                            className={inputCls}
                            value={contact.name}
                            onChange={e => {
                              const newList = [...newContactsList];
                              newList[index].name = e.target.value;
                              setNewContactsList(newList);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Phone Number *</label>
                          <input 
                            type="tel"
                            maxLength={10}
                            placeholder="10 digit number"
                            className={inputCls}
                            value={contact.phone}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 10) {
                                const newList = [...newContactsList];
                                newList[index].phone = val;
                                setNewContactsList(newList);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {newContactsList.length < 9 && (
                <button 
                  type="button"
                  onClick={() => setNewContactsList([...newContactsList, { name: "", phone: "" }])}
                  className="w-full py-3 border border-dashed border-emerald-300 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Plus className="h-4 w-4" /> ADD ANOTHER CONTACT
                </button>
              )}

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsVendorModalOpen(false); setVendorForm({ fieldId: "", name: "", phone: "" }); setNewContactsList([]); }}
                  className="text-slate-400 font-semibold text-sm hover:text-rose-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVendorSaving || vendorForm.phone.length !== 10}
                  className="bg-emerald-600 hover:bg-emerald-700 px-8 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 text-sm transition-all active:scale-95 shadow-md disabled:opacity-50"
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

const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 px-4 text-slate-900 font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm";
