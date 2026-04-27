"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import {
  Phone, MapPin, FileText, Clock, Zap, Loader2, Pencil, X, CheckCircle2,
  PhoneMissed, Calendar, Check, RotateCcw, Ban, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

type Note = { id: string; content: string; createdAt: string };
type FollowUp = { id: string; attemptNumber: number; outcome: string; noteGiven: string | null; createdAt: string };
type Meeting = { id: string; address: string; date: string; time: string; notes: string | null; status: string; createdAt: string };

type LeadDetails = {
  id: string; customerName: string; contactNumber: string; alternateNumber: string | null;
  fullAddress: string | null; inquirySource: string; serviceType: string; priority: string;
  status: string; isCancelled: boolean; cancelReason: string | null;
  createdAt: string; budgetRange: string | null; requirementDetails: string | null;
  siteLocation: string | null; landmark: string | null; preferredVisitTime: string | null;
  assignedStaff?: { id: string; name: string } | null;
  notes: Note[]; followUps: FollowUp[]; meetings: Meeting[];
};

type ModalType = "EDIT" | "PICKED" | "NOT_PICKED" | "MEETING" | "CANCEL" | "REACTIVATE" | null;

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
  const [pickedStatus, setPickedStatus] = useState("INTERESTED");
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [reactivationNote, setReactivationNote] = useState("");
  const [meetingForm, setMeetingForm] = useState({ address: "", date: "", time: "", notes: "" });
  const [editForm, setEditForm] = useState<Partial<LeadDetails>>({});

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      setLead(data);
      setEditForm(data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLead(); }, [id]);

  const closeModal = () => {
    setActiveModal(null);
    setNoteContent("");
    setPickedStatus("INTERESTED");
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

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>;
  if (!lead) return <div className="p-10 text-center text-slate-500 font-bold">Lead not found.</div>;

  const timeline = [
    ...lead.notes.map(n => ({ ...n, type: "NOTE" as const })),
    ...lead.followUps.map(f => ({ ...f, type: "FOLLOW_UP" as const })),
    ...lead.meetings.map(m => ({ ...m, type: "MEETING" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isCancelled = lead.status === "CANCELLED";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-slate-900 border-b-4 border-indigo-600 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 to-transparent pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-20 w-20 bg-white rounded-3xl flex shrink-0 items-center justify-center border-4 border-indigo-500 shadow-2xl">
            <span className="text-3xl font-black text-slate-900 uppercase">{lead.customerName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase">{lead.customerName}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-2 text-indigo-100 font-bold bg-white/10 px-3 py-1 rounded-lg"><Phone className="h-4 w-4" /> {lead.contactNumber}</span>
              <span className="flex items-center gap-2 text-slate-300 font-bold bg-white/5 px-3 py-1 rounded-lg uppercase"><FileText className="h-4 w-4" /> {lead.serviceType.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end relative z-10">
          <span className={cn(
            "inline-flex items-center rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest shadow-lg",
            lead.status === "NEW_INQUIRY" ? "bg-amber-500 text-white" :
            lead.status === "WON_ORDER" ? "bg-emerald-500 text-white" :
            lead.status === "CANCELLED" ? "bg-rose-500 text-white" :
            lead.status === "MEETING_SCHEDULED" ? "bg-indigo-500 text-white" :
            "bg-sky-500 text-white"
          )}>
            {lead.status.replace(/_/g, " ")}
          </span>
          {lead.cancelReason && <p className="text-xs text-rose-300 font-bold uppercase">Reason: {lead.cancelReason}</p>}
          <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
            Priority: <span className={lead.priority === "HIGH" ? "text-rose-400" : "text-amber-400"}>{lead.priority}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Operations Hub */}
          <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl text-white">
            <h3 className="text-lg font-black mb-5 flex items-center gap-3 uppercase tracking-tight">
              <Zap className="h-5 w-5 text-amber-400 fill-amber-400" /> Operations Hub
            </h3>
            {isCancelled ? (
              // CANCELLED STATE — Show Reactivate
              <div className="space-y-3">
                <div className="bg-rose-900/50 border border-rose-800 rounded-2xl p-4 text-center">
                  <Ban className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                  <p className="text-rose-300 font-bold text-xs uppercase tracking-widest">Lead Cancelled</p>
                  {lead.cancelReason && <p className="text-rose-400 text-xs mt-1 italic">{lead.cancelReason}</p>}
                </div>
                <button
                  onClick={() => setActiveModal("REACTIVATE")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                >
                  <RotateCcw className="h-5 w-5" /> Reactivate Lead
                </button>
              </div>
            ) : (
              // ACTIVE STATE — Show Actions
              <div className="space-y-3">
                <button onClick={() => setActiveModal("PICKED")} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                  <CheckCircle2 className="h-5 w-5" /> Call Picked
                </button>
                <button onClick={() => setActiveModal("NOT_PICKED")} className="w-full bg-rose-600 hover:bg-rose-500 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                  <PhoneMissed className="h-5 w-5" /> Not Picked
                </button>
                <button onClick={() => setActiveModal("MEETING")} className="w-full bg-white text-slate-900 hover:bg-slate-100 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 uppercase tracking-widest border-2 border-indigo-200">
                  <Calendar className="h-5 w-5 text-indigo-600" /> Set Site Meeting
                </button>
                <div className="pt-1 border-t border-slate-700">
                  <button onClick={() => setActiveModal("CANCEL")} className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-slate-400 hover:text-rose-400 mt-2">
                    <Ban className="h-4 w-4" /> Mark as Cancelled
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Core Lead File */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 relative">
            <button onClick={() => { setEditForm(lead); setActiveModal("EDIT"); }} className="absolute top-6 right-6 p-3 text-slate-400 hover:text-white hover:bg-indigo-600 rounded-2xl transition-all">
              <Pencil className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Core Lead File</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><MapPin className="h-3 w-3 text-indigo-600" /> Location</p>
                <p className="text-sm text-slate-900 font-bold">{lead.fullAddress || "Not set"}</p>
                {lead.landmark && <p className="text-xs text-slate-500 mt-1 italic">Near: {lead.landmark}</p>}
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Zap className="h-3 w-3 text-amber-500" /> Requirement</p>
                <p className="text-sm text-slate-900 font-bold">{lead.requirementDetails || "Not specified"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Budget</p>
                  <p className="text-sm font-black text-indigo-700">{lead.budgetRange || "Flexible"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</p>
                  <p className="text-sm font-black text-slate-800 uppercase">{lead.inquirySource}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 min-h-[600px]">
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Activity Timeline</h3>
              <div className="h-px flex-1 bg-slate-100" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{timeline.length} Events</p>
            </div>
            <div className="relative pl-8 border-l-4 border-slate-100 space-y-12">
              {timeline.map((item: any) => (
                <div key={item.id} className="relative">
                  <div className={cn(
                    "absolute -left-[3.25rem] top-0 h-10 w-10 rounded-xl border-4 border-white shadow-lg flex items-center justify-center",
                    item.type === "MEETING" ? "bg-indigo-600" :
                    item.outcome === "PICKED" ? "bg-emerald-600" :
                    item.outcome === "NOT_PICKED" ? "bg-rose-600" : "bg-slate-800"
                  )}>
                    {item.type === "MEETING" ? <Calendar className="h-4 w-4 text-white" /> :
                     item.type === "NOTE" ? <FileText className="h-4 w-4 text-white" /> :
                     <Phone className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                      <span className="px-3 py-1 bg-slate-900 rounded-lg text-[10px] font-black text-white flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.createdAt), "dd MMM yyyy • h:mm a")}
                      </span>
                      <span className={cn("text-xs font-black uppercase tracking-widest",
                        item.type === "MEETING" ? "text-indigo-600" :
                        item.outcome === "PICKED" ? "text-emerald-600" :
                        item.outcome === "NOT_PICKED" ? "text-rose-600" : "text-slate-700"
                      )}>
                        {item.type === "MEETING" ? "Site Visit" :
                         item.outcome ? `Call: ${item.outcome.replace("_", " ")}` : "Note"}
                        {item.outcome === "NOT_PICKED" && ` — Attempt #${item.attemptNumber}`}
                      </span>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border-2 border-slate-50 text-sm text-slate-900 font-bold shadow-sm">
                      {item.type === "MEETING" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-indigo-700 font-black"><MapPin className="h-4 w-4" /> {item.address}</div>
                          <div className="flex gap-4 text-slate-600">
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-indigo-400" /> {format(new Date(item.date), "PPP")}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-indigo-400" /> {item.time}</span>
                          </div>
                          {item.notes && <p className="italic text-slate-500 border-t pt-2">"{item.notes}"</p>}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {item.content || item.noteGiven || <span className="text-slate-400 italic">No note recorded.</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <div className="text-center py-24 text-slate-300">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p className="font-black uppercase tracking-widest text-sm">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL: EDIT LEAD ─── */}
      {activeModal === "EDIT" && (
        <Modal title="Edit Lead" icon={<Pencil className="h-6 w-6" />} color="indigo" onClose={closeModal}>
          <form onSubmit={handleUpdateLead} className="p-10 space-y-6 overflow-y-auto max-h-[65vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Customer Name *"><input required className={inputCls} value={editForm.customerName || ""} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} /></Field>
              <Field label="Phone *"><input required className={inputCls} value={editForm.contactNumber || ""} onChange={e => setEditForm({ ...editForm, contactNumber: e.target.value })} /></Field>
              <Field label="Full Address"><textarea rows={3} className={inputCls} value={editForm.fullAddress || ""} onChange={e => setEditForm({ ...editForm, fullAddress: e.target.value })} /></Field>
              <Field label="Landmark"><input className={inputCls} value={editForm.landmark || ""} onChange={e => setEditForm({ ...editForm, landmark: e.target.value })} /></Field>
              <Field label="Requirement Details"><textarea rows={3} className={inputCls} value={editForm.requirementDetails || ""} onChange={e => setEditForm({ ...editForm, requirementDetails: e.target.value })} /></Field>
              <Field label="Budget Range"><input className={inputCls} placeholder="e.g. 5 - 10 Lakhs" value={editForm.budgetRange || ""} onChange={e => setEditForm({ ...editForm, budgetRange: e.target.value })} /></Field>
            </div>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Save Changes" />
          </form>
        </Modal>
      )}

      {/* ─── MODAL: CALL PICKED ─── */}
      {activeModal === "PICKED" && (
        <Modal title="Call Picked" icon={<CheckCircle2 className="h-6 w-6" />} color="emerald" onClose={closeModal}>
          <div className="p-10 space-y-6">
            <Field label="What happened? (Required) *">
              <textarea required rows={4} className={inputCls}
                placeholder="Customer said they're interested in modular kitchen, wants site visit next week..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
              />
            </Field>
            <Field label="Outcome Status">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: "INTERESTED", label: "Interested", color: "emerald" },
                  { val: "MEETING", label: "Meeting Set", color: "indigo" },
                  { val: "RESCHEDULE", label: "Call Later", color: "amber" },
                  { val: "CANCELLED", label: "Cancelled", color: "rose" },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setPickedStatus(opt.val)}
                    className={cn(
                      "py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all",
                      pickedStatus === opt.val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    )}
                  >{opt.label}</button>
                ))}
              </div>
            </Field>
            {pickedStatus === "CANCELLED" && (
              <Field label="Cancellation Reason">
                <select className={inputCls} value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                  {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>
            )}
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Log Activity"
              disabled={!noteContent}
              color="emerald"
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
        <Modal title="Not Picked" icon={<PhoneMissed className="h-6 w-6" />} color="rose" onClose={closeModal}>
          <div className="p-10 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-amber-800">Auto-Reschedule Active</p>
                <p className="text-xs text-amber-700 mt-0.5">Next follow-up will be set for tomorrow automatically. After 4 attempts, lead will be auto-cancelled.</p>
              </div>
            </div>
            <Field label="Note (Optional)">
              <textarea rows={4} className={inputCls}
                placeholder="Phone switched off, ringing only, busy tone... (optional)"
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
              />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Log Attempt" color="rose"
              onSubmit={() => post("/api/follow-ups", { leadId: id, outcome: "NOT_PICKED", noteGiven: noteContent || null })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: CANCEL LEAD ─── */}
      {activeModal === "CANCEL" && (
        <Modal title="Cancel Lead" icon={<Ban className="h-6 w-6" />} color="rose" onClose={closeModal}>
          <div className="p-10 space-y-6">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-bold">Lead will not be deleted. You can reactivate it at any time.</p>
            </div>
            <Field label="Cancellation Reason *">
              <select className={inputCls} value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Additional Note (Optional)">
              <textarea rows={3} className={inputCls} placeholder="Any extra context..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)} />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Confirm Cancellation" color="rose"
              onSubmit={() => post("/api/follow-ups", { leadId: id, outcome: "CANCELLED", cancelReason, noteGiven: noteContent || null })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: REACTIVATE LEAD ─── */}
      {activeModal === "REACTIVATE" && (
        <Modal title="Reactivate Lead" icon={<RotateCcw className="h-6 w-6" />} color="indigo" onClose={closeModal}>
          <div className="p-10 space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
              <p className="text-sm text-indigo-700 font-bold">Lead status will be reset to <span className="text-indigo-900">FOLLOW UP</span>. A reactivation note will be added to the timeline.</p>
            </div>
            <Field label="Why are you reactivating? (Optional)">
              <textarea rows={3} className={inputCls} placeholder="Customer called back and showed renewed interest..."
                value={reactivationNote} onChange={e => setReactivationNote(e.target.value)} />
            </Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Reactivate Lead" color="indigo"
              onSubmit={() => post(`/api/leads/${id}/reactivate`, { reactivationNote })}
            />
          </div>
        </Modal>
      )}

      {/* ─── MODAL: MEETING ─── */}
      {activeModal === "MEETING" && (
        <Modal title="Book Site Visit" icon={<Calendar className="h-6 w-6" />} color="indigo" onClose={closeModal}>
          <div className="p-10 space-y-6">
            <Field label="Meeting Address *"><input required className={inputCls} value={meetingForm.address} onChange={e => setMeetingForm({ ...meetingForm, address: e.target.value })} placeholder="B-701, Samrat Skyline..." /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date *"><input type="date" required className={inputCls} value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} /></Field>
              <Field label="Time *"><input type="time" required className={inputCls} value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })} /></Field>
            </div>
            <Field label="Meeting Notes (Optional)"><textarea rows={3} className={inputCls} value={meetingForm.notes} onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })} placeholder="Agenda, specific items to discuss..." /></Field>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Confirm Booking" color="indigo"
              disabled={!meetingForm.address || !meetingForm.date || !meetingForm.time}
              onSubmit={() => post("/api/meetings", { leadId: id, ...meetingForm })}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

const inputCls = "w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-slate-900 font-bold placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, icon, color, onClose, children }: {
  title: string; icon: React.ReactNode; color: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={cn(
          "px-10 py-8 flex items-center justify-between",
          color === "emerald" ? "bg-emerald-600" : color === "rose" ? "bg-rose-600" : "bg-indigo-600"
        )}>
          <div className="flex items-center gap-4 text-white">
            <div className="bg-white/20 p-3 rounded-2xl">{icon}</div>
            <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/20 rounded-2xl transition-all text-white"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, isSubmitting, label, disabled, color = "slate", onSubmit }: {
  onClose: () => void; isSubmitting: boolean; label: string; disabled?: boolean; color?: string; onSubmit?: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
      <button type={onSubmit ? "button" : "submit"} onClick={onClose} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-900 transition-colors px-4">Cancel</button>
      <button
        type={onSubmit ? "button" : "submit"}
        disabled={disabled || isSubmitting}
        onClick={onSubmit}
        className={cn(
          "px-10 py-4 rounded-2xl text-white font-black shadow-xl transition-all active:scale-95 disabled:opacity-40 text-sm uppercase tracking-widest flex items-center gap-2",
          color === "emerald" ? "bg-emerald-600 hover:bg-emerald-700" :
          color === "rose" ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-black"
        )}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {label}
      </button>
    </div>
  );
}
