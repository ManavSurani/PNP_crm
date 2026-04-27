"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import { 
  Phone, MapPin, User, FileText, CalendarCheck, MoreHorizontal, 
  MessageSquarePlus, Clock, Zap, Loader2, Pencil, X, CheckCircle2,
  AlertCircle, PhoneMissed, Calendar, Map, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

type Note = { id: string; content: string; createdAt: string; };
type FollowUp = { id: string; attemptNumber: number; outcome: string; noteGiven: string | null; createdAt: string; };
type Meeting = { id: string; address: string; date: string; time: string; notes: string | null; status: string; createdAt: string; };

type LeadDetails = {
  id: string; customerName: string; contactNumber: string; alternateNumber: string | null;
  fullAddress: string | null; inquirySource: string; serviceType: string; priority: string;
  status: string; createdAt: string; budgetRange: string | null; requirementDetails: string | null;
  siteLocation: string | null; landmark: string | null; preferredVisitTime: string | null;
  assignedStaff?: { id: string; name: string } | null;
  notes: Note[]; followUps: FollowUp[]; meetings: Meeting[];
};

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [activeModal, setActiveModal] = useState<"EDIT" | "PICKED" | "NOT_PICKED" | "MEETING" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [noteContent, setNoteContent] = useState("");
  const [meetingForm, setMeetingForm] = useState({ address: "", date: "", time: "", notes: "" });
  const [editForm, setEditForm] = useState<Partial<LeadDetails>>({});

  const fetchLeadDetails = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      setLead(data);
      setEditForm(data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLeadDetails(); }, [id]);

  const handleAction = async (url: string, body: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id, ...body })
      });
      if (res.ok) {
        setActiveModal(null);
        setNoteContent("");
        setMeetingForm({ address: "", date: "", time: "", notes: "" });
        fetchLeadDetails();
      }
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
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setActiveModal(null);
        fetchLeadDetails();
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>;
  if (!lead) return <div className="p-10 text-center text-slate-500 font-bold uppercase">Lead session expired or not found.</div>;

  // Professional Unified Timeline
  const timeline = [
    ...lead.notes.map(n => ({ ...n, type: 'NOTE' })),
    ...lead.followUps.map(f => ({ ...f, type: 'FOLLOW_UP' })),
    ...lead.meetings.map(m => ({ ...m, type: 'MEETING' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header Profile - High Contrast */}
      <div className="bg-slate-900 border-b-4 border-indigo-600 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 to-transparent pointer-events-none" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="h-24 w-24 bg-white rounded-3xl flex flex-shrink-0 items-center justify-center border-4 border-indigo-500 shadow-2xl transform rotate-3 scale-105">
            <span className="text-4xl font-black text-slate-900 -rotate-3 uppercase">{lead.customerName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">{lead.customerName}</h1>
            <div className="mt-3 flex flex-wrap gap-5 text-sm">
              <span className="flex items-center gap-2 text-indigo-100 font-bold bg-white/10 px-3 py-1 rounded-lg"><Phone className="h-4 w-4" /> {lead.contactNumber}</span>
              <span className="flex items-center gap-2 text-slate-300 font-bold tracking-widest bg-white/5 px-3 py-1 rounded-lg uppercase"><FileText className="h-4 w-4" /> {lead.serviceType.replace("_", " ")}</span>
              <span className="flex items-center gap-2 text-slate-400 font-medium"><Clock className="h-4 w-4" /> Registered: {format(new Date(lead.createdAt), "dd MMM yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-start md:items-end relative z-10">
          <span className={cn(
            "inline-flex items-center rounded-xl px-5 py-2 text-xs font-black uppercase tracking-[0.2em] shadow-lg ring-2 ring-white/20",
            lead.status === "NEW_INQUIRY" ? "bg-amber-500 text-white" :
            lead.status === "WON_ORDER" ? "bg-emerald-500 text-white" :
            lead.status === "CANCELLED" ? "bg-rose-500 text-white" :
            "bg-sky-500 text-white"
          )}>
            Status: {lead.status.replace("_", " ")}
          </span>
          <p className="text-sm font-black text-slate-100 uppercase tracking-widest">
            Priority: <span className={cn(lead.priority === "HIGH" ? "text-rose-400" : "text-amber-400")}>{lead.priority}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Quick Actions & Details */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white relative group">
             <div className="absolute top-0 right-0 p-8 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors">
                <Zap className="h-32 w-32 -mr-10 -mt-10" />
             </div>
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tighter relative z-10">
              <Zap className="h-6 w-6 text-amber-400 fill-amber-400" /> Operations Hub
            </h3>
            <div className="grid grid-cols-1 gap-4 relative z-10">
              <button onClick={() => setActiveModal("PICKED")} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                <CheckCircle2 className="h-5 w-5" /> Customer Picked
              </button>
              <button onClick={() => setActiveModal("NOT_PICKED")} className="w-full bg-rose-600 hover:bg-rose-500 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                <PhoneMissed className="h-5 w-5" /> Not Picked
              </button>
              <button onClick={() => setActiveModal("MEETING")} className="w-full bg-white text-slate-900 hover:bg-slate-100 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 uppercase tracking-widest border-2 border-indigo-200">
                <Calendar className="h-5 w-5 text-indigo-600" /> Set Site Meeting
              </button>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 mt-2 uppercase tracking-widest">
                <FileText className="h-5 w-5" /> Generate Quotation
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 relative group">
            <button onClick={() => { setActiveModal("EDIT"); setEditForm(lead); }} className="absolute top-8 right-8 p-3 text-slate-400 hover:text-white hover:bg-indigo-600 rounded-2xl transition-all shadow-sm">
              <Pencil className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Core Lead File</h3>
            <div className="space-y-6">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:border-indigo-100 transition-colors">
                 <div className="flex items-center gap-3 mb-2">
                   <MapPin className="h-4 w-4 text-indigo-600" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Location</p>
                 </div>
                 <p className="text-sm text-slate-900 font-bold leading-relaxed">{lead.fullAddress || "Address requested..."}</p>
                 {lead.landmark && <p className="text-xs text-slate-500 mt-1 font-bold italic">Landmark: {lead.landmark}</p>}
               </div>
               
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:border-indigo-100 transition-colors">
                 <div className="flex items-center gap-3 mb-2">
                   <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Requirement</p>
                 </div>
                 <p className="text-sm text-slate-900 font-black leading-relaxed">{lead.requirementDetails || "Not specified yet"}</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Budget Allocation</p>
                    <p className="text-md font-black text-indigo-700 uppercase">{lead.budgetRange || "Flexible"}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">First Source</p>
                    <p className="text-md font-black text-slate-800 uppercase tracking-tighter">{lead.inquirySource}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Modern Professional Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 min-h-[700px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
            <div className="flex items-center justify-between mb-12 relative z-10">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                <Activity className="h-6 w-6 text-indigo-600" /> Lead Pulse Timeline
              </h3>
              <div className="hidden md:block h-px flex-1 mx-8 bg-slate-100" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{timeline.length} Activities Found</p>
            </div>
            
            <div className="relative pl-10 border-l-4 border-slate-100 space-y-16 relative z-10">
              {timeline.map((itemValue: any, idx) => (
                <div key={itemValue.id} className="relative">
                  <div className={cn("absolute -left-16 top-0 h-12 w-12 rounded-2xl border-[6px] border-white shadow-xl flex items-center justify-center transform rotate-3",
                    itemValue.type === 'MEETING' ? "bg-indigo-600 text-white" :
                    itemValue.outcome === 'PICKED' ? "bg-emerald-600 text-white" :
                    itemValue.outcome === 'NOT_PICKED' ? "bg-rose-600 text-white" :
                    "bg-slate-800 text-white"
                  )}>
                    {itemValue.type === 'MEETING' ? <Calendar className="h-5 w-5" /> : itemValue.type === 'NOTE' ? <FileText className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                  </div>
                  <div className="animate-in slide-in-from-left duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                      <div className="px-3 py-1 bg-slate-900 rounded-lg text-[10px] font-black text-white uppercase shadow-md flex items-center gap-2">
                         <Clock className="h-3 w-3" />
                         {format(new Date(itemValue.createdAt), "dd MMM, yyyy • h:mm a")}
                      </div>
                      <span className="hidden sm:block h-px w-6 bg-slate-200" />
                      <p className={cn("text-sm font-black uppercase tracking-widest", 
                        itemValue.type === 'MEETING' ? "text-indigo-600" : 
                        itemValue.outcome === 'PICKED' ? "text-emerald-600" :
                        itemValue.outcome === 'NOT_PICKED' ? "text-rose-600" : "text-slate-800"
                      )}>
                        {itemValue.type === 'MEETING' ? "Site Visit Scheduled" : itemValue.outcome ? `Call Logged: ${itemValue.outcome}` : "Timeline Memo"}
                      </p>
                    </div>
                    <div className="p-6 bg-white rounded-3xl border-2 border-slate-50 text-base text-slate-900 font-bold leading-relaxed shadow-sm hover:shadow-md transition-shadow">
                      {itemValue.type === 'MEETING' ? (
                        <div className="space-y-4">
                           <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                             <MapPin className="h-5 w-5 text-indigo-600 shrink-0 mt-1" />
                             <div>
                               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Meeting Destination</p>
                               <p className="text-sm font-black text-indigo-900">{itemValue.address}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-5">
                              <div className="flex items-center gap-2 text-slate-600 font-bold"><Calendar className="h-4 w-4 text-indigo-400" /> {format(new Date(itemValue.date), "PPP")}</div>
                              <div className="flex items-center gap-2 text-slate-600 font-bold"><Clock className="h-4 w-4 text-indigo-400" /> {itemValue.time}</div>
                           </div>
                           {itemValue.notes && <div className="pt-4 border-t-2 border-slate-50 italic text-slate-600 font-medium font-serif">"{itemValue.notes}"</div>}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{itemValue.content || itemValue.noteGiven || "Authentication: Identity verified and action recorded."}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && <div className="text-center py-32"><Activity className="h-16 w-16 text-slate-100 mx-auto mb-4" /><p className="text-slate-400 font-black uppercase tracking-widest italic">Pulse: Waiting for initial activity signal.</p></div>}
            </div>
          </div>
        </div>
      </div>

      {/* RE-ENGINEERED MODALS - HIGH VISIBILITY & ELEGANCE */}
      {activeModal === "EDIT" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] w-full max-w-2xl overflow-hidden ring-1 ring-slate-200 animate-in zoom-in-95 duration-300">
            <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30 font-black text-white"><Pencil className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Modify Lead Identity</h2>
                  <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest opacity-70">Update the core file information</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-4 hover:bg-slate-200 rounded-full transition-all group shadow-sm"><X className="h-6 w-6 text-slate-400 group-hover:text-slate-900" /></button>
            </div>
            <form onSubmit={handleUpdateLead} className="p-12 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div><label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Customer Name *</label><input required className="w-full rounded-2xl border-2 border-slate-100 bg-white py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300" placeholder="e.g. John Doe" value={editForm.customerName} onChange={e => setEditForm({...editForm, customerName: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Primary Phone *</label><input required className="w-full rounded-2xl border-2 border-slate-100 bg-white py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300" placeholder="+91 XXXXX XXXXX" value={editForm.contactNumber} onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Requirement Overview</label><textarea className="w-full rounded-2xl border-2 border-slate-100 bg-white py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300" placeholder="Modular kitchen details, wood preference..." rows={3} value={editForm.requirementDetails || ""} onChange={e => setEditForm({...editForm, requirementDetails: e.target.value})} /></div>
                </div>
                <div className="space-y-8">
                  <div><label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Site Map / Address</label><textarea className="w-full rounded-2xl border-2 border-slate-100 bg-white py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300" placeholder="Apartment / Office address" rows={3} value={editForm.fullAddress || ""} onChange={e => setEditForm({...editForm, fullAddress: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3 ml-1">Near Landmark</label><input className="w-full rounded-2xl border-2 border-slate-100 bg-white py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300" placeholder="Opposite Main Park" value={editForm.landmark || ""} onChange={e => setEditForm({...editForm, landmark: e.target.value})} /></div>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="block text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-1 ml-1">Budget Allocation</label>
                    <input className="w-full rounded-2xl border-2 border-slate-100 bg-white py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300 font-black text-indigo-600" placeholder="e.g. 5 - 10 Lakhs" value={editForm.budgetRange || ""} onChange={e => setEditForm({...editForm, budgetRange: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="mt-14 flex items-center justify-end gap-6 pt-10 border-t-2 border-slate-50">
                <button type="button" onClick={() => setActiveModal(null)} className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 text-sm p-4 transition-colors">Abort</button>
                <button type="submit" disabled={isSubmitting} className="bg-slate-900 hover:bg-black text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl flex items-center gap-3 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50">
                  {isSubmitting ? "Processing File..." : <span className="flex items-center gap-3">Commit Changes <Check className="h-5 w-5 text-emerald-400" /></span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(activeModal === "PICKED" || activeModal === "NOT_PICKED") && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className={cn("px-10 py-12 text-white flex items-center gap-4 relative overflow-hidden", activeModal === 'PICKED' ? 'bg-emerald-600' : 'bg-rose-600')}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-xl">
                 {activeModal === 'PICKED' ? <CheckCircle2 className="h-8 w-8" /> : <PhoneMissed className="h-8 w-8" />}
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase tracking-tight">Post-Call Summary</h2>
                <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-1">Lead: {activeModal.replace("_", " ")}</p>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-4 ml-1 flex justify-between">
                   <span>Call Insights & Notes *</span>
                   <span className="text-rose-500">REQUIRED</span>
                </label>
                <textarea required rows={5} className="w-full rounded-3xl border-2 border-slate-100 bg-slate-50/50 py-5 px-6 text-slate-900 font-black focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300"
                  placeholder={activeModal === 'PICKED' ? "Log specific requirements, interest level, and next steps discussed." : "Why was the call missed? (e.g. Switched off, busy, rang once)"}
                  value={noteContent} onChange={e => setNoteContent(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-6 pt-6 border-t font-black text-sm tracking-widest uppercase">
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 p-4">Discard</button>
                <button disabled={!noteContent || isSubmitting} onClick={() => handleAction("/api/follow-ups", { outcome: activeModal, noteGiven: noteContent })}
                  className={cn("px-10 py-5 rounded-[2rem] text-white shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2", 
                    activeModal === 'PICKED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700')}>
                  {isSubmitting ? "Saving..." : "Finalize Log"}
                  <Check className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === "MEETING" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            <div className="px-12 py-10 bg-indigo-600 text-white flex items-center gap-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
               <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-sm shadow-xl"><Calendar className="h-8 w-8 text-white" /></div>
               <div className="relative z-10">
                 <h2 className="text-2xl font-black uppercase tracking-tight leading-none text-white">Book Site Visit</h2>
                 <p className="text-indigo-100/70 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Professional Business Appointment</p>
               </div>
            </div>
            <div className="p-12 space-y-8">
              <div className="space-y-6">
                <div><label className="block text-[10px] font-black text-slate-900 mb-3 ml-1 uppercase tracking-widest">Meeting Destination *</label><input required className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300" value={meetingForm.address} onChange={e => setMeetingForm({...meetingForm, address: e.target.value})} placeholder="B-701, Samrat Skyline, Near Nikol Road" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-[10px] font-black text-slate-900 mb-3 ml-1 uppercase tracking-widest">Date *</label><input type="date" required className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm uppercase" value={meetingForm.date} onChange={e => setMeetingForm({...meetingForm, date: e.target.value})} /></div>
                  <div><label className="block text-[10px] font-black text-slate-900 mb-3 ml-1 uppercase tracking-widest">Time *</label><input type="time" required className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm uppercase" value={meetingForm.time} onChange={e => setMeetingForm({...meetingForm, time: e.target.value})} /></div>
                </div>
                <div><label className="block text-[10px] font-black text-slate-900 mb-3 ml-1 uppercase tracking-widest">Agenda / Agenda Notes</label><textarea rows={3} className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 py-4 px-5 text-slate-900 font-black focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-base placeholder:text-slate-300" value={meetingForm.notes} onChange={e => setMeetingForm({...meetingForm, notes: e.target.value})} placeholder="Discussing modular kitchen layout and cabinet finishes..." /></div>
              </div>
              <div className="mt-10 flex items-center justify-end gap-6 pt-10 border-t-2 border-slate-50 uppercase font-black text-sm tracking-widest">
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 p-4 transition-colors">Discard</button>
                <button disabled={!meetingForm.address || !meetingForm.date || isSubmitting} onClick={() => handleAction("/api/meetings", meetingForm)}
                  className="bg-indigo-600 hover:bg-indigo-700 px-12 py-5 rounded-[2rem] text-white font-black shadow-2xl shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3">
                  {isSubmitting ? "Locking..." : <span className="flex items-center gap-3 text-white">Book Slot <Check className="h-5 w-5" /></span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
