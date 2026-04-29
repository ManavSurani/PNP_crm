"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import {
  Phone, MapPin, FileText, Clock, Zap, Loader2, CheckCircle2,
  Calendar, ShoppingCart, IndianRupee, ArrowRight, Pencil, X,
  PhoneMissed, Check, RotateCcw, Ban, AlertTriangle, Activity, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import RequirementAnalysis from "@/components/leads/RequirementAnalysis";
import PackageSelection from "@/components/leads/PackageSelection";

type Note = { id: string; content: string; createdAt: string };
type FollowUp = { id: string; attemptNumber: number; outcome: string; noteGiven: string | null; createdAt: string };
type Meeting = { id: string; address: string; date: string; time: string; notes: string | null; status: string; createdAt: string };

type CustomerDetails = {
  id: string; customerName: string; contactNumber: string; alternateNumber: string | null;
  fullAddress: string | null; inquirySource: string; serviceType: string; priority: string;
  status: string; isCancelled: boolean; cancelReason: string | null;
  createdAt: string; updatedAt: string;
  budgetRange: string | null; requirementDetails: string | null;
  landmark: string | null; siteLocation: string | null;
  assignedStaff?: { id: string; name: string } | null;
  quotations: any[]; orders: any[];
  followUps: FollowUp[]; meetings: Meeting[];
  transactions: {
    id: string;
    type: "RECEIVED" | "EXPENSE";
    amount: number;
    date: string;
    paidTo: string;
    category: string;
    paymentMode: string;
    description: string | null;
    createdAt: string;
  }[];
  leadNotes: {
    id: string;
    content: string;
    isCompleted: boolean;
    createdAt: string;
  }[];
  requirement: any | null;
};

type ModalType =
  | "EDIT" | "PICKED" | "NOT_PICKED" | "MEETING" | "CANCEL" | "REACTIVATE"
  | "ADD_TRANSACTION" | "EDIT_TRANSACTION"
  | "ADD_NOTE" | "EDIT_NOTE"
  | "DELETE_TRANSACTION" | "DELETE_NOTE"
  | null;

