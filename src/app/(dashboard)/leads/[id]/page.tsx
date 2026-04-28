"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import {
  Phone, MapPin, FileText, Clock, Zap, Loader2, Pencil, X, CheckCircle2,
  PhoneMissed, Calendar, Check, RotateCcw, Ban, AlertTriangle, ListTodo, Activity, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

type FollowUp = { id: string; attemptNumber: number; outcome: string; noteGiven: string | null; createdAt: string };
type Meeting = { id: string; address: string; date: string; time: string; notes: string | null; status: string; createdAt: string };

type LeadDetails = {
  id: string; customerName: string; contactNumber: string; alternateNumber: string | null;
  fullAddress: string | null; inquirySource: string; serviceType: string; priority: string;
  status: string; isCancelled: boolean; cancelReason: string | null;
  createdAt: string; budgetRange: string | null; requirementDetails: string | null;
  siteLocation: string | null; landmark: string | null; preferredVisitTime: string | null;
  assignedStaff?: { id: string; name: string } | null;
  followUps: FollowUp[]; meetings: Meeting[];
};

type ModalType = 
  | "EDIT" | "PICKED" | "NOT_PICKED" | "MEETING" | "CANCEL" | "REACTIVATE" | "CONVERT"
  | null;

const CANCEL_REASONS = [
  "No Response",
  "Not Interested",
  "Budget Issue",
  "Already Purchased",
  "Wrong Number",
  "Project Postponed",
];

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [noteContent, setNoteContent] = useState("");
  const [pickedStatus, setPickedStatus] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [reactivationNote, setReactivationNote] = useState("");
  const [meetingForm, setMeetingForm] = useState({ address: "", date: "", time: "", notes: "" });
  const [editForm, setEditForm] = useState<Partial<LeadDetails>>({});
  const [editingItem, setEditingItem] = useState<{ id: string; type: "FOLLOW_UP" | "MEETING"; noteGiven?: string | null; notes?: string | null; address?: string; date?: string; time?: string } | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Lead not found");
      const data = await res.json();
      setLead(data);
      setEditForm(data);
    } catch (e) {
      console.error(e);
      setLead(null);
    }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLead(); }, [id]);

  const closeModal = () => {
    setActiveModal(null);
    setNoteContent("");
    setPickedStatus("");
    setFollowUpDate("");
    setFollowUpTime("");
    setCancelReason(CANCEL_REASONS[0]);
    setReactivationNote("");
    setMeetingForm({ address: "", date: "", time: "", notes: "" });
  };

  const post = async (url: string, body: object) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { closeModal(); fetchLead(); }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteActivity = async (targetId: string, itemType: "FOLLOW_UP" | "MEETING") => {
    alert(`Attempting to delete ${itemType} with ID: ${targetId}`);
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    setIsSubmitting(true);
    try {
      const apiUrl = itemType === "FOLLOW_UP" ? `/api/follow-ups/${targetId}` : `/api/meetings/${targetId}`;
      const res = await fetch(apiUrl, { method: "DELETE" });
      if (res.ok) {
        alert("Deleted successfully");
        fetchLead();
      } else {
        const err = await res.json();
        alert(`API Error: ${err.error || "Unknown"}`);
        fetchLead();
      }
    } catch (e) {
      alert(`Network Error: ${String(e)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateActivity = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      const url = editingItem.type === "FOLLOW_UP" ? `/api/follow-ups/${editingItem.id}` : `/api/meetings/${editingItem.id}`;
      const body = editingItem.type === "FOLLOW_UP" ? { noteGiven: editNoteText } : { notes: editNoteText };
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { setEditingItem(null); fetchLead(); }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { closeModal(); fetchLead(); }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleConvertToCustomer = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${id}/convert`, { method: "POST" });
      if (res.ok) {
        closeModal();
        fetchLead();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>;
  if (!lead) return <div className="p-10 text-center text-slate-500 font-bold">Lead not found.</div>;

  const timeline = [
    ...(lead.followUps || []).map(f => ({ ...f, type: "FOLLOW_UP" as const })),
    ...(lead.meetings || []).map(m => ({ ...m, type: "MEETING" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isCancelled = lead.status === "CANCELLED";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-16 w-16 bg-slate-100 rounded-xl flex shrink-0 items-center justify-center border border-slate-200">
            <span className="text-2xl font-bold text-slate-800 uppercase">{lead.customerName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{lead.customerName}</h1>
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-3 py-1 rounded-md border border-slate-200"><Phone className="h-3.5 w-3.5 text-indigo-600" /> {lead.contactNumber}</span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-3 py-1 rounded-md border border-slate-200 uppercase"><FileText className="h-3.5 w-3.5 text-slate-400" /> {lead.serviceType.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:items-end relative z-10">
          <span className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border",
            lead.status === "NEW_INQUIRY" ? "bg-amber-50 text-amber-700 border-amber-200" :
            lead.status === "WON_ORDER" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            lead.status === "CANCELLED" ? "bg-rose-50 text-rose-700 border-rose-200" :
            lead.status === "MEETING_SCHEDULED" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
            "bg-sky-50 text-sky-700 border-sky-200"
          )}>
            {lead.status === "NEW_INQUIRY" ? "New Lead" :
             lead.status === "WON_ORDER" ? "Project Started" :
             lead.status === "MEETING_SCHEDULED" ? "Visit Booked" :
             lead.status === "FOLLOW_UP" ? "In Pipeline" :
             lead.status.replace(/_/g, " ")}
          </span>
          <div className="flex items-center gap-2">
             <div className={cn("h-1.5 w-1.5 rounded-full", lead.priority === "HIGH" ? "bg-rose-500 animate-pulse" : "bg-amber-400")} />
             <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
               {lead.priority} Priority
             </span>
          </div>
          {lead.cancelReason && <p className="text-[10px] text-rose-500 font-medium italic">Reason: {lead.cancelReason}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Operations Hub */}
          <div className="bg-slate-900 px-6 py-8 rounded-xl shadow-sm text-white">
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Zap className="h-4 w-4 text-amber-500" /> Action Center
            </h3>
            {isCancelled ? (
              <div className="space-y-4">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-center">
                  <Ban className="h-6 w-6 text-rose-400 mx-auto mb-2" />
                  <p className="text-rose-400 font-semibold text-[11px] uppercase tracking-wider">Lead Deactivated</p>
                </div>
                <button
                  onClick={() => setActiveModal("REACTIVATE")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md border border-indigo-500/20"
                >
                  <RotateCcw className="h-4 w-4" /> Reactivate Lead
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
                  <Calendar className="h-4 w-4 text-indigo-600" /> Schedule Site Visit
                </button>
                <button onClick={() => setActiveModal("CONVERT")} className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-indigo-200 mt-2 shadow-sm relative overflow-hidden group">
                  <Zap className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" /> Convert to Customer
                </button>

                <div className="pt-2">
                  <button onClick={() => setActiveModal("CANCEL")} className="w-full text-slate-400 hover:text-rose-400 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mt-2">
                    <Ban className="h-3 w-3" /> Cancel Lead
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Core Lead File */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <button onClick={() => { setEditForm(lead); setActiveModal("EDIT"); }} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all border border-transparent hover:border-slate-100">
              <Pencil className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider">Profile Information</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Address</p>
                <p className="text-sm text-slate-800 font-medium">{lead.fullAddress || "Not specified"}</p>
                {lead.landmark && <p className="text-[11px] text-slate-500 mt-0.5">Near: {lead.landmark}</p>}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Zap className="h-3 w-3" /> Requirement</p>
                <p className="text-sm text-slate-800 font-medium">{lead.requirementDetails || "No details provided"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Budget</p>
                  <p className="text-xs font-bold text-slate-900">{lead.budgetRange || "Flexible"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Source</p>
                  <p className="text-xs font-bold text-slate-900 uppercase">{lead.inquirySource}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm min-h-[500px]">
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Lead Activity Timeline</h3>
              <div className="h-px flex-1 bg-slate-100" />
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{timeline.length} Events</p>
            </div>
            <div className="relative pl-8 border-l border-slate-100 space-y-10">
              {timeline.map((item: any) => (
                <div key={item.id} className="relative">
                    <div className={cn(
                      "absolute -left-[2.5rem] top-0 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                      item.type === "MEETING" ? "bg-indigo-600" :
                      item.outcome === "PICKED" ? "bg-emerald-500" :
                      item.outcome === "NOT_PICKED" ? "bg-rose-500" : "bg-slate-800"
                    )}>
                      {item.type === "MEETING" ? <Calendar className="h-3 w-3 text-white" /> :
                       <Phone className="h-3 w-3 text-white" />}
                    </div>
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.createdAt), "dd MMM, h:mm a")}
                      </span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider",
                        item.type === "MEETING" ? "text-indigo-600" :
                        item.outcome === "PICKED" ? "text-emerald-600" :
                        item.outcome === "NOT_PICKED" ? "text-rose-600" : "text-slate-600"
                      )}>
                        {item.type === "MEETING" ? "Site Update" :
                         item.outcome ? `Call: ${item.outcome.replace(/_/g, " ")}` : "Manual Log"}
                        {item.outcome === "NOT_PICKED" && ` (#${item.attemptNumber})`}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed group shadow-sm hover:shadow-md transition-shadow relative">
                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingItem({ ...item });
                            setEditNoteText(item.type === "MEETING" ? item.notes || "" : item.noteGiven || "");
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md border border-transparent hover:border-slate-100 shadow-sm transition-all"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteActivity(item.id, item.type);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md border border-transparent hover:border-slate-100 shadow-sm transition-all z-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {item.type === "MEETING" ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs"><MapPin className="h-3.5 w-3.5 text-indigo-500" /> {item.address}</div>
                          <div className="flex gap-4 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(item.date), "PPP")}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.time}</span>
                          </div>
                          {item.notes && <p className="italic text-slate-600 text-xs border-t border-slate-200 pt-2 leading-relaxed">"{item.notes}"</p>}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap pr-12">
                          {item.noteGiven || <span className="text-slate-400 italic">No documentation provided.</span>}
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

      {/* ─── MODAL: EDIT LEAD ─── */}
      {activeModal === "EDIT" && (
        <Modal title="Edit Lead" icon={<Pencil className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form onSubmit={handleUpdateLead} className="p-8 space-y-6 overflow-y-auto max-h-[65vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Customer Name *"><input required className={inputCls} value={editForm.customerName || ""} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} /></Field>
              <Field label="Phone *"><input required className={inputCls} value={editForm.contactNumber || ""} onChange={e => setEditForm({ ...editForm, contactNumber: e.target.value })} /></Field>
              <Field label="Full Address"><textarea rows={3} className={inputCls} value={editForm.fullAddress || ""} onChange={e => setEditForm({ ...editForm, fullAddress: e.target.value })} /></Field>
              <Field label="Landmark"><input className={inputCls} value={editForm.landmark || ""} onChange={e => setEditForm({ ...editForm, landmark: e.target.value })} /></Field>
              <Field label="Requirement Details"><textarea rows={3} className={inputCls} value={editForm.requirementDetails || ""} onChange={e => setEditForm({ ...editForm, requirementDetails: e.target.value })} /></Field>
              <Field label="Budget Range"><input className={inputCls} placeholder="e.g. 5 - 10 Lakhs" value={editForm.budgetRange || ""} onChange={e => setEditForm({ ...editForm, budgetRange: e.target.value })} /></Field>
            </div>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Update Profile" />
          </form>
        </Modal>
      )}

      {/* ─── MODAL: CALL PICKED ─── */}
      {activeModal === "PICKED" && (
        <Modal title="Log Successful Call" icon={<CheckCircle2 className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
            {/* Conversation Context */}
            {lead.followUps.length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Previous Conversations</p>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {lead.followUps.map((f, i) => f.noteGiven && (
                    <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 border-l-4 border-l-indigo-500">
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-400 mr-2">#{lead.followUps.length - i}</span>
                        {f.noteGiven}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Field label={`Conversation Summary ${lead.followUps.length < 1 ? "*" : "(Optional)"}`}>
              <textarea 
                required={lead.followUps.length < 1} 
                rows={4} 
                className={inputCls}
                placeholder="Mention specific requirements or customer mood..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
              />
            </Field>
            <Field label="Pipeline Outcome">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "INTERESTED", label: "Interested" },
                  { val: "NEXT_DAY", label: "Next Day" },
                  { val: "RESCHEDULE", label: "Wants Recall" },
                  { val: "CANCELLED", label: "Not Interested" },
                ].map(opt => {
                  const isInterestedDisabled = opt.val === "INTERESTED" && lead.followUps.length > 0;
                  return (
                    <button key={opt.val} type="button"
                      disabled={isInterestedDisabled}
                      onClick={() => {
                        setPickedStatus(opt.val);
                        if (opt.val === "NEXT_DAY") {
                           const tomorrow = new Date();
                           tomorrow.setDate(tomorrow.getDate() + 1);
                           setFollowUpDate(tomorrow.toISOString().split('T')[0]);
                        }
                      }}
                      className={cn(
                        "py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                        pickedStatus === opt.val ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                        isInterestedDisabled && "opacity-40 cursor-not-allowed grayscale"
                      )}
                    >{opt.label}</button>
                  );
                })}
              </div>
            </Field>

            {/* Conditional Date Picker */}
            {pickedStatus && (pickedStatus === "INTERESTED" || pickedStatus === "RESCHEDULE") && (
              <Field label="Follow-up Date *">
                <input type="date" required className={inputCls} min={new Date().toISOString().split('T')[0]}
                  value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                />
              </Field>
            )}

            {/* Conditional Time Picker */}
            {pickedStatus && (pickedStatus === "RESCHEDULE" || pickedStatus === "NEXT_DAY") && (
              <Field label="Follow-up Time (Optional)">
                <input type="time" className={inputCls}
                  value={followUpTime} onChange={e => setFollowUpTime(e.target.value)}
                />
              </Field>
            )}
            {pickedStatus === "CANCELLED" && (
              <Field label="Reason for Drop-off">
                <select className={inputCls} value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                  {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
            )}
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Record Activity"
              disabled={
                !pickedStatus ||
                (lead.followUps.length === 0 && !noteContent) || 
                ((pickedStatus === "INTERESTED" || pickedStatus === "RESCHEDULE") && !followUpDate)
              }
              onSubmit={() => post("/api/follow-ups", {
                leadId: id, outcome: "PICKED", noteGiven: noteContent,
                pickedStatus, 
                cancelReason: pickedStatus === "CANCELLED" ? cancelReason : undefined,
                followUpDate,
                followUpTime
              })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: NOT PICKED ─── */}
      {activeModal === "NOT_PICKED" && (
        <Modal title="Log Unanswered Call" icon={<PhoneMissed className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3.5 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                <span className="font-bold">System Note:</span> Lead will be auto-scheduled for a recall tomorrow. Frequent misses lead to auto-archival.
              </p>
            </div>
            <Field label="Brief Observation (Optional)">
              <textarea rows={4} className={inputCls}
                placeholder="Ringing but no answer, switched off..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
              />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Log Attempt"
              onSubmit={() => post("/api/follow-ups", { leadId: id, outcome: "NOT_PICKED", noteGiven: noteContent || null })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: CANCEL LEAD ─── */}
      {activeModal === "CANCEL" && (
        <Modal title="Cancel Lead" icon={<Ban className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3.5 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 font-medium">Inquiry will be moved to the 'Cancelled' tab. You can reactivate this profile anytime.</p>
            </div>
            <Field label="Resolution Reason *">
              <select className={inputCls} value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Final Comment (Optional)">
              <textarea rows={3} className={inputCls} placeholder="Specify if there was any conflict or preference..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)} />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Cancel Lead"
              onSubmit={() => post("/api/follow-ups", { leadId: id, outcome: "CANCELLED", cancelReason, noteGiven: noteContent || null })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: REACTIVATE LEAD ─── */}
      {activeModal === "REACTIVATE" && (
        <Modal title="Restore Opportunity" icon={<RotateCcw className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3.5">
              <p className="text-[11px] text-indigo-700 font-medium">Resetting status to <span className="font-bold underline">FOLLOW UP</span>. This will appear as a fresh activity on your timeline.</p>
            </div>
            <Field label="Reactivation Insight">
              <textarea rows={3} className={inputCls} placeholder="Why is this client back in the pipeline?"
                value={reactivationNote} onChange={e => setReactivationNote(e.target.value)} />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Restore Lead"
              onSubmit={() => post(`/api/leads/${id}/reactivate`, { reactivationNote })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: CONVERT ─── */}
      {activeModal === "CONVERT" && (
        <Modal title="Convert to Customer" icon={<Zap className="h-5 w-5 text-emerald-500" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-800">Ready to formalize this relationship?</p>
              <p className="text-xs text-emerald-600 mt-1">This will move the lead out of your active pipeline and into the Customer Directory.</p>
            </div>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Confirm Conversion"
              onSubmit={handleConvertToCustomer}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: MEETING ─── */}
      {activeModal === "MEETING" && (
        <Modal title="Schedule Site Inspection" icon={<Calendar className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <div className="p-8 space-y-6">
            <Field label="Inspection Address *"><input required className={inputCls} value={meetingForm.address} onChange={e => setMeetingForm({ ...meetingForm, address: e.target.value })} placeholder="Apartment / Office address" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Proposed Date *"><input type="date" required className={inputCls} value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} /></Field>
              <Field label="Proposed Time *"><input type="time" required className={inputCls} value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })} /></Field>
            </div>
            <Field label="Preparation Notes (Optional)"><textarea rows={3} className={inputCls} value={meetingForm.notes} onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })} placeholder="Tools to bring, specific measurements to check..." /></Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Confirm Booking"
              disabled={!meetingForm.address || !meetingForm.date || !meetingForm.time}
              onSubmit={() => post("/api/meetings", { leadId: id, ...meetingForm })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: EDIT ACTIVITY ─── */}
      {editingItem && (
        <Modal title="Edit Activity Note" icon={<Pencil className="h-5 w-5" />} color="primary" onClose={() => setEditingItem(null)}>
          <div className="p-8 space-y-6">
            <Field label="Note Content">
              <textarea 
                rows={5} 
                className={inputCls} 
                value={editNoteText} 
                onChange={e => setEditNoteText(e.target.value)} 
              />
            </Field>
            <ModalFooter 
              onClose={() => setEditingItem(null)} 
              isSubmitting={isSubmitting} 
              label="Save Changes" 
              onSubmit={handleUpdateActivity}
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

function Modal({ title, icon, onClose, children }: {
  title: string; icon: React.ReactNode; color: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="text-indigo-600">{icon}</div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-slate-900"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, isSubmitting, label, disabled, onSubmit }: {
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
          "px-8 py-2.5 rounded-lg text-white font-semibold shadow-md transition-all active:scale-95 disabled:opacity-40 text-sm flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/20"
        )}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {label}
      </button>
    </div>
  );
}
