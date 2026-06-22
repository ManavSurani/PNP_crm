"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Phone, MapPin, FileText, Clock, Zap, Loader2, Pencil, X, CheckCircle2,
  PhoneMissed, Calendar, Check, RotateCcw, Ban, AlertTriangle, ListTodo, Activity, Trash2,
  Banknote, MessageSquare, ChevronRight, ArrowLeft, Globe
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type FollowUp = { 
  id: string; 
  attemptNumber: number; 
  outcome: string; 
  noteGiven: string | null; 
  createdAt: string; 
  completedDate?: string | null;
  nextCallDate?: string | null;
  nextCallTime?: string | null;
};
type Meeting = { id: string; address: string; date: string; time: string; notes: string | null; status: string; createdAt: string };
type LeadNote = { id: string; content: string; createdAt: string };
type LeadTransaction = { id: string; type: "RECEIVED" | "EXPENSE"; amount: number; date: string; createdAt: string; category: string; paidTo: string };

type LeadDetails = {
  id: string; customerName: string; contactNumber: string; alternateNumber: string | null;
  fullAddress: string | null; inquirySource: string; serviceType: string;
  status: string; isCancelled: boolean; cancelReason: string | null;
  createdAt: string; budgetRange: string | null; requirementDetails: string | null;
  siteLocation: string | null; landmark: string | null; preferredVisitTime: string | null;
  assignedStaff?: { id: string; name: string } | null;
  followUps: FollowUp[]; meetings: Meeting[];
  leadNotes: LeadNote[]; transactions: LeadTransaction[];
};

type ModalType = 
  | "EDIT" | "PICKED" | "NOT_PICKED" | "MEETING" | "CANCEL" | "REACTIVATE" | "CONVERT"
  | "COMPLETE_MEETING" | null;

const CANCEL_REASONS = [
  "No Response",
  "Not Interested",
  "Budget Issue",
  "Already Purchased",
  "Wrong Number",
  "Project Postponed",
];

const SERVICE_TYPES = [
  "Interior Design",
  "2BHK Interior",
  "3BHK Interior",
  "4BHK Interior",
  "Raw house",
  "Office",
  "Other",
];


