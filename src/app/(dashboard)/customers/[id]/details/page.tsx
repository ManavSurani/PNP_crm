"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import {
  Phone, MapPin, FileText, Clock, Loader2, CheckCircle2,
  Calendar, IndianRupee, ArrowRight, Pencil, X,
  Check, RotateCcw, Ban, AlertTriangle, Activity,
  ArrowLeft, ChevronRight, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Note = { id: string; content: string; createdAt: string };
type FollowUp = { id: string; attemptNumber: number; outcome: string; noteGiven: string | null; createdAt: string };
type Meeting = { id: string; address: string; date: string; time: string; notes: string | null; status: string; createdAt: string };

type CustomerDetails = {
  id: string; customerName: string; project?: { name: string | null } | null; contactNumber: string; alternateNumber: string | null;
  fullAddress: string | null; inquirySource: string; referenceName?: string | null; serviceType: string; priority: string;
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
  initialDealAmount: number;
};

type ModalType =
  | "EDIT" | "CANCEL" | "REACTIVATE"
  | "ADD_NOTE" | "EDIT_NOTE"
  | "DELETE_NOTE"
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
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [reactivationNote, setReactivationNote] = useState("");
  const [editForm, setEditForm] = useState<Partial<CustomerDetails>>({});
  const [editError, setEditError] = useState<string | null>(null);

  const [noteForm, setNoteForm] = useState({ content: "", isCompleted: false });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "transaction" | "note";
    id: string;
  } | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

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
    setCancelReason(CANCEL_REASONS[0]);
    setReactivationNote("");
    setNoteForm({ content: "", isCompleted: false });
    setEditingNoteId(null);
    setDeleteTarget(null);
    setEditError(null);
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
    setEditError(null);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { closeModal(); fetchCustomer(); }
      else {
        const err = await res.json();
        setEditError(err.details || err.error || "Failed to update profile");
      }
    } catch (e) { 
      console.error(e);
      setEditError("Network error. Please try again.");
    }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    if (editError) setEditError(null);
  }, [editForm]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
  if (!customer) return <div className="p-10 text-center text-slate-500 font-bold">Customer profile not found.</div>;

  const displayName = customer.project?.name || customer.customerName;
  const notes = customer.leadNotes ?? [];



  const timeline = [
    ...(customer.leadNotes || []).map(n => ({ ...n, type: "NOTE" as const })),
    ...(customer.followUps || []).map(f => ({ ...f, type: "FOLLOW_UP" as const })),
    ...(customer.meetings || []).map(m => ({ ...m, type: "MEETING" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isCancelled = customer.isCancelled;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 pb-12">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between px-2 pt-2 mb-4">
        <Link 
          href={`/customers/${id}`}
          className="group flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
        >
          <div className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-slate-400 transition-colors bg-white shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
          </div>
          BACK
        </Link>
        
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
          <Link href="/customers" className="text-slate-300 hover:text-slate-500 transition-colors">Customer Directory</Link>
          <ChevronRight className="h-3 w-3 text-slate-200" /> 
          <Link href={`/customers/${id}`} className="text-slate-300 hover:text-slate-500 transition-colors">{customer.customerName.toUpperCase()}</Link>
          <ChevronRight className="h-3 w-3 text-slate-200" /> 
          <span className="text-slate-900">DETAILS</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white px-6 py-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="h-12 w-12 bg-emerald-50 rounded-lg flex shrink-0 items-center justify-center border border-emerald-100 shadow-sm">
            <span className="text-xl font-bold text-emerald-600 uppercase">{displayName.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{displayName}</h1>
              {customer.project?.name && (
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-100">Project</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200"><Phone className="h-3 w-3 text-emerald-600" /> {customer.contactNumber}</span>
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tight"><FileText className="h-3 w-3 text-emerald-500" /> {customer.serviceType.replace(/_/g, " ")}</span>
              {customer.inquirySource === "THROUGH_REFERENCE" && customer.referenceName && (
                <span className="flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tight"><User className="h-3 w-3 text-amber-500" /> {customer.referenceName}</span>
              )}
              {customer.project?.name && <span className="flex items-center gap-1.5 text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">Client: {customer.customerName}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 md:items-end relative z-10">
          <div className="flex items-center gap-2">
            {isCancelled ? (
              <button
                onClick={() => setActiveModal("REACTIVATE")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all active:scale-95 shadow-sm"
              >
                <RotateCcw className="h-3 w-3" /> Reactivate
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirmDeactivate) {
                    setActiveModal("CANCEL");
                    setConfirmDeactivate(false);
                  } else {
                    setConfirmDeactivate(true);
                    setTimeout(() => setConfirmDeactivate(false), 3000);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all active:scale-95 shadow-sm border",
                  confirmDeactivate 
                    ? "bg-rose-600 text-white border-rose-500 animate-pulse" 
                    : "bg-white text-slate-400 hover:text-rose-600 border-slate-200 hover:border-rose-200"
                )}
              >
                <Ban className="h-3 w-3" /> {confirmDeactivate ? "Confirm?" : "Deactivate"}
              </button>
            )}
            <span className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tight border gap-1.5",
              isCancelled ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
              <CheckCircle2 className="h-3.5 w-3.5" /> {isCancelled ? "Deactivated" : "Active"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-1">
             <div className={cn("h-1.5 w-1.5 rounded-full", customer.priority === "HIGH" ? "bg-rose-500 animate-pulse" : "bg-amber-400")} />
             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
               {customer.priority} Priority
             </span>
             {customer.cancelReason && (
               <>
                 <span className="text-slate-200 mx-1">|</span>
                 <p className="text-[9px] text-rose-500 font-bold uppercase italic tracking-tighter">Reason: {customer.cancelReason}</p>
               </>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Core Data & Action Center */}
        <div className="space-y-6">
          


          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all duration-300">
            <button onClick={() => { setEditForm(customer); setActiveModal("EDIT"); }} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-slate-50 hover:text-emerald-600 rounded transition-all border border-transparent hover:border-slate-100">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <h3 className="text-[11px] font-black text-slate-900 mb-4 uppercase tracking-[0.1em] flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Client Logistics
            </h3>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Address</p>
                <p className="text-xs text-slate-800 font-semibold leading-normal">{customer.fullAddress || "Not specified"}</p>
                {customer.landmark && <p className="text-[10px] text-slate-500 mt-0.5 italic">Near: {customer.landmark}</p>}
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FileText className="h-3 w-3" /> Core Requirement</p>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{customer.requirementDetails || "No details documented"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Approved Budget</p>
                  <p className="text-xs font-bold text-slate-900">{customer.budgetRange || "Pending"}</p>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Acquisition</p>
                  <p className="text-xs font-bold text-slate-900 uppercase">{customer.inquirySource}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Projects */}
        <div className="lg:col-span-2 space-y-6">



          {/* ── NOTES & TASKS ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[380px] hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-indigo-500" /> Project Notes
              </h3>
              <button
                onClick={() => {
                  setNoteForm({ content: "", isCompleted: false });
                  setEditingNoteId(null);
                  setActiveModal("ADD_NOTE");
                }}
                className="text-[9px] font-black text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-100 bg-white px-2.5 py-1 rounded transition-all uppercase tracking-tight"
              >
                + Add Note
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/30">
              {notes.length > 0 ? (
                notes.map(note => (
                  <div key={note.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all duration-200">
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
                          "mt-0.5 h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                          note.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-indigo-400"
                        )}
                      >
                        {note.isCompleted && <Check className="h-2.5 w-2.5 text-white" strokeWidth={5} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[11px] font-semibold leading-relaxed",
                          note.isCompleted ? "text-slate-400 line-through" : "text-slate-700"
                        )}>
                          {note.content}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
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
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-all"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ type: "note", id: note.id });
                            setActiveModal("DELETE_NOTE");
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-6">
                  <FileText className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No project notes yet</p>
                </div>
              )}
            </div>
          </div>





          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px] hover:shadow-md transition-all duration-300">
             <div className="flex items-center gap-4 mb-8">
               <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] flex items-center gap-2">
                 <Activity className="h-4 w-4 text-emerald-500" />
                 Activity Timeline
               </h3>
               <div className="h-px flex-1 bg-slate-100" />
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{timeline.length} Logs</p>
             </div>
             <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
               {timeline.map((item: any) => (
                 <div key={item.id} className="relative">
                     <div className={cn(
                       "absolute -left-[2.5rem] top-0 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                       item.type === "MEETING" ? "bg-emerald-600" :
                       item.outcome === "PICKED" ? "bg-emerald-500" :
                       item.outcome === "NOT_PICKED" ? "bg-rose-500" : "bg-slate-800"
                     )}>
                       {item.type === "MEETING" ? <Calendar className="h-2.5 w-2.5 text-white" /> :
                        item.type === "NOTE" ? <FileText className="h-2.5 w-2.5 text-white" /> :
                        <Phone className="h-2.5 w-2.5 text-white" />}
                     </div>
                   <div className="space-y-1.5">
                     <div className="flex flex-wrap gap-2 items-center">
                       <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                         <Clock className="h-2.5 w-2.5" />
                         {format(new Date(item.createdAt), "dd MMM, h:mm a")}
                       </span>
                       <span className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-slate-50 border border-slate-100",
                         item.type === "MEETING" ? "text-emerald-600 border-emerald-100" :
                         item.outcome === "PICKED" ? "text-emerald-600 border-emerald-100" :
                         item.outcome === "NOT_PICKED" ? "text-rose-600 border-rose-100" : "text-slate-600"
                       )}>
                         {item.type === "MEETING" ? "Site Update" :
                          item.outcome ? item.outcome.replace("_", " ") : "Log"}
                         {item.outcome === "NOT_PICKED" && ` (#${item.attemptNumber})`}
                       </span>
                     </div>
                     <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100 text-[11px] text-slate-700 leading-relaxed group shadow-sm hover:shadow-md transition-all">
                       {item.type === "MEETING" ? (
                         <div className="space-y-2">
                           <div className="flex items-center gap-2 text-slate-900 font-bold text-[10px] uppercase tracking-tight"><MapPin className="h-3 w-3 text-emerald-500" /> {item.address}</div>
                           <div className="flex gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                             <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {format(new Date(item.date), "PPP")}</span>
                             <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {item.time}</span>
                           </div>
                           {item.notes && <p className="italic text-slate-500 text-[10px] border-t border-slate-200 pt-1.5 leading-normal">"{item.notes}"</p>}
                         </div>
                       ) : (
                         <p className="whitespace-pre-wrap font-medium">
                           {item.content || item.noteGiven || <span className="text-slate-400 italic">No documentation.</span>}
                         </p>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
               {timeline.length === 0 && (
                 <div className="text-center py-16 text-slate-300">
                   <Activity className="h-10 w-10 mx-auto mb-2 opacity-10" />
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">No events logged</p>
                 </div>
               )}
             </div>
          </div>
          
        </div>
      </div>

      {/* ─── MODAL: EDIT CUSTOMER ─── */}
      {activeModal === "EDIT" && (
        <Modal title="Update Profile" icon={<Pencil className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form onSubmit={handleUpdateCustomer} className="p-8 space-y-6">
            {editError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700 mb-6">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-semibold">{editError}</p>
              </div>
            )}
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

      {activeModal === "DELETE_NOTE" && deleteTarget && (
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
                Are you sure you want to delete this note?
                This action cannot be undone and will permanently remove the record.
              </p>
            </div>
            <ModalFooter
              onClose={closeModal}
              isSubmitting={isSubmitting}
              label="Yes, Delete"
              onSubmit={async () => {
                setIsSubmitting(true);
                const url = `/api/notes/${deleteTarget.id}`;
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
      <button type={onSubmit ? "button" : "submit"} onClick={onClose} className="text-rose-500 font-semibold text-sm hover:text-rose-700 transition-colors px-4">Cancel</button>
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