const CANCEL_REASONS = [
  "No Response",
  "Not Interested",
  "Budget Issue",
  "Already Purchased",
  "Wrong Number",
  "Project Postponed",
];

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [noteContent, setNoteContent] = useState("");
  const [pickedStatus, setPickedStatus] = useState("INTERESTED");
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [reactivationNote, setReactivationNote] = useState("");
  const [meetingForm, setMeetingForm] = useState({ address: "", date: "", time: "", notes: "" });
  const [editForm, setEditForm] = useState<Partial<CustomerDetails>>({});

  const [transactionForm, setTransactionForm] = useState({
    type: "RECEIVED" as "RECEIVED" | "EXPENSE",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paidTo: "",
    category: "Advance",
    paymentMode: "Cash",
    description: "",
  });
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({ content: "", isCompleted: false });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "transaction" | "note";
    id: string;
  } | null>(null);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Customer not found");
      const data = await res.json();
      setCustomer(data);
      setEditForm(data);
    } catch (e) {
      console.error(e);
      setCustomer(null);
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchCustomer(); }, [id]);

  const closeModal = () => {
    setActiveModal(null);
    setNoteContent("");
    setPickedStatus("INTERESTED");
    setCancelReason(CANCEL_REASONS[0]);
    setReactivationNote("");
    setMeetingForm({ address: "", date: "", time: "", notes: "" });
    setTransactionForm({
      type: "RECEIVED",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paidTo: "",
      category: "Advance",
      paymentMode: "Cash",
      description: "",
    });
    setEditingTransactionId(null);
    setNoteForm({ content: "", isCompleted: false });
    setEditingNoteId(null);
    setDeleteTarget(null);
  };

  const post = async (url: string, body: object) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { closeModal(); fetchCustomer(); }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { closeModal(); fetchCustomer(); }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div>;
  if (!customer) return <div className="p-10 text-center text-slate-500 font-bold">Customer profile not found.</div>;

  const projectAmount = customer.orders?.reduce((acc: number, o: any) => acc + o.totalAmount, 0) || 0;
  const trxs = customer.transactions ?? [];
  const notes = customer.leadNotes ?? [];
  const received = trxs
    .filter(t => t.type === "RECEIVED")
    .reduce((acc, t) => acc + t.amount, 0);
  const expenses = trxs
    .filter(t => t.type === "EXPENSE")
    .reduce((acc, t) => acc + t.amount, 0);
  const pending = projectAmount - received;
  const profit = projectAmount - expenses;

  const timeline = [
    ...(customer.leadNotes || []).map(n => ({ ...n, type: "NOTE" as const })),
    ...(customer.followUps || []).map(f => ({ ...f, type: "FOLLOW_UP" as const })),
    ...(customer.meetings || []).map(m => ({ ...m, type: "MEETING" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isCancelled = customer.status === "CANCELLED";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-16 w-16 bg-emerald-50 rounded-xl flex shrink-0 items-center justify-center border border-emerald-100 shadow-sm">
            <span className="text-2xl font-bold text-emerald-600 uppercase">{customer.customerName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{customer.customerName}</h1>
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-3 py-1 rounded-md border border-slate-200"><Phone className="h-3.5 w-3.5 text-emerald-600" /> {customer.contactNumber}</span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-3 py-1 rounded-md border border-slate-200 uppercase"><FileText className="h-3.5 w-3.5 text-emerald-500" /> {customer.serviceType.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:items-end relative z-10">
          <span className={cn(
            "inline-flex items-center rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-wider border gap-1.5",
            isCancelled ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
          )}>
            <CheckCircle2 className="h-4 w-4" /> {isCancelled ? "Deactivated Account" : "Active Customer"}
          </span>
          <div className="flex items-center gap-2">
             <div className={cn("h-1.5 w-1.5 rounded-full", customer.priority === "HIGH" ? "bg-rose-500 animate-pulse" : "bg-amber-400")} />
             <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
               {customer.priority} Priority
             </span>
          </div>
          {customer.cancelReason && <p className="text-[10px] text-rose-500 font-medium italic">Reason: {customer.cancelReason}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Core Data & Action Center */}
        <div className="space-y-6">
          
          {/* Operations Hub (Action Center) */}
          <div className="bg-slate-900 px-6 py-8 rounded-xl shadow-sm text-white">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Zap className="h-4 w-4 text-emerald-400" /> Action Center
            </h3>
            {isCancelled ? (
              <div className="space-y-4">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-center">
                  <Ban className="h-6 w-6 text-rose-400 mx-auto mb-2" />
                  <p className="text-rose-400 font-semibold text-[11px] uppercase tracking-wider">Account Deactivated</p>
                </div>
                <button
                  onClick={() => setActiveModal("REACTIVATE")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md border border-emerald-500/20"
                >
                  <RotateCcw className="h-4 w-4" /> Reactivate Profile
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setActiveModal("PICKED")} className="bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
                    <CheckCircle2 className="h-5 w-5" /> Picked
                  </button>
                  <button onClick={() => setActiveModal("NOT_PICKED")} className="bg-rose-600 hover:bg-rose-700 py-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
                    <PhoneMissed className="h-5 w-5" /> No Answer
                  </button>
                </div>
                <button onClick={() => setActiveModal("MEETING")} className="w-full bg-white text-slate-900 hover:bg-slate-100 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm mt-3">
                  <Calendar className="h-4 w-4 text-emerald-600" /> Schedule Site Check
                </button>

                {/* ── Expense Tracking Quick Actions ── */}
                <div className="border-t border-white/10 pt-4 mt-1 space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center mb-3">
                    Expense Tracking
                  </p>
                  <button
                    onClick={() => {
                      setTransactionForm({
                        type: "RECEIVED",
                        amount: "",
                        date: new Date().toISOString().split("T")[0],
                        paidTo: customer!.customerName,
                        category: "Advance",
                        paymentMode: "Cash",
                        description: "",
                      });
                      setEditingTransactionId(null);
                      setActiveModal("ADD_TRANSACTION");
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border border-emerald-500/20 shadow-md"
                  >
                    <IndianRupee className="h-4 w-4" /> Payment Received
                  </button>
                  <button
                    onClick={() => {
                      setTransactionForm({
                        type: "EXPENSE",
                        amount: "",
                        date: new Date().toISOString().split("T")[0],
                        paidTo: "",
                        category: "Labour",
                        paymentMode: "Cash",
                        description: "",
                      });
                      setEditingTransactionId(null);
                      setActiveModal("ADD_TRANSACTION");
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 border border-rose-500/20 shadow-md"
                  >
                    <ArrowRight className="h-4 w-4 rotate-90" /> Add Expense
                  </button>
                  <button
                    onClick={() => {
                      setNoteForm({ content: "", isCompleted: false });
                      setEditingNoteId(null);
                      setActiveModal("ADD_NOTE");
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/10 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <FileText className="h-4 w-4 text-slate-300" /> Add Note / Task
                  </button>
                </div>

                <div className="pt-2">
                  <button onClick={() => setActiveModal("CANCEL")} className="w-full text-slate-400 hover:text-rose-400 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mt-2">
                    <Ban className="h-3 w-3" /> Deactivate Account
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <button onClick={() => { setEditForm(customer); setActiveModal("EDIT"); }} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 hover:text-emerald-600 rounded-lg transition-all border border-transparent hover:border-slate-100">
              <Pencil className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider">Client Logistics</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Execution Address</p>
                <p className="text-sm text-slate-800 font-medium">{customer.fullAddress || "Not specified"}</p>
                {customer.landmark && <p className="text-[11px] text-slate-500 mt-0.5">Near: {customer.landmark}</p>}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FileText className="h-3 w-3" /> Core Requirement</p>
                <p className="text-sm text-slate-800 font-medium leading-relaxed">{customer.requirementDetails || "No details documented"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Approved Budget</p>
                  <p className="text-xs font-bold text-slate-900">{customer.budgetRange || "Pending"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Acquisition</p>
                  <p className="text-xs font-bold text-slate-900 uppercase">{customer.inquirySource}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Projects */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── LEDGER SUMMARY ── */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" /> Ledger Summary
              </h3>
              <Link
                href={`/customers/${id}/financials`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 border border-emerald-100 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 shadow-sm"
              >
                Full Financials <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative z-10">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Work Amount</p>
                <p className="text-sm font-bold text-slate-900">₹{projectAmount.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-wider mb-1">Received</p>
                <p className="text-sm font-bold text-emerald-600">₹{received.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-widest">Incoming</p>
              </div>
              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100/50">
                <p className="text-[10px] text-rose-600/70 font-bold uppercase tracking-wider mb-1">Expenses</p>
                <p className="text-sm font-bold text-rose-600">₹{expenses.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-rose-600 font-bold mt-1 uppercase tracking-widest">Outgoing</p>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100/50">
                <p className="text-[10px] text-amber-600/70 font-bold uppercase tracking-wider mb-1">Pending In</p>
                <p className="text-sm font-black text-amber-600">₹{pending.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                <p className="text-[10px] text-indigo-600/70 font-bold uppercase tracking-wider mb-1">Est. Profit</p>
                <p className="text-sm font-black text-indigo-600">₹{profit.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>

          {/* ── TRANSACTIONS TABLE ── */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-500" /> All Transactions
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  {trxs.length} entries
                </span>
                <button
                  onClick={() => {
                    setTransactionForm({
                      type: "RECEIVED", amount: "",
                      date: new Date().toISOString().split("T")[0],
                      paidTo: customer!.customerName,
                      category: "Advance", paymentMode: "Cash", description: "",
                    });
                    setEditingTransactionId(null);
                    setActiveModal("ADD_TRANSACTION");
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1 transition-all"
                >
                  <IndianRupee className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            </div>

            {trxs.length > 0 ? (
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Date", "Type", "Amount", "Paid To / From", "Category", "Mode", "Note", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trxs.map(t => (
                      <tr
                        key={t.id}
                        className={t.type === "RECEIVED"
                          ? "bg-emerald-50/30 hover:bg-emerald-50/70 transition-colors"
                          : "bg-rose-50/30 hover:bg-rose-50/70 transition-colors"}
                      >
                        <td className="px-4 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">
                          {format(new Date(t.date), "dd/MM/yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            t.type === "RECEIVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          )}>
                            {t.type === "RECEIVED" ? "↑ Received" : "↓ Expense"}
                          </span>
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-sm font-black",
                          t.type === "RECEIVED" ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === "RECEIVED" ? "+" : "−"} ₹{t.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700 font-semibold">{t.paidTo}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.category}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.paymentMode}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 italic max-w-[140px] truncate">
                          {t.description || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setTransactionForm({
                                  type: t.type,
                                  amount: String(t.amount),
                                  date: t.date.split("T")[0],
                                  paidTo: t.paidTo,
                                  category: t.category,
                                  paymentMode: t.paymentMode,
                                  description: t.description || "",
                                });
                                setEditingTransactionId(t.id);
                                setActiveModal("EDIT_TRANSACTION");
                              }}
                              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700 transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({ type: "transaction", id: t.id });
                                setActiveModal("DELETE_TRANSACTION");
                              }}
                              className="p-1.5 hover:bg-rose-100 rounded-md text-slate-400 hover:text-rose-600 transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-14 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <IndianRupee className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No transactions recorded yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the Action Center or the Add button above to record a payment or expense.
                </p>
              </div>
            )}
          </div>

          {/* ── NOTES & TASKS ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" /> Project Notes
              </h3>
              <button
                onClick={() => {
                  setNoteForm({ content: "", isCompleted: false });
                  setEditingNoteId(null);
                  setActiveModal("ADD_NOTE");
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg"
              >
                + Add Note
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {notes.length > 0 ? (
                notes.map(note => (
                  <div key={note.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={async () => {
                          await fetch(`/api/notes/${note.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isCompleted: !note.isCompleted }),
                          });
                          fetchCustomer();
                        }}
                        className={cn(
                          "mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center cursor-pointer transition-colors",
                          note.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-indigo-400"
                        )}
                      >
                        {note.isCompleted && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-medium leading-relaxed",
                          note.isCompleted ? "text-slate-400 line-through" : "text-slate-700"
                        )}>
                          {note.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {format(new Date(note.createdAt), "dd MMM, hh:mm a")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setNoteForm({ content: note.content, isCompleted: note.isCompleted });
                            setEditingNoteId(note.id);
                            setActiveModal("EDIT_NOTE");
                          }}
                          className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700 transition-all"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ type: "note", id: note.id });
                            setActiveModal("DELETE_NOTE");
                          }}
                          className="p-1.5 hover:bg-rose-100 rounded-md text-slate-400 hover:text-rose-600 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                  <FileText className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">No project notes yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Projects (Orders) */}
          <div className="bg-slate-900 p-8 rounded-xl shadow-sm text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-400" /> Project Progress
              </h3>
              <Link href="/orders" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {customer.orders && customer.orders.length > 0 ? (
              <div className="space-y-3">
                {customer.orders.map((order: any) => (
                  <div key={order.id} className="bg-white/10 border border-white/10 rounded-lg p-5 hover:bg-white/15 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold">{order.orderNo}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Package: <span className="text-white">{order.packageType.replace("_", " ")}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Project Value</p>
                      <p className="text-lg font-bold text-emerald-400 flex items-center justify-end gap-1">
                        <IndianRupee className="h-4 w-4" /> {order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-lg border border-white/5 border-dashed">
                <ShoppingCart className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300">No active projects found.</p>
                <p className="text-xs text-slate-500 mt-1">Create an order from the master Project Progress tab.</p>
              </div>
            )}
          </div>

          {/* Quotations */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" /> Commercial Quotations
              </h3>
              <Link href="/quotations" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                Manage Quotes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {customer.quotations && customer.quotations.length > 0 ? (
              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quote No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {customer.quotations.map((quote: any) => (
                      <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">{quote.quotationNo}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-medium">{format(new Date(quote.createdAt), "MMM dd, yyyy")}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            quote.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" :
                              quote.status === "SENT" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right flex items-center justify-end gap-1">
                          <IndianRupee className="h-3.5 w-3.5 text-slate-400" /> {quote.finalTotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                <p className="text-sm font-medium text-slate-500">No quotation history found.</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-[500px]">
             <div className="flex items-center gap-4 mb-10">
               <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Activity Timeline</h3>
               <div className="h-px flex-1 bg-slate-100" />
               <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{timeline.length} Activities</p>
             </div>
             <div className="relative pl-8 border-l border-slate-100 space-y-10">
               {timeline.map((item: any) => (
                 <div key={item.id} className="relative">
                     <div className={cn(
                       "absolute -left-[2.5rem] top-0 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                       item.type === "MEETING" ? "bg-emerald-600" :
                       item.outcome === "PICKED" ? "bg-emerald-500" :
                       item.outcome === "NOT_PICKED" ? "bg-rose-500" : "bg-slate-800"
                     )}>
                       {item.type === "MEETING" ? <Calendar className="h-3 w-3 text-white" /> :
                        item.type === "NOTE" ? <FileText className="h-3 w-3 text-white" /> :
                        <Phone className="h-3 w-3 text-white" />}
                     </div>
                   <div className="space-y-2.5">
                     <div className="flex flex-wrap gap-2 items-center">
                       <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                         <Clock className="h-3 w-3" />
                         {format(new Date(item.createdAt), "dd MMM, h:mm a")}
                       </span>
                       <span className={cn("text-[10px] font-bold uppercase tracking-wider",
                         item.type === "MEETING" ? "text-emerald-600" :
                         item.outcome === "PICKED" ? "text-emerald-600" :
                         item.outcome === "NOT_PICKED" ? "text-rose-600" : "text-slate-600"
                       )}>
                         {item.type === "MEETING" ? "Site Update" :
                          item.outcome ? `Interaction: ${item.outcome.replace("_", " ")}` : "Internal Log"}
                         {item.outcome === "NOT_PICKED" && ` (#${item.attemptNumber})`}
                       </span>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed group shadow-sm hover:shadow-md transition-shadow">
                       {item.type === "MEETING" ? (
                         <div className="space-y-3">
                           <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> {item.address}</div>
                           <div className="flex gap-4 text-[11px] font-medium text-slate-500">
                             <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(item.date), "PPP")}</span>
                             <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.time}</span>
                           </div>
                           {item.notes && <p className="italic text-slate-600 text-xs border-t border-slate-200 pt-2 leading-relaxed">"{item.notes}"</p>}
                         </div>
                       ) : (
                         <p className="whitespace-pre-wrap">
                           {item.content || item.noteGiven || <span className="text-slate-400 italic">No documentation provided.</span>}
                         </p>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
               {timeline.length === 0 && (
                 <div className="text-center py-24 text-slate-300">
                   <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                   <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">No events logged</p>
                 </div>
               )}
             </div>
          </div>
          
        </div>
      </div>

      {/* ─── MODAL: EDIT CUSTOMER ─── */}
      {activeModal === "EDIT" && (
        <Modal title="Update Profile" icon={<Pencil className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form onSubmit={handleUpdateCustomer} className="p-8 space-y-6 overflow-y-auto max-h-[65vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Customer Name *"><input required className={inputCls} value={editForm.customerName || ""} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} /></Field>
              <Field label="Phone *">
                <input 
                  required 
                  maxLength={10}
                  className={inputCls} 
                  value={editForm.contactNumber || ""} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 10) setEditForm({ ...editForm, contactNumber: val });
                  }} 
                />
              </Field>
              <Field label="Execution Address"><textarea rows={3} className={inputCls} value={editForm.fullAddress || ""} onChange={e => setEditForm({ ...editForm, fullAddress: e.target.value })} /></Field>
              <Field label="Landmark"><input className={inputCls} value={editForm.landmark || ""} onChange={e => setEditForm({ ...editForm, landmark: e.target.value })} /></Field>
              <Field label="Core Requirement"><textarea rows={3} className={inputCls} value={editForm.requirementDetails || ""} onChange={e => setEditForm({ ...editForm, requirementDetails: e.target.value })} /></Field>
              <Field label="Approved Budget"><input className={inputCls} value={editForm.budgetRange || ""} onChange={e => setEditForm({ ...editForm, budgetRange: e.target.value })} /></Field>
            </div>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Apply Modifications" />
          </form>
        </Modal>
      )}

      {/* ─── MODAL: CALL PICKED ─── */}
      {activeModal === "PICKED" && (
        <Modal title="Log Client Discussion" icon={<CheckCircle2 className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <Field label="Discussion Summary *">
              <textarea required rows={4} className={inputCls}
                placeholder="Details of project updates or requirements discussed..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
              />
            </Field>
            <Field label="Outcome Status">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "INTERESTED", label: "Project Active" },
                  { val: "MEETING", label: "Requires Site Check" },
                  { val: "RESCHEDULE", label: "Follow-up Delay" },
                  { val: "CANCELLED", label: "Issue Reported" },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setPickedStatus(opt.val)}
                    className={cn(
                      "py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                      pickedStatus === opt.val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            </Field>
            {pickedStatus === "CANCELLED" && (
              <Field label="Reason Code">
                <select className={inputCls} value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                  {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
            )}
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Record Log"
              disabled={!noteContent}
              onSubmit={() => post("/api/follow-ups", {
                leadId: id, outcome: "PICKED", noteGiven: noteContent,
                pickedStatus, cancelReason: pickedStatus === "CANCELLED" ? cancelReason : undefined
              })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: NOT PICKED ─── */}
      {activeModal === "NOT_PICKED" && (
        <Modal title="Unsuccessful Contact Log" icon={<PhoneMissed className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <Field label="Additional Log Context">
              <textarea rows={4} className={inputCls}
                placeholder="Line busy, out of reach..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
              />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Save Log Entry"
              onSubmit={() => post("/api/follow-ups", { leadId: id, outcome: "NOT_PICKED", noteGiven: noteContent || null })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: CANCEL LEAD ─── */}
      {activeModal === "CANCEL" && (
        <Modal title="Deactivate Account" icon={<Ban className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3.5 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 font-medium">Deactivating will pause execution metrics for this client.</p>
            </div>
            <Field label="Closure Reason *">
              <select className={inputCls} value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Closing Remarks">
              <textarea rows={3} className={inputCls} placeholder="Reasons for account freezing..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)} />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Freeze Profile"
              onSubmit={() => post("/api/follow-ups", { leadId: id, outcome: "CANCELLED", cancelReason, noteGiven: noteContent || null })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: REACTIVATE LEAD ─── */}
      {activeModal === "REACTIVATE" && (
        <Modal title="Restore Account" icon={<RotateCcw className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <Field label="Restoration Rationale">
              <textarea rows={3} className={inputCls} placeholder="Why is this account being unfrozen?"
                value={reactivationNote} onChange={e => setReactivationNote(e.target.value)} />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Unfreeze Profile"
              onSubmit={() => post(`/api/leads/${id}/reactivate`, { reactivationNote })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: MEETING ─── */}
      {activeModal === "MEETING" && (
        <Modal title="Deploy Site Check" icon={<Calendar className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3.5 flex items-start gap-3 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-700 font-medium">This site visit will be categorized under 'Project Site Checks' instead of 'Pre-Sales Visits'.</p>
            </div>
             
            <Field label="Site Address *"><input required className={inputCls} value={meetingForm.address} onChange={e => setMeetingForm({ ...meetingForm, address: e.target.value })} placeholder="Apartment / Office address" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Scheduled Date *"><input type="date" required className={inputCls} value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} /></Field>
              <Field label="Scheduled Time *"><input type="time" required className={inputCls} value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })} /></Field>
            </div>
            <Field label="Operation Notes (Optional)"><textarea rows={3} className={inputCls} value={meetingForm.notes} onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })} placeholder="Deliverables, tools needed, contractor details..." /></Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Confirm Operation"
              disabled={!meetingForm.address || !meetingForm.date || !meetingForm.time}
              onSubmit={() => post("/api/meetings", { leadId: id, ...meetingForm })}
            />
          </div>
        </Modal>
      )}

      {(activeModal === "ADD_TRANSACTION" || activeModal === "EDIT_TRANSACTION") && (
        <Modal
          title={
            editingTransactionId ? "Edit Transaction"
              : transactionForm.type === "RECEIVED" ? "Payment Received"
                : "Add Expense"
          }
          icon={<IndianRupee className="h-5 w-5" />}
          color="primary"
          onClose={closeModal}
        >
          <div className="p-8 space-y-5 overflow-y-auto max-h-[65vh]">

            {/* Type toggle — only show on ADD */}
            {!editingTransactionId && (
              <div className="grid grid-cols-2 gap-2">
                {(["RECEIVED", "EXPENSE"] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTransactionForm(f => ({
                      ...f,
                      type: t,
                      paidTo: t === "RECEIVED" ? customer!.customerName : "",
                      category: t === "RECEIVED" ? "Advance" : "Labour",
                    }))}
                    className={cn(
                      "py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                      transactionForm.type === t
                        ? t === "RECEIVED"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                          : "bg-rose-600 text-white border-rose-600 shadow-md"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {t === "RECEIVED" ? "✅ Payment Received" : "🔴 Expense Paid Out"}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount (₹) *">
                <input
                  type="number"
                  min="1"
                  className={inputCls}
                  placeholder="0"
                  value={transactionForm.amount}
                  onChange={e => setTransactionForm(f => ({ ...f, amount: e.target.value }))}
                />
              </Field>
              <Field label="Date *">
                <input
                  type="date"
                  className={inputCls}
                  value={transactionForm.date}
                  onChange={e => setTransactionForm(f => ({ ...f, date: e.target.value }))}
                />
              </Field>
            </div>

            <Field label={transactionForm.type === "RECEIVED" ? "Received From *" : "Paid To (Person Name) *"}>
              <input
                className={inputCls}
                placeholder={
                  transactionForm.type === "RECEIVED"
                    ? "Customer name"
                    : "e.g. Ramesh Carpenter, Rajesh Hardware..."
                }
                value={transactionForm.paidTo}
                onChange={e => setTransactionForm(f => ({ ...f, paidTo: e.target.value }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category *">
                <select
                  className={inputCls}
                  value={transactionForm.category}
                  onChange={e => setTransactionForm(f => ({ ...f, category: e.target.value }))}
                >
                  {(transactionForm.type === "RECEIVED"
                    ? ["Advance", "Installment", "Final Payment", "Miscellaneous"]
                    : ["Labour", "Carpenter", "Electrician", "Plumber", "Material", "Transport", "Supplier", "Miscellaneous"]
                  ).map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Payment Mode *">
                <select
                  className={inputCls}
                  value={transactionForm.paymentMode}
                  onChange={e => setTransactionForm(f => ({ ...f, paymentMode: e.target.value }))}
                >
                  {["Cash", "UPI", "Bank Transfer", "Cheque"].map(m => <option key={m}>{m}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Description / Note (Optional)">
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Any additional details about this transaction..."
                value={transactionForm.description}
                onChange={e => setTransactionForm(f => ({ ...f, description: e.target.value }))}
              />
            </Field>

            <ModalFooter
              onClose={closeModal}
              isSubmitting={isSubmitting}
              label={editingTransactionId ? "Save Changes" : "Save Transaction"}
              disabled={!transactionForm.amount || !transactionForm.paidTo || !transactionForm.date}
              onSubmit={async () => {
                setIsSubmitting(true);
                const url = editingTransactionId
                  ? `/api/transactions/${editingTransactionId}`
                  : "/api/transactions";
                const method = editingTransactionId ? "PUT" : "POST";
                const body = {
                  ...transactionForm,
                  amount: parseFloat(transactionForm.amount),
                  leadId: id,
                };
                try {
                  const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });
                  if (res.ok) { closeModal(); fetchCustomer(); }
                } catch (e) { console.error(e); }
                finally { setIsSubmitting(false); }
              }}
            />
          </div>
        </Modal>
      )}

      {(activeModal === "ADD_NOTE" || activeModal === "EDIT_NOTE") && (
        <Modal
          title={editingNoteId ? "Edit Note" : "Add Note / Task"}
          icon={<FileText className="h-5 w-5" />}
          color="primary"
          onClose={closeModal}
        >
          <div className="p-8 space-y-5">
            <Field label="Note / Task Content *">
              <textarea
                rows={4}
                className={inputCls}
                placeholder="e.g. Measure kitchen wall on Monday, Order hinges from Rajesh Hardware..."
                value={noteForm.content}
                onChange={e => setNoteForm(f => ({ ...f, content: e.target.value }))}
              />
            </Field>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setNoteForm(f => ({ ...f, isCompleted: !f.isCompleted }))}
                className={cn(
                  "h-5 w-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer",
                  noteForm.isCompleted
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-300 hover:border-emerald-400"
                )}
              >
                {noteForm.isCompleted && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm font-medium text-slate-700">Mark as completed</span>
            </label>
            <ModalFooter
              onClose={closeModal}
              isSubmitting={isSubmitting}
              label={editingNoteId ? "Save Note" : "Add Note"}
              disabled={!noteForm.content.trim()}
              onSubmit={async () => {
                setIsSubmitting(true);
                const url = editingNoteId ? `/api/notes/${editingNoteId}` : "/api/notes";
                const method = editingNoteId ? "PUT" : "POST";
                const body = editingNoteId
                  ? noteForm
                  : { ...noteForm, leadId: id };
                try {
                  const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });
                  if (res.ok) { closeModal(); fetchCustomer(); }
                } catch (e) { console.error(e); }
                finally { setIsSubmitting(false); }
              }}
            />
          </div>
        </Modal>
      )}

      {(activeModal === "DELETE_TRANSACTION" || activeModal === "DELETE_NOTE") && deleteTarget && (
        <Modal
          title="Confirm Delete"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="primary"
          onClose={closeModal}
        >
          <div className="p-8 space-y-6">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-medium">
                Are you sure you want to delete this {deleteTarget.type}?
                This action cannot be undone and will permanently remove the record.
              </p>
            </div>
            <ModalFooter
              onClose={closeModal}
              isSubmitting={isSubmitting}
              label="Yes, Delete"
              onSubmit={async () => {
                setIsSubmitting(true);
                const url = deleteTarget.type === "transaction"
                  ? `/api/transactions/${deleteTarget.id}`
                  : `/api/notes/${deleteTarget.id}`;
                try {
                  const res = await fetch(url, { method: "DELETE" });
                  if (res.ok) { closeModal(); fetchCustomer(); }
                } catch (e) { console.error(e); }
                finally { setIsSubmitting(false); }
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 px-4 text-slate-900 font-medium placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, icon, color, onClose, children }: {
  title: string; icon: React.ReactNode; color: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="text-emerald-600">{icon}</div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, isSubmitting, label, disabled, color = "primary", onSubmit }: {
  onClose: () => void; isSubmitting: boolean; label: string; disabled?: boolean; color?: string; onSubmit?: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-3 p-8 bg-slate-50/50 border-t border-slate-100">
      <button type={onSubmit ? "button" : "submit"} onClick={onClose} className="text-slate-500 font-semibold text-sm hover:text-slate-900 transition-colors px-4">Cancel</button>
      <button
        type={onSubmit ? "button" : "submit"}
        disabled={disabled || isSubmitting}
        onClick={onSubmit}
        className={cn(
          "px-8 py-2.5 rounded-lg text-white font-semibold shadow-md transition-all active:scale-95 disabled:opacity-40 text-sm flex items-center gap-2 border",
          "bg-emerald-600 hover:bg-emerald-700 border-emerald-500/20"
        )}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {label}
      </button>
    </div>
  );
}