export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
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
  const [editingItem, setEditingItem] = useState<{ id: string; type: "FOLLOW_UP" | "MEETING" | "NOTE" | "TRANSACTION"; noteGiven?: string | null; notes?: string | null; address?: string; date?: string; time?: string; content?: string } | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [completingMeetingId, setCompletingMeetingId] = useState<string | null>(null);
  const [meetingOutcome, setMeetingOutcome] = useState("");
  const [editMeetingDate, setEditMeetingDate] = useState("");
  const [editMeetingTime, setEditMeetingTime] = useState("");

  const handleSaveName = async () => {
    if (!newName.trim() || newName === lead?.customerName) {
      setIsEditingName(false);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: newName }),
      });
      if (res.ok) {
        setIsEditingName(false);
        fetchLead();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLead = async () => {
    if (!id || id === "undefined") return;
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
    setEditError(null);
    setIsEditingAddress(false);
    setCompletingMeetingId(null);
    setMeetingOutcome("");
  };

  const post = async (url: string, body: object) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { 
        closeModal(); 
        fetchLead();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteActivity = async (targetId: string, itemType: "FOLLOW_UP" | "MEETING" | "NOTE" | "TRANSACTION") => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    setIsSubmitting(true);
    try {
      let apiUrl = "";
      switch (itemType) {
        case "FOLLOW_UP": apiUrl = `/api/follow-ups/${targetId}`; break;
        case "MEETING": apiUrl = `/api/meetings/${targetId}`; break;
        case "NOTE": apiUrl = `/api/notes/${targetId}`; break;
        case "TRANSACTION": apiUrl = `/api/transactions/${targetId}`; break;
      }
      
      const res = await fetch(apiUrl, { method: "DELETE" });
      if (res.ok) {
        fetchLead();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      } else {
        const err = await res.json();
        alert(`API Error: ${err.error || "Unknown"}`);
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
      let url = "";
      let body = {};
      
      switch (editingItem.type) {
        case "FOLLOW_UP":
          url = `/api/follow-ups/${editingItem.id}`;
          body = { noteGiven: editNoteText };
          break;
        case "MEETING":
          url = `/api/meetings/${editingItem.id}`;
          body = { notes: editNoteText, date: editMeetingDate || undefined, time: editMeetingTime || undefined };
          break;
        case "NOTE":
          url = `/api/notes/${editingItem.id}`;
          body = { content: editNoteText };
          break;
        default: return; // Transactions not editable from here
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { 
        setEditingItem(null); 
        fetchLead();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleMeetingOutcome = async () => {
    setIsSubmitting(true);
    try {
      // Fetch the old meeting's data to preserve notes
      const oldMeeting = timeline.find((t: any) => t.type === "MEETING" && t.id === completingMeetingId);
      const address = (oldMeeting as any)?.address || lead?.fullAddress || "TBD";
      const existingNotes = (oldMeeting as any)?.notes || "";
      
      if (meetingOutcome === "RESCHEDULE") {
        // Complete the old meeting first
        await fetch(`/api/meetings/${completingMeetingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED", notes: existingNotes }),
        });

        // Create a new meeting (copying ONLY the new summary text)
        await fetch(`/api/meetings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: id, address, date: followUpDate, time: followUpTime, notes: noteContent }),
        });
      } else {
        const appendedNotes = noteContent 
          ? (existingNotes ? `${existingNotes}\n\nOutcome (${meetingOutcome === "RECALL" ? "Recall" : "Not Interested"}): ${noteContent}` : `Outcome (${meetingOutcome === "RECALL" ? "Recall" : "Not Interested"}): ${noteContent}`) 
          : existingNotes;
          
        // Complete the meeting
        await fetch(`/api/meetings/${completingMeetingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED", notes: appendedNotes }),
        });
        
        if (meetingOutcome === "RECALL") {
          await fetch(`/api/follow-ups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              leadId: id, 
              outcome: "PICKED", 
              pickedStatus: "NEXT_DAY", 
              followUpDate, 
              followUpTime, 
              noteGiven: noteContent 
            }),
          });
        } else if (meetingOutcome === "NOT_INTERESTED") {
          await fetch(`/api/follow-ups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId: id, outcome: "CANCELLED", cancelReason: "Not Interested", noteGiven: noteContent }),
          });
        }
      }
      closeModal();
      fetchLead();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { 
        closeModal(); 
        fetchLead();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      } else {
        const err = await res.json();
        setEditError(err.details || err.error || "Failed to update lead");
      }
    } catch (e) { 
      console.error(e); 
      setEditError("Network error. Please try again.");
    }
    finally { setIsSubmitting(false); }
  };

  const handleConvertToCustomer = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${id}/convert`, { method: "POST" });
      if (res.ok) {
        closeModal();
        fetchLead();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      } else {
        const error = await res.json();
        alert(`Conversion Failed: ${error.details || error.error || "Unknown Error"}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Network Error: ${String(e)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>;
  if (!lead) return <div className="p-10 text-center text-slate-500 font-bold">Lead not found.</div>;

  const isLocked = lead.status === "CANCELLED" || lead.status === "WON_ORDER";

  const timeline = [
    ...(lead.followUps || []).filter(f => f.completedDate).map(f => ({ ...f, type: "FOLLOW_UP" as const })),
    ...(lead.meetings || []).map(m => ({ ...m, type: "MEETING" as const })),
    ...(lead.leadNotes || []).map(n => ({ ...n, type: "NOTE" as const })),
    ...(lead.transactions || []).map(t => ({ ...t, type: "TRANSACTION" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Dynamic Sequential Numbering for NOT_PICKED follow-ups
  const notPickedItems = [...timeline].filter(item => item.type === "FOLLOW_UP" && (item as any).outcome === "NOT_PICKED").reverse(); // Oldest first
  const getAttemptNumber = (id: string) => {
    const idx = notPickedItems.findIndex(item => item.id === id);
    return idx !== -1 ? idx + 1 : null;
  };

  const getStatusColor = (item: any) => {
    if (item.type === "MEETING") return "bg-indigo-500";
    if (item.type === "NOTE") return "bg-amber-400";
    if (item.type === "TRANSACTION") return (item as any).type === "RECEIVED" ? "bg-emerald-500" : "bg-rose-500";
    if (item.type === "FOLLOW_UP") {
      switch ((item as any).outcome) {
        case "PICKED": return "bg-emerald-500";
        case "NOT_PICKED": return "bg-rose-500";
        case "MEETING": return "bg-indigo-500";
        case "CANCELLED": return "bg-rose-500";
        case "INTERESTED": return "bg-sky-500";
        default: return "bg-slate-400";
      }
    }
    return "bg-slate-300";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Navigation */}
      <div className="flex items-center justify-between shrink-0">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors group"
        >
          <div className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center group-hover:border-emerald-200 bg-white shadow-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          BACK
        </button>

        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          {lead.isCancelled ? (
            <Link href="/canceled" className="hover:text-rose-600 transition-colors text-rose-400/80">Canceled Archive</Link>
          ) : (
            <Link href="/leads" className="hover:text-emerald-600 transition-colors text-indigo-400/80">Lead Pipeline</Link>
          )}
          <ChevronRight className="h-3 w-3 text-slate-300" /> 
          <span className="text-slate-900 font-black">Details</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-5 -mr-24 -mt-24" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-16 w-16 bg-slate-100 rounded-xl flex shrink-0 items-center justify-center border border-slate-200">
            <span className="text-2xl font-bold text-slate-800 uppercase">{lead.customerName ? lead.customerName.charAt(0) : "?"}</span>
          </div>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  className="text-xl font-semibold text-slate-900 tracking-tight border-b-2 border-indigo-500 outline-none bg-transparent py-0.5"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  onBlur={handleSaveName}
                />
                <button onClick={handleSaveName} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setIsEditingName(false)} className="p-1 text-slate-400 hover:bg-slate-50 rounded-md transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group/name">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{lead.customerName || "Unnamed Lead"}</h1>
                {!isLocked && (
                  <button 
                    onClick={() => {
                      setNewName(lead.customerName || "");
                      setIsEditingName(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-all opacity-0 group-hover/name:opacity-100"
                    title="Edit Name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-3 py-1 rounded-md border border-slate-200"><Phone className="h-3.5 w-3.5 text-indigo-600" /> {lead.contactNumber}</span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-3 py-1 rounded-md border border-slate-200 uppercase"><FileText className="h-3.5 w-3.5 text-slate-400" /> {lead.serviceType.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:items-end relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.open(`https://wa.me/${lead.contactNumber.replace(/\D/g, "")}`, "_blank");
              }}
              className="h-9 w-9 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md shadow-emerald-100 border border-emerald-200 group"
              title="WhatsApp Message"
            >
              <svg 
                className="h-5 w-5 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.122.541 4.195 1.57 6.04L0 24l6.104-1.602a11.83 11.83 0 005.937 1.57h.005c6.632 0 12.029-5.392 12.033-12.031a11.82 11.82 0 00-3.376-8.411z" />
              </svg>
            </button>
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
            {isLocked ? (
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
                  <button onClick={() => setActiveModal("PICKED")} className="bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                    <CheckCircle2 className="h-5 w-5" /> Picked
                  </button>
                  <button onClick={() => setActiveModal("NOT_PICKED")} className="bg-rose-600 hover:bg-rose-700 py-3 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                    <PhoneMissed className="h-5 w-5" /> No Answer
                  </button>
                </div>
                <button 
                  onClick={() => { 
                    setMeetingForm(prev => ({ ...prev, address: lead.fullAddress || "" })); 
                    setActiveModal("MEETING"); 
                  }} 
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm mt-3"
                >
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
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{lead.fullAddress || "Not specified"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Zap className="h-3 w-3" /> Requirement</p>
                <p className="text-sm text-slate-800 font-medium">{lead.requirementDetails || "No details provided"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Area / City</p>
                  <p className="text-xs font-bold text-slate-900 truncate">Surat</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Source</p>
                  <p className="text-xs font-bold text-slate-900 uppercase">{lead.inquirySource}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Interested Service</p>
                  <p className="text-xs font-bold text-slate-900 uppercase font-bold">{lead.serviceType.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Activity Timeline</h3>
              </div>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                {timeline.length} Events
              </span>
            </div>

            <div className="flex-1 overflow-auto max-h-[750px] scrollbar-thin scrollbar-thumb-slate-200">
              <div className="divide-y divide-slate-100">
                {timeline.map((item: any) => (
                  <div key={item.id} className="group relative flex hover:bg-slate-50/50 transition-all">
                    {/* Status Bar */}
                    <div className={cn("w-1.5 self-stretch shrink-0", getStatusColor(item))} />
                    
                    <div className="flex-1 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shadow-sm border",
                            item.type === "MEETING" ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                            item.type === "NOTE" ? "bg-amber-50 border-amber-100 text-amber-600" :
                            item.type === "TRANSACTION" ? (item.type === "RECEIVED" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600") :
                            "bg-slate-50 border-slate-100 text-slate-600"
                          )}>
                            {item.type === "MEETING" ? <Calendar className="h-3.5 w-3.5" /> :
                             item.type === "NOTE" ? <MessageSquare className="h-3.5 w-3.5" /> :
                             item.type === "TRANSACTION" ? <Banknote className="h-3.5 w-3.5" /> :
                             <Phone className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 leading-none">
                              {item.type === "MEETING" ? "Site Visit" :
                               item.type === "NOTE" ? "Internal Note" :
                               item.type === "TRANSACTION" ? (item.type === "RECEIVED" ? "Payment In" : "Expense Out") :
                               `Call Attempt: ${item.outcome?.replace(/_/g, " ") || "Manual Log"}`}
                              {item.type === "FOLLOW_UP" && item.outcome === "NOT_PICKED" && ` (#${getAttemptNumber(item.id)})`}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {format(new Date(item.createdAt), "dd MMM, yyyy · h:mm a")}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {!isLocked && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.type === "MEETING" && (item as any).status === "SCHEDULED" && (
                              <button
                                onClick={() => {
                                  setCompletingMeetingId(item.id);
                                  setActiveModal("COMPLETE_MEETING");
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all"
                                title="Complete Visit"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setEditingItem({ ...item });
                                let initialText = "";
                                if (item.type === "MEETING") {
                                  initialText = item.notes || "";
                                  setEditMeetingDate((item as any).date ? new Date((item as any).date).toISOString().split('T')[0] : "");
                                  setEditMeetingTime((item as any).time || "");
                                }
                                else if (item.type === "NOTE") initialText = item.content || "";
                                else if (item.type === "FOLLOW_UP") initialText = item.noteGiven || "";
                                setEditNoteText(initialText);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteActivity(item.id, item.type);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pl-10 pr-4">
                        {item.type === "MEETING" ? (
                          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                            <div className="flex items-start gap-2 text-slate-900 font-bold text-[11px]">
                              <MapPin className="h-3.5 w-3.5 text-indigo-500 mt-0.5" /> 
                              <span className="leading-relaxed">{item.address}</span>
                            </div>
                            <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100"><Calendar className="h-3 w-3 text-slate-400" /> {format(new Date(item.date), "dd MMM, yyyy")}</span>
                              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100"><Clock className="h-3 w-3 text-slate-400" /> {item.time}</span>
                            </div>
                            {item.notes && <p className="text-[11px] text-slate-600 bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-100/50 italic leading-relaxed">"{item.notes}"</p>}
                          </div>
                        ) : item.type === "TRANSACTION" ? (
                          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                             <div className="flex flex-col gap-1">
                               <span className="text-sm font-black text-slate-900">₹{item.amount.toLocaleString()}</span>
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Paid to: {item.paidTo}</span>
                             </div>
                             <span className={cn(
                               "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                               item.type === "RECEIVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                             )}>
                               {item.category}
                             </span>
                          </div>
                        ) : item.type === "NOTE" ? (
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {item.content}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {item.nextCallDate && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-lg w-fit">
                                 <Calendar className="h-3 w-3 text-indigo-500" />
                                 <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                                   Next Call: {format(new Date(item.nextCallDate), "dd MMM, yyyy")}
                                   {item.nextCallTime && ` @ ${item.nextCallTime}`}
                                 </span>
                              </div>
                            )}
                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                              {item.noteGiven || <span className="text-slate-300 italic">No conversation summary logged.</span>}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {timeline.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4 opacity-50">
                      <Activity className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Activity stream is empty</p>
                    <p className="text-[10px] text-slate-300 mt-1 font-medium">Log an outcome to start the pipeline.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL: EDIT LEAD ─── */}
      {activeModal === "EDIT" && (
        <Modal title="Edit Lead" icon={<Pencil className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form onSubmit={handleUpdateLead} className="p-8 space-y-6 overflow-y-auto max-h-[65vh]">
            {editError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700 mb-6">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-semibold">{editError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Right Column (Focus 1st) */}
              <div className="md:col-start-2">
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
              </div>

              {/* Left Column (Focus 2nd) */}
              <div className="md:col-start-1 md:row-start-1">
                <Field label="Customer Name"><input className={inputCls} value={editForm.customerName || ""} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} /></Field>
              </div>

              <Field label="Address"><input className={inputCls} value={editForm.fullAddress || ""} onChange={e => setEditForm({ ...editForm, fullAddress: e.target.value })} /></Field>
              <Field label="Interested Service">
                <select 
                  className={inputCls} 
                  value={editForm.serviceType || "OTHER"} 
                  onChange={e => setEditForm({ ...editForm, serviceType: e.target.value as any })}
                >
                  {SERVICE_TYPES.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </Field>
              <Field label="Requirement Details" className="md:col-span-2"><textarea rows={3} className={inputCls} value={editForm.requirementDetails || ""} onChange={e => setEditForm({ ...editForm, requirementDetails: e.target.value })} /></Field>
            </div>
            

            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Update Profile" />
          </form>
        </Modal>
      )}

      {/* ─── MODAL: CALL PICKED ─── */}
      {activeModal === "PICKED" && (
        <Modal title="Log Successful Call" icon={<CheckCircle2 className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              post("/api/follow-ups", {
                leadId: id, outcome: "PICKED", noteGiven: noteContent,
                pickedStatus, 
                cancelReason: pickedStatus === "CANCELLED" ? cancelReason : undefined,
                followUpDate,
                followUpTime,
                meetingAddress: pickedStatus === "MEETING" ? meetingForm.address : undefined,
                meetingDate: pickedStatus === "MEETING" ? meetingForm.date : undefined,
                meetingTime: pickedStatus === "MEETING" ? meetingForm.time : undefined,
                meetingNotes: pickedStatus === "MEETING" ? noteContent : undefined
              });
            }}
            className="flex flex-col h-full"
          >
            <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh] flex-1">

            {/* Consolidated Historical Context */}
            {(() => {
              const allNotes = [
                ...(lead.followUps || []).map(f => ({ id: f.id, content: f.noteGiven, date: f.completedDate || f.createdAt })),
                ...(lead.leadNotes || []).map(n => ({ id: n.id, content: n.content, date: n.createdAt }))
              ]
              .filter(n => n.content)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return allNotes.length > 0 && (
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Previous Conversations & Notes</p>
                  <hr className="border-slate-200" />
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {allNotes.map((note, index) => (
                      <div key={note.id} className="space-y-3">
                        <div className="flex gap-3">
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">#{allNotes.length - index}</span>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            {note.content}
                          </p>
                        </div>
                        {index < allNotes.length - 1 && <hr className="border-slate-100" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <Field label={`Conversation Summary ${lead.followUps.filter(f => f.completedDate).length === 0 ? "*" : "(Optional)"}`}>
              <textarea 
                required={lead.followUps.filter(f => f.completedDate).length === 0} 
                rows={4} 
                className={inputCls}
                placeholder="Mention specific requirements or customer mood..."
                value={noteContent} onChange={e => setNoteContent(e.target.value)}
              />
            </Field>
            <Field label="Pipeline Outcome">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { val: "INTERESTED", label: "Interested" },
                  { val: "MEETING", label: "Book Site Visit" },
                  { val: "NEXT_DAY", label: "Next Day" },
                  { val: "RESCHEDULE", label: "Wants Recall" },
                  { val: "CANCELLED", label: "Not Interested" },
                ].map(opt => {
                  const hasSuccessfulCall = lead.followUps.some(f => f.outcome === "PICKED" && f.completedDate);
                  const isInterestedDisabled = opt.val === "INTERESTED" && hasSuccessfulCall;
                  
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
                        if (opt.val === "MEETING") {
                           setMeetingForm(prev => ({ ...prev, address: lead.fullAddress || "" }));
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

            {/* Conditional Meeting Form */}
            {pickedStatus === "MEETING" && (
              <div className="space-y-4 p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-bold text-indigo-900 uppercase tracking-tight">Schedule Site Visit</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Visit Date *">
                    <input type="date" required className={inputCls} min={new Date().toISOString().split('T')[0]}
                      value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    />
                  </Field>
                  <Field label="Visit Time">
                    <input type="time" className={inputCls}
                      value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Site Address *">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      required
                      className="block w-full rounded-lg border border-slate-200 py-2.5 pl-11 bg-white text-slate-900 placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 text-sm transition-all outline-none"
                      placeholder="Confirm site address..."
                      value={meetingForm.address}
                      onChange={e => setMeetingForm({ ...meetingForm, address: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
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
            </div>
            <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Record Activity"
              disabled={
                !pickedStatus ||
                (lead.followUps.filter(f => f.completedDate).length === 0 && !noteContent) || 
                ((pickedStatus === "INTERESTED" || pickedStatus === "RESCHEDULE") && !followUpDate) ||
                (pickedStatus === "MEETING" && (!meetingForm.date || !meetingForm.address))
              }
            />
          </form>
        </Modal>
      )}

      {/* ─── MODAL: NOT PICKED ─── */}
      {activeModal === "NOT_PICKED" && (
        <Modal title="Log Unanswered Call" icon={<PhoneMissed className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            post("/api/follow-ups", { leadId: id, outcome: "NOT_PICKED", noteGiven: noteContent || null });
          }}>
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

              <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Log Attempt" />
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: CANCEL LEAD ─── */}
      {activeModal === "CANCEL" && (
        <Modal title="Cancel Lead" icon={<Ban className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            post("/api/follow-ups", { leadId: id, outcome: "CANCELLED", cancelReason, noteGiven: noteContent || null });
          }}>
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

              <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Cancel Lead" />
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: REACTIVATE LEAD ─── */}
      {activeModal === "REACTIVATE" && (
        <Modal title="Restore Opportunity" icon={<RotateCcw className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            post(`/api/leads/${id}/reactivate`, { reactivationNote });
          }}>
            <div className="p-8 space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3.5">
                <p className="text-[11px] text-indigo-700 font-medium">Resetting status to <span className="font-bold underline">FOLLOW UP</span>. This will appear as a fresh activity on your timeline.</p>
              </div>
              <Field label="Reactivation Insight">
                <textarea rows={3} className={inputCls} placeholder="Why is this client back in the pipeline?"
                  value={reactivationNote} onChange={e => setReactivationNote(e.target.value)} />
              </Field>
              <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Restore Lead" />
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: CONVERT ─── */}
      {activeModal === "CONVERT" && (
        <Modal title="Convert to Customer" icon={<Zap className="h-5 w-5 text-emerald-500" />} color="primary" onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleConvertToCustomer();
          }}>
            <div className="p-8 space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-800">Ready to formalize this relationship?</p>
                <p className="text-xs text-emerald-600 mt-1">This will move the lead out of your active pipeline and into the Customer Directory.</p>
              </div>
              <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Confirm Conversion" />
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: MEETING ─── */}
      {activeModal === "MEETING" && (
        <Modal title="Schedule Site Inspection" icon={<Calendar className="h-5 w-5" />} color="primary" onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            post("/api/meetings", { leadId: id, ...meetingForm });
          }}>
            <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-start-2">
                  <Field label="Proposed Time (Optional)">
                    <input type="time" className={inputCls} value={meetingForm.time} onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })} />
                  </Field>
                </div>
                <div className="col-start-1 row-start-1">
                  <Field label="Proposed Date *">
                    <input type="date" required className={inputCls} value={meetingForm.date} onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })} />
                  </Field>
                </div>
              </div>

              <Field label={lead.fullAddress && !isEditingAddress ? "Site Address (Reference)" : "Site Address *"}>
                {lead.fullAddress && !isEditingAddress ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between gap-3 group">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {lead.fullAddress}
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsEditingAddress(true)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all border border-transparent hover:border-slate-100"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        required
                        className="block w-full rounded-lg border border-slate-200 py-2.5 pl-11 bg-white text-slate-900 placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 text-sm transition-all outline-none"
                        placeholder="Enter full site address..."
                        value={meetingForm.address}
                        onChange={e => setMeetingForm({ ...meetingForm, address: e.target.value })}
                      />
                    </div>
                    {isEditingAddress && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (meetingForm.address.trim()) {
                            setLead(prev => prev ? { ...prev, fullAddress: meetingForm.address } : null);
                            setIsEditingAddress(false);
                          }
                        }}
                        className="px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
                      >
                        Save
                      </button>
                    )}
                  </div>
                )}
              </Field>

              <Field label="Preparation Notes (Optional)">
                <textarea rows={3} className={inputCls} value={meetingForm.notes} onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })} placeholder="Tools to bring, specific measurements to check..." />
              </Field>

              <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Confirm Booking"
                disabled={!meetingForm.date || !meetingForm.address}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL: EDIT ACTIVITY ─── */}
      {editingItem && (
        <Modal title={editingItem.type === "MEETING" ? "Edit Site Visit" : "Edit Activity Note"} icon={<Pencil className="h-5 w-5" />} color="primary" onClose={() => setEditingItem(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdateActivity();
          }}>
            <div className="p-8 space-y-6">
            {editingItem.type === "MEETING" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Visit Date *">
                  <input type="date" required className={inputCls} value={editMeetingDate} onChange={e => setEditMeetingDate(e.target.value)} />
                </Field>
                <Field label="Visit Time">
                  <input type="time" className={inputCls} value={editMeetingTime} onChange={e => setEditMeetingTime(e.target.value)} />
                </Field>
              </div>
            )}
            <Field label={editingItem.type === "MEETING" ? "Preparation Notes" : "Note Content"}>
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
            />
          </div>
        </form>
      </Modal>
      )}

      {/* ─── MODAL: COMPLETE MEETING ─── */}
      {activeModal === "COMPLETE_MEETING" && (
        <Modal title="Complete Site Visit" icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} color="primary" onClose={closeModal}>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleMeetingOutcome();
          }}>
            <div className="p-8 space-y-6">
              <Field label="Visit Outcome *">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { val: "RECALL", label: "Want to recall" },
                    { val: "RESCHEDULE", label: "Reschedule the visit" },
                    { val: "NOT_INTERESTED", label: "Not interested" },
                  ].map(opt => (
                    <button key={opt.val} type="button"
                      onClick={() => setMeetingOutcome(opt.val)}
                      className={cn(
                        "py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                        meetingOutcome === opt.val ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >{opt.label}</button>
                  ))}
                </div>
              </Field>

              {(meetingOutcome === "RECALL" || meetingOutcome === "RESCHEDULE") && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label={meetingOutcome === "RECALL" ? "Recall Date *" : "New Date *"}>
                    <input type="date" required className={inputCls} min={new Date().toISOString().split('T')[0]}
                      value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                    />
                  </Field>
                  <Field label="Time (Optional)">
                    <input type="time" className={inputCls}
                      value={followUpTime} onChange={e => setFollowUpTime(e.target.value)}
                    />
                  </Field>
                </div>
              )}

              <Field label="Summary Notes (Optional)">
                <textarea rows={3} className={inputCls} placeholder="Add any details about the outcome..."
                  value={noteContent} onChange={e => setNoteContent(e.target.value)} />
              </Field>

              <ModalFooter onClose={closeModal} isSubmitting={isSubmitting} label="Complete Visit" 
                disabled={
                  !meetingOutcome || 
                  ((meetingOutcome === "RECALL" || meetingOutcome === "RESCHEDULE") && !followUpDate)
                }
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-slate-200 bg-white py-2.5 px-4 text-slate-900 font-medium placeholder:text-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none text-sm";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
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
      <button type="button" onClick={onClose} className="text-rose-500 font-semibold text-sm hover:text-rose-700 transition-colors px-4">Cancel</button>
      <button
        type="submit"
        disabled={disabled || isSubmitting}
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
