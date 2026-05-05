"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Loader2, Phone, Pencil, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
  phone: string;
  contacts?: { name: string | null; phone: string }[];
}

interface Quotation {
  id: string;
  amount: number;
  field: { id?: string; name: string };
  vendor: { id?: string; name: string; phone: string };
  fieldId: string;
  vendorId: string;
}

interface EditQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onSuccess: () => void;
}

export default function EditQuotationModal({ isOpen, onClose, quotation, onSuccess }: EditQuotationModalProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingVendors, setIsFetchingVendors] = useState(false);

  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [amount, setAmount] = useState("");

  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newContactsList, setNewContactsList] = useState<{name: string, phone: string}[]>([]);

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()) || 
    v.phone.includes(vendorSearchQuery) ||
    v.contacts?.some(c => c.phone.includes(vendorSearchQuery) || (c.name && c.name.toLowerCase().includes(vendorSearchQuery.toLowerCase())))
  );

  // Populate from existing quotation when modal opens
  useEffect(() => {
    if (isOpen && quotation) {
      setSelectedFieldId(quotation.fieldId);
      setSelectedVendorId(quotation.vendorId);
      setAmount(String(quotation.amount));
      fetchFields();
      fetchVendors(quotation.fieldId);
    }
  }, [isOpen, quotation]);

  const fetchFields = async () => {
    try {
      const res = await fetch("/api/fields");
      const data = await res.json();
      setFields(data);
    } catch (error) {
      console.error("Error fetching fields:", error);
    }
  };

  const fetchVendors = async (fieldId: string) => {
    setIsFetchingVendors(true);
    try {
      const res = await fetch(`/api/vendors?field_id=${fieldId}`);
      const data = await res.json();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setIsFetchingVendors(false);
    }
  };

  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedVendorId(""); // reset vendor when field changes
    fetchVendors(fieldId);
  };

  const handleAddVendor = async () => {
    const validContacts = newContactsList.filter(c => c.phone.trim().length === 10);
    if (!newVendorName.trim() || newVendorPhone.trim().length !== 10 || !selectedFieldId) return;
    
    const allContacts = [{ name: "", phone: newVendorPhone }, ...validContacts];
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: selectedFieldId,
          name: newVendorName,
          contacts: allContacts,
        }),
      });
      if (res.ok) {
        await fetchVendors(selectedFieldId);
        setIsAddingVendor(false);
        setNewVendorName("");
        setNewVendorPhone("");
        setNewContactsList([]);
        setVendorSearchQuery("");
      }
    } catch (error) {
      console.error("Error adding vendor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quotation || !selectedFieldId || !selectedVendorId || !amount) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/project-quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: selectedFieldId,
          vendorId: selectedVendorId,
          amount: parseFloat(amount),
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error saving quotation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsAddingVendor(false);
    setNewVendorName("");
    setNewVendorPhone("");
    setNewContactsList([]);
    setVendorSearchQuery("");
    onClose();
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  if (!isOpen || !quotation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Quotation</h2>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                {quotation.field.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Field Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Work Field
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={selectedFieldId}
              onChange={(e) => handleFieldChange(e.target.value)}
            >
              <option value="" disabled>
                Choose a field...
              </option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Selection */}
          {selectedFieldId && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Vendor{selectedField ? ` — ${selectedField.name}` : ""}
              </label>

              {isFetchingVendors ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Search vendors..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={vendorSearchQuery}
                      onChange={e => setVendorSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                    {filteredVendors.length === 0 && !isAddingVendor && (
                      <p className="text-center py-6 text-xs text-slate-400 italic">
                        No vendors found.
                      </p>
                    )}
                    {filteredVendors.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVendorId(v.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group",
                          selectedVendorId === v.id
                            ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                            : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50"
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {v.name}
                          </p>
                          <div className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {v.phone}</span>
                            {v.contacts?.map((c, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {c.phone} {c.name && <span className="text-[10px] text-slate-300">({c.name})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                        {selectedVendorId === v.id && (
                          <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {!isAddingVendor ? (
                    <button
                      onClick={() => setIsAddingVendor(true)}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" /> ADD NEW VENDOR
                    </button>
                  ) : (
                    <div className="space-y-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider ml-1 mb-1 block">Company / Vendor Name <span className="text-rose-500">*</span></label>
                          <input 
                            autoFocus
                            placeholder="e.g. PNP Enterprises"
                            className="w-full rounded-lg border border-emerald-200 p-2.5 text-sm focus:border-emerald-500 outline-none"
                            value={newVendorName}
                            onChange={e => setNewVendorName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider ml-1 mb-1 block">Phone Number <span className="text-rose-500">*</span></label>
                          <input 
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit number"
                            className="w-full rounded-lg border border-emerald-200 p-2.5 text-sm focus:border-emerald-500 outline-none"
                            value={newVendorPhone}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 10) setNewVendorPhone(val);
                            }}
                          />
                        </div>
                      </div>
                      
                      {newContactsList.length > 0 && (
                        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1 mt-4 border-t border-emerald-100/50 pt-4">
                          <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider ml-1 block">Additional Contacts</label>
                          {newContactsList.map((contact, index) => (
                            <div key={index} className="space-y-3 p-3 bg-white rounded-lg border border-emerald-100 relative group">
                              <button 
                                onClick={() => setNewContactsList(newContactsList.filter((_, i) => i !== index))}
                                className="absolute -top-2 -right-2 h-6 w-6 bg-white border border-rose-200 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm z-10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Person Name (Optional)</label>
                                <input 
                                  placeholder="e.g. John Doe"
                                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-emerald-500 outline-none"
                                  value={contact.name}
                                  onChange={e => {
                                    const newList = [...newContactsList];
                                    newList[index].name = e.target.value;
                                    setNewContactsList(newList);
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider ml-1 mb-1 block">Phone Number <span className="text-rose-500">*</span></label>
                                <input 
                                  type="tel"
                                  maxLength={10}
                                  placeholder="10-digit number"
                                  className="w-full rounded-lg border border-emerald-200 p-2 text-sm focus:border-emerald-500 outline-none"
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
                          ))}
                        </div>
                      )}
                      
                      {newContactsList.length < 9 && (
                        <button 
                          onClick={() => setNewContactsList([...newContactsList, { name: "", phone: "" }])}
                          className="w-full py-2 border border-dashed border-emerald-300 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 mt-2"
                        >
                          <Plus className="h-3.5 w-3.5" /> ADD ANOTHER CONTACT
                        </button>
                      )}
                      
                      <div className="flex gap-2 pt-2 border-t border-emerald-100 mt-4">
                        <button
                          onClick={handleAddVendor}
                          disabled={isLoading || !newVendorName.trim() || newVendorPhone.length !== 10}
                          className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                          ) : (
                            "SAVE VENDOR"
                          )}
                        </button>
                        <button
                          onClick={() => setIsAddingVendor(false)}
                          className="px-4 border border-slate-200 bg-white text-slate-500 rounded-lg py-2 text-xs font-bold hover:bg-slate-50 transition-colors"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Amount Input */}
          {selectedVendorId && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Quotation Amount (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold">₹</span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 20,000"
                  className="w-full rounded-xl border border-slate-200 py-4 pl-10 pr-4 text-xl font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !selectedFieldId || !selectedVendorId || !amount}
            className="flex-[2] px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" /> SAVE CHANGES
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
