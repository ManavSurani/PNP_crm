"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import { Phone, MapPin, User, FileText, CalendarCheck, MoreHorizontal, MessageSquarePlus, Clock, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  content: string;
  createdAt: string;
};

type FollowUp = {
  id: string;
  attemptNumber: number;
  outcome: string;
  noteGiven: string | null;
  scheduledDate: string;
  createdAt: string;
};

type LeadDetails = {
  id: string;
  customerName: string;
  contactNumber: string;
  alternateNumber: string | null;
  fullAddress: string | null;
  inquirySource: string;
  serviceType: string;
  priority: string;
  status: string;
  createdAt: string;
  assignedStaff?: { name: string } | null;
  notes: Note[];
  followUps: FollowUp[];
  meetings: any[];
};

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [noteContent, setNoteContent] = useState("");
  const [isNoteSubmitting, setIsNoteSubmitting] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      const data = await res.json();
      setLead(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent) return;
    setIsNoteSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id, content: noteContent })
      });
      if (res.ok) {
        setNoteContent("");
        fetchLeadDetails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsNoteSubmitting(false);
    }
  };

  const handleLogFollowUp = async (outcome: string) => {
    try {
      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id, outcome, noteGiven: "Quick log" })
      });
      if (res.ok) {
        fetchLeadDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!lead) return <div>Lead not found.</div>;

  // Combine Notes and FollowUps for a unified timeline
  const timelineEvents = [
    ...lead.notes.map(n => ({ type: "Note", ...n })),
    ...lead.followUps.map(f => ({ type: "FollowUp", ...f }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Profile */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex flex-shrink-0 items-center justify-center border-4 border-white shadow-sm ring-1 ring-slate-200">
            <span className="text-3xl font-bold text-indigo-700">{lead.customerName.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{lead.customerName}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {lead.contactNumber}</span>
              <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> {lead.serviceType.replace("_", " ")}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(new Date(lead.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-start md:items-end">
          <span className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset",
            lead.status === "NEW_INQUIRY" ? "bg-amber-50 text-amber-700 ring-amber-600/20" :
            lead.status === "WON_ORDER" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" :
            lead.status === "CANCELLED" ? "bg-rose-50 text-rose-700 ring-rose-600/20" :
            "bg-sky-50 text-sky-700 ring-sky-600/20"
          )}>
            Status: {lead.status.replace("_", " ")}
          </span>
          <p className="text-sm font-medium text-slate-500">
            Priority: <span className={cn(
              lead.priority === "HIGH" ? "text-rose-600 font-bold" : "text-slate-700"
            )}>{lead.priority}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Actions & Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-500" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-slate-500 font-medium mb-2">Log Call Result:</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleLogFollowUp("PICKED")} className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-2 rounded-lg text-sm font-medium transition duration-200">
                  Call Picked
                </button>
                <button onClick={() => handleLogFollowUp("NOT_PICKED")} className="w-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 py-2 rounded-lg text-sm font-medium transition duration-200">
                  Not Picked
                </button>
              </div>
              <button className="w-full mt-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 py-2.5 rounded-lg text-sm font-medium flex justify-center items-center gap-2 transition duration-200">
                <CalendarCheck className="h-4 w-4" /> Schedule Meeting
              </button>
              <button className="w-full bg-slate-900 text-white hover:bg-slate-800 py-2.5 rounded-lg text-sm font-medium transition duration-200 mt-2">
                Create Quotation
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Lead Information</h3>
            <dl className="space-y-4 text-sm text-slate-700">
              <div>
                <dt className="text-slate-500 font-medium">Assigned Staff</dt>
                <dd className="mt-1 font-semibold">{lead.assignedStaff?.name || "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Inquiry Source</dt>
                <dd className="mt-1">{lead.inquirySource.replace("_", " ")}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium flex items-center gap-1"><MapPin className="h-4 w-4"/> Full Address</dt>
                <dd className="mt-1 whitespace-pre-wrap">{lead.fullAddress || "No address provided"}</dd>
              </div>
              <div>
                <dt className="text-slate-500 font-medium">Alternate Contact</dt>
                <dd className="mt-1">{lead.alternateNumber || "None"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column: Timeline / History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-indigo-500" />
              Add to Timeline
            </h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                className="w-full rounded-xl border-0 py-3 px-4 bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 placeholder:text-slate-400 focus:bg-white transition-all shadow-inner"
                placeholder="Write a note, meeting outcome, or reminder for the future..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isNoteSubmitting}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2 transition duration-200"
                >
                  {isNoteSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Note
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Unlimited History & Timeline</h3>
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {timelineEvents.map((event: any, eventIdx) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {eventIdx !== timelineEvents.length - 1 ? (
                        <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white",
                            event.type === "Note" ? "bg-indigo-50 text-indigo-600" :
                            event.type === "FollowUp" && event.outcome === "NOT_PICKED" ? "bg-rose-50 text-rose-600" :
                            "bg-emerald-50 text-emerald-600"
                          )}>
                            {event.type === "Note" ? <FileText className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 py-0">
                          <div className="text-sm">
                            <span className="font-medium text-slate-900">
                              {event.type === "Note" ? "Added Note" : `Call Logged - ${event.outcome.replace("_", " ")}`}
                            </span>
                            <span className="whitespace-nowrap text-xs text-slate-500 ml-2">
                              {format(new Date(event.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-inner">
                            <p className="whitespace-pre-wrap">{event.content || event.noteGiven || "No additional notes provided."}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {timelineEvents.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No activity history yet. Action this lead to start the timeline!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
