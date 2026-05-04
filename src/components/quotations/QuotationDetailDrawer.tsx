"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Plus, Loader2, Calendar, CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  paidOn: string;
  note: string | null;
}

interface Quotation {
  id: string;
  amount: number;
  field: { name: string };
  vendor: { name: string; phone: string };
  payments: Payment[];
}

interface QuotationDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onUpdate: () => void;
}

export default function QuotationDetailDrawer({ isOpen, onClose, quotation, onUpdate }: QuotationDetailDrawerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentNote, setPaymentNote] = useState("");

  useEffect(() => {
    if (quotation) {
      setPayments(quotation.payments);
    }
  }, [quotation]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = (quotation?.amount || 0) - totalPaid;

  const handleAddPayment = async () => {
    if (!quotation || !paymentAmount || !paymentDate) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/project-quotations/${quotation.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paidOn: paymentDate,
          note: paymentNote
        }),
      });
      if (res.ok) {
        const newPayment = await res.json();
        setPayments([newPayment, ...payments]);
        setPaymentAmount("");
        setPaymentNote("");
        setIsAddingPayment(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Error adding payment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    try {
      const res = await fetch(`/api/project-payments/${paymentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPayments(payments.filter(p => p.id !== paymentId));
        onUpdate();
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  if (!isOpen || !quotation) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[110] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-[480px] bg-white z-[120] shadow-2xl transition-transform duration-500 ease-out transform flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quotation Details</p>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{quotation.field.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Section 1: Vendor Info */}
          <div className="p-8 space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <CreditCard className="h-20 w-20 text-slate-900" />
               </div>
               <div className="relative space-y-4">
                 <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Field & Vendor</span>
                 </div>
                 <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Field</p>
                      <p className="text-sm font-bold text-slate-900">{quotation.field.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Vendor</p>
                      <p className="text-sm font-bold text-slate-900">{quotation.vendor.name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {quotation.vendor.phone}
                      </p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Section 2: Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Quoted</p>
                <p className="text-sm font-black text-slate-900 mt-1">₹{quotation.amount.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm text-center">
                <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-tight">Total Paid</p>
                <p className="text-sm font-black text-emerald-600 mt-1">₹{totalPaid.toLocaleString("en-IN")}</p>
              </div>
              <div className={cn(
                "border rounded-xl p-4 shadow-sm text-center",
                pendingAmount > 0 ? "bg-amber-50/50 border-amber-100" : "bg-emerald-50 border-emerald-200"
              )}>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-tight",
                  pendingAmount > 0 ? "text-amber-600/60" : "text-emerald-600/60"
                )}>Pending</p>
                <p className={cn(
                  "text-sm font-black mt-1",
                  pendingAmount > 0 ? "text-amber-600" : "text-emerald-600"
                )}>₹{pendingAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Section 4: Add Payment Form */}
            <div className="pt-4">
              {!isAddingPayment ? (
                <button 
                  onClick={() => setIsAddingPayment(true)}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus className="h-4 w-4 group-hover:scale-125 transition-transform" /> RECORD NEW PAYMENT
                </button>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest">New Payment Entry</h4>
                    <button onClick={() => setIsAddingPayment(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">Amount (₹)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-[10px] font-bold text-emerald-400">₹</span>
                        </div>
                        <input 
                          type="number"
                          autoFocus
                          placeholder="0.00"
                          className="w-full bg-white border border-emerald-200 rounded-lg py-2.5 pl-7 pr-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">Date Paid</label>
                      <input 
                        type="date"
                        className="w-full bg-white border border-emerald-200 rounded-lg py-2.5 px-3 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">Payment Note (Optional)</label>
                    <input 
                      placeholder="e.g. Paid via UPI"
                      className="w-full bg-white border border-emerald-200 rounded-lg py-2.5 px-3 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                      value={paymentNote}
                      onChange={e => setPaymentNote(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleAddPayment}
                    disabled={isLoading || !paymentAmount}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {isLoading ? "PROCESSING..." : "CONFIRM PAYMENT"}
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Payment History Table */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Ledger</h4>
                <div className="h-px flex-1 bg-slate-100 mx-4" />
                <span className="text-[10px] font-bold text-slate-400">{payments.length} Records</span>
              </div>

              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Clock className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-medium text-slate-400">No payments recorded yet.</p>
                  </div>
                ) : (
                  payments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="group bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:border-emerald-200 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex flex-col items-center justify-center border border-emerald-100">
                          <span className="text-[10px] font-black text-emerald-600 leading-none">{format(new Date(payment.paidOn), "dd")}</span>
                          <span className="text-[8px] font-bold text-emerald-400 uppercase">{format(new Date(payment.paidOn), "MMM")}</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">₹{payment.amount.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(payment.paidOn), "do MMM, yyyy")}
                            {payment.note && <span className="w-1 h-1 rounded-full bg-slate-300 mx-1" />}
                            {payment.note}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeletePayment(payment.id)}
                        className="h-8 w-8 rounded-lg bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Project Ledger v1.0</span>
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span>Synced Live</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


