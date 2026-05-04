"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Loader2, Phone, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
  phone: string;
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
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");

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
    if (!newVendorName.trim() || !newVendorPhone.trim() || !selectedFieldId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: selectedFieldId,
          name: newVendorName,
          phone: newVendorPhone,
        }),
      });
      const newVendor = await res.json();
      setVendors([...vendors, newVendor]);
      setSelectedVendorId(newVendor.id);
      setIsAddingVendor(false);
      setNewVendorName("");
      setNewVendorPhone("");
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
                <div className="space-y-2">
                  <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                    {vendors.length === 0 && !isAddingVendor && (
                      <p className="text-center py-6 text-xs text-slate-400 italic">
                        No vendors found for this field.
                      </p>
                    )}
                    {vendors.map((v) => (
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
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" /> {v.phone}
                          </p>
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
                    <div className="space-y-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider ml-1 mb-1 block">
                            Name
                          </label>
                          <input
                            autoFocus
                            placeholder="Vendor Name"
                            className="w-full rounded-lg border border-emerald-200 p-2.5 text-sm focus:border-emerald-500 outline-none"
                            value={newVendorName}
                            onChange={(e) => setNewVendorName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider ml-1 mb-1 block">
                            Phone
                          </label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-digit number"
                            className="w-full rounded-lg border border-emerald-200 p-2.5 text-sm focus:border-emerald-500 outline-none"
                            value={newVendorPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 10) setNewVendorPhone(val);
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddVendor}
                          disabled={isLoading}
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
                          className="px-4 border border-slate-200 bg-white text-slate-500 rounded-lg py-2 text-xs font-bold"
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
