"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Loader2, Phone, Briefcase, Search, Trash2 } from "lucide-react";
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

interface AddQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess: () => void;
}

export default function AddQuotationModal({ isOpen, onClose, customerId, onSuccess }: AddQuotationModalProps) {
  const [step, setStep] = useState<"FIELD" | "VENDOR" | "AMOUNT">("FIELD");
  const [fields, setFields] = useState<Field[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [amount, setAmount] = useState("");

  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  
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

  useEffect(() => {
    if (isOpen) {
      fetchFields();
    }
  }, [isOpen]);

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
    setIsLoading(true);
    try {
      const res = await fetch(`/api/vendors?field_id=${fieldId}`);
      const data = await res.json();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFieldName }),
      });
      const newField = await res.json();
      setFields([...fields, newField]);
      setSelectedField(newField);
      setIsAddingField(false);
      setNewFieldName("");
      fetchVendors(newField.id);
      setStep("VENDOR");
    } catch (error) {
      console.error("Error adding field:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVendor = async () => {
    const validContacts = newContactsList.filter(c => c.phone.trim().length === 10);
    if (!newVendorName.trim() || newVendorPhone.trim().length !== 10 || !selectedField) return;
    
    const allContacts = [{ name: "", phone: newVendorPhone }, ...validContacts];
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fieldId: selectedField.id, 
          name: newVendorName,
          contacts: allContacts 
        }),
      });
      if (res.ok) {
        await fetchVendors(selectedField.id);
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

  const handleSaveQuotation = async () => {
    if (!selectedField || !selectedVendor || !amount) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/project-quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          fieldId: selectedField.id,
          vendorId: selectedVendor.id,
          amount: parseFloat(amount)
        }),
      });
      if (res.ok) {
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error("Error saving quotation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("FIELD");
    setSelectedField(null);
    setSelectedVendor(null);
    setAmount("");
    setIsAddingVendor(false);
    setNewVendorName("");
    setNewVendorPhone("");
    setNewContactsList([]);
    setVendorSearchQuery("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Quotation</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Step {step === "FIELD" ? "1" : step === "VENDOR" ? "2" : "3"} of 3</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {/* STEP A: FIELD SELECTION */}
          {step === "FIELD" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Select Work Field</label>
              
              {!isAddingField ? (
                <div className="space-y-4">
                  <select 
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={selectedField?.id || ""}
                    onChange={(e) => {
                      const field = fields.find(f => f.id === e.target.value);
                      if (field) {
                        setSelectedField(field);
                        fetchVendors(field.id);
                        setStep("VENDOR");
                      }
                    }}
                  >
                    <option value="" disabled>Choose a field...</option>
                    {fields.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={() => setIsAddingField(true)}
                    className="flex items-center gap-2 text-emerald-600 text-xs font-bold hover:text-emerald-700 transition-colors pl-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> ADD NEW FIELD DIRECTLY
                  </button>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <input 
                    autoFocus
                    placeholder="Field Name (e.g. Electrical)"
                    className="w-full rounded-lg border border-emerald-200 p-2.5 text-sm focus:border-emerald-500 outline-none"
                    value={newFieldName}
                    onChange={e => setNewFieldName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddField}
                      disabled={isLoading}
                      className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "SAVE & CONTINUE"}
                    </button>
                    <button 
                      onClick={() => setIsAddingField(false)}
                      className="px-4 border border-slate-200 bg-white text-slate-500 rounded-lg py-2 text-xs font-bold"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP B: VENDOR SELECTION */}
          {step === "VENDOR" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Vendors for {selectedField?.name}
                </label>
                <button onClick={() => setStep("FIELD")} className="text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase underline">Change Field</button>
              </div>

              {!isAddingVendor ? (
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
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                    {filteredVendors.length === 0 && !isLoading && (
                      <p className="text-center py-8 text-xs text-slate-400 italic">No vendors found.</p>
                    )}
                    {filteredVendors.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVendor(v);
                          setStep("AMOUNT");
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                          selectedVendor?.id === v.id 
                            ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500" 
                            : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50"
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{v.name}</p>
                          <div className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {v.phone}</span>
                            {v.contacts?.map((c, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {c.phone} {c.name && <span className="text-[10px] text-slate-300">({c.name})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                        {selectedVendor?.id === v.id && (
                          <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setIsAddingVendor(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> ADD NEW VENDOR
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
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
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "SAVE VENDOR"}
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

          {/* STEP C: AMOUNT INPUT */}
          {step === "AMOUNT" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedField?.name}</p>
                    <p className="text-sm font-bold text-slate-900">{selectedVendor?.name}</p>
                  </div>
                </div>
                <button onClick={() => setStep("VENDOR")} className="text-[10px] font-black text-emerald-600 hover:underline uppercase">Edit</button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Quotation Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold">₹</span>
                  </div>
                  <input 
                    type="number"
                    autoFocus
                    placeholder="e.g. 20,000"
                    className="w-full rounded-xl border border-slate-200 py-4 pl-10 pr-4 text-xl font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleSaveQuotation}
                  disabled={isLoading || !amount}
                  className="flex-[2] px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "SAVE QUOTATION"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
