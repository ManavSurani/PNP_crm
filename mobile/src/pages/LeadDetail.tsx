/**
 * PNP CRM Mobile — Lead Detail + Action Center + Activity Timeline
 * File: mobile/src/pages/LeadDetail.tsx
 *
 * Exact desktop CRM parity:
 *  - 2-Tab layout: Details | Activity Timeline
 *  - Action Center: Picked, No Answer, Schedule Visit, Convert, Cancel, Reactivate, Edit
 *  - 7 modals with all desktop fields
 *  - Activity Timeline: system logs + call logs + visit logs + manual notes
 *  - Pinned note input at bottom of Timeline tab
 *  - ZERO dummy/demo fallback data
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Phone, MessageCircle, MapPin, Tag, FileText, User,
  CheckCircle2, PhoneMissed, Calendar, Zap, Ban, RotateCcw, Pencil,
  X, ChevronDown, AlertTriangle, Clock, Send, Activity,
} from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { WhatsAppModal } from '../components/WhatsAppModal';
import { useAppStore } from '../store/appStore';
import {
  getLeadByMobileId, getLeadNotes, getFollowUpsByLead, getVisitsByLead,
  saveFollowUp, saveVisit, updateLeadStatus, updateLead, addLeadNote,
  getDashboardStats, addLeadNote as addNote, saveCustomerFromLead, updateVisitStatus,
  type LocalLead, type LocalFollowUp, type LocalVisit, type LocalLeadNote, type NoteType,
} from '../db/sqlite';

// ── Status / Source / Service configs ────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  NEW_INQUIRY:       { label: 'New Inquiry',    bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  FOLLOW_UP:         { label: 'In Pipeline',    bg: 'rgba(14,165,233,0.15)',  color: '#0ea5e9' },
  MEETING_SCHEDULED: { label: 'Visit Booked',   bg: 'rgba(79,70,229,0.15)',   color: '#818cf8' },
  WON_ORDER:         { label: 'Project Started',bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  CANCELLED:         { label: 'Cancelled',      bg: 'rgba(244,63,94,0.15)',   color: '#f43f5e' },
};

const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp', FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram',
  WEBSITE: 'Website', DIRECT_CALL: 'Direct Call', WALK_IN: 'Walk In',
  THROUGH_REFERENCE: 'Reference', OTHER: 'Other',
};

const CANCEL_REASONS = [
  'No Response', 'Not Interested', 'Budget Issue',
  'Already Purchased', 'Wrong Number', 'Project Postponed', 'Need Turnkey',
];

const SERVICE_OPTIONS = [
  'Interior Design', '2BHK Interior', '3BHK Interior', '4BHK Interior', 'Raw house', 'Office', 'Other',
];
const SOURCE_OPTIONS = [
  { label: 'WhatsApp', value: 'WHATSAPP' }, { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'Instagram', value: 'INSTAGRAM' }, { label: 'Website', value: 'WEBSITE' },
  { label: 'Direct Call', value: 'DIRECT_CALL' }, { label: 'Walk In', value: 'WALK_IN' },
  { label: 'Reference', value: 'THROUGH_REFERENCE' },
];

// ── Timeline helpers ──────────────────────────────────────────────────────────

interface TimelineItem {
  id: string;
  noteType: NoteType;
  noteText: string;
  createdAt: string;
  createdByName?: string;
}

const NOTE_STYLE: Record<string, { border: string; icon: React.ReactNode; label: string }> = {
  SYSTEM_CREATE:    { border: '#10b981', icon: <User size={13} color="#10b981" />,           label: 'Lead Created' },
  SYSTEM_STATUS:    { border: '#818cf8', icon: <Activity size={13} color="#818cf8" />,       label: 'Status Updated' },
  CALL_PICKED:      { border: '#10b981', icon: <CheckCircle2 size={13} color="#10b981" />,   label: 'Call: Picked' },
  CALL_NOT_PICKED:  { border: '#f43f5e', icon: <PhoneMissed size={13} color="#f43f5e" />,   label: 'Call: No Answer' },
  VISIT_SCHEDULED:  { border: '#818cf8', icon: <Calendar size={13} color="#818cf8" />,       label: 'Visit Scheduled' },
  VISIT_COMPLETED:  { border: '#10b981', icon: <CheckCircle2 size={13} color="#10b981" />,   label: 'Visit Completed' },
  CANCELLED:        { border: '#f43f5e', icon: <Ban size={13} color="#f43f5e" />,            label: 'Lead Cancelled' },
  CONVERTED:        { border: '#10b981', icon: <Zap size={13} color="#10b981" />,            label: 'Converted to Customer' },
  REACTIVATED:      { border: '#818cf8', icon: <RotateCcw size={13} color="#818cf8" />,      label: 'Lead Reactivated' },
  EDITED:           { border: '#f59e0b', icon: <Pencil size={13} color="#f59e0b" />,         label: 'Profile Edited' },
  MANUAL:           { border: '#f59e0b', icon: <FileText size={13} color="#f59e0b" />,       label: 'Internal Note' },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };
const toTimeStr = (t: string) => {
  const [h, m] = t.split(':'); const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

// ── Main Component ────────────────────────────────────────────────────────────

type ModalType = null | 'picked' | 'not_picked' | 'schedule_visit' | 'cancel' | 'convert' | 'reactivate' | 'edit' | 'complete_visit';

export const LeadDetail: React.FC = () => {
  const { selectedLeadId, goBack, navigate, addToast, setStats, setPendingSyncCount } = useAppStore();
  const [lead, setLead] = useState<LocalLead | null>(null);
  const [notes, setNotes] = useState<LocalLeadNote[]>([]);
  const [followUps, setFollowUps] = useState<LocalFollowUp[]>([]);
  const [visits, setVisits] = useState<LocalVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [completingVisit, setCompletingVisit] = useState<LocalVisit | null>(null);
  const [isWaOpen, setIsWaOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const loadAll = useCallback(async () => {
    if (!selectedLeadId) return;
    try {
      const [l, n, f, v] = await Promise.all([
        getLeadByMobileId(selectedLeadId),
        getLeadNotes(selectedLeadId),
        getFollowUpsByLead(selectedLeadId),
        getVisitsByLead(selectedLeadId),
      ]);
      setLead(l);
      setNotes(n);
      setFollowUps(f);
      setVisits(v);
    } catch {
      setLead(null);
    } finally {
      setLoading(false);
    }
  }, [selectedLeadId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refreshStats = async () => {
    const s = await getDashboardStats(); setStats(s); setPendingSyncCount(s.pendingSync);
  };

  const closeModal = () => setActiveModal(null);

  const handleStatusUpdate = async (newStatus: string, noteText: string, noteType: NoteType) => {
    if (!lead) return;
    await updateLeadStatus(lead.mobileId, newStatus);
    await addNote(lead.mobileId, noteText, noteType);
    await refreshStats();
    await loadAll();
  };

  const addManualNote = async () => {
    if (!noteInput.trim() || !lead || submittingNote) return;
    setSubmittingNote(true);
    try {
      await addNote(lead.mobileId, noteInput.trim(), 'MANUAL');
      setNoteInput('');
      await loadAll();
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ width: '28px', height: '28px', border: '2.5px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </MobileLayout>
    );
  }

  if (!lead) {
    return (
      <MobileLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
          <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '600' }}>Lead not found</p>
          <button onClick={goBack} style={{ color: '#818cf8', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer' }}>← Go Back</button>
        </div>
      </MobileLayout>
    );
  }

  const statusCfg = STATUS_CFG[lead.status] ?? STATUS_CFG['NEW_INQUIRY'];
  const isLocked = lead.status === 'CANCELLED' || lead.status === 'WON_ORDER';
  const hasPendingVisit = visits.some(v => v.status === 'SCHEDULED');

  // Timeline data: combine pending visits + notes history
  const sortedNotes = [...notes].reverse().map(n => ({ ...n, id: n.mobileId }));
  const pendingVisits = visits.filter(v => v.status === 'SCHEDULED');
  const pendingFollowUps = followUps.filter(f => new Date(f.scheduledDate).getTime() > Date.now());

  return (
    <MobileLayout hideBottomNav>
      {/* ── Sticky Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <ArrowLeft size={22} color="#94a3b8" />
        </button>
        <h1 style={{ color: '#ffffff', fontSize: '17px', fontWeight: '700', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.customerName || 'Unknown Customer'}
        </h1>
        <span style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '9999px', flexShrink: 0 }}>
          {statusCfg.label}
        </span>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: '65px', zIndex: 9 }}>
        {(['details', 'timeline'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab ? '#818cf8' : '#64748b',
              fontSize: '13px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'capitalize',
              borderBottom: activeTab === tab ? '2px solid #818cf8' : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {tab === 'details' ? 'Details' : 'Activity Timeline'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ TAB 1 */}
      {activeTab === 'details' && (
        <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Profile Card */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '46px', height: '46px', backgroundColor: 'rgba(79,70,229,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#818cf8', fontSize: '18px', fontWeight: '700' }}>
                    {(lead.customerName || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: '700', margin: '0 0 2px' }}>{lead.customerName || 'Unknown Customer'}</p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{lead.contactNumber}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`tel:${lead.contactNumber}`} style={{ textDecoration: 'none' }}>
                  <div style={{ width: '42px', height: '42px', backgroundColor: '#1d4ed8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(29,78,216,0.4)' }}>
                    <Phone size={18} color="#fff" />
                  </div>
                </a>
                <button onClick={() => setIsWaOpen(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <div style={{ width: '42px', height: '42px', backgroundColor: '#15803d', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(21,128,61,0.4)' }}>
                    <MessageCircle size={18} color="#fff" />
                  </div>
                </button>
              </div>
            </div>
            {lead.inquirySource === 'THROUGH_REFERENCE' && lead.referenceName && (
              <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} color="#f59e0b" />
                <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>Ref: {lead.referenceName}</span>
              </div>
            )}
          </div>

          {/* Action Center */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px', border: '1px solid rgba(79,70,229,0.2)' }}>
            <p style={{ color: '#4f46e5', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>⚡ Action Center</p>

            {isLocked ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Ban size={16} color="#f43f5e" />
                  <span style={{ color: '#f43f5e', fontSize: '13px', fontWeight: '600' }}>Lead Deactivated</span>
                </div>
                <ActionBtn label="Reactivate Lead" color="#4f46e5" icon={<RotateCcw size={16} color="#fff" />} onClick={() => setActiveModal('reactivate')} />
              </div>
            ) : hasPendingVisit ? (
              <div style={{ backgroundColor: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px' }}>
                <Calendar size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ color: '#818cf8', fontSize: '13px', fontWeight: '700', margin: '0 0 3px' }}>Site Visit Pending</p>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Please complete the pending site visit before taking new actions.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <ActionBtn label="✓ Picked" color="#14532d" border="#16a34a" textColor="#4ade80" onClick={() => setActiveModal('picked')} />
                  <ActionBtn label="✗ No Answer" color="#7f1d1d" border="#dc2626" textColor="#f87171" onClick={() => setActiveModal('not_picked')} />
                </div>
                <ActionBtn label="Schedule Site Visit" color="transparent" border="#10b981" textColor="#10b981" icon={<Calendar size={15} color="#10b981" />} onClick={() => setActiveModal('schedule_visit')} />
                <ActionBtn label="Convert to Customer" color="rgba(79,70,229,0.15)" border="rgba(79,70,229,0.3)" textColor="#818cf8" icon={<Zap size={15} color="#818cf8" />} onClick={() => setActiveModal('convert')} />
                <button
                  onClick={() => setActiveModal('cancel')}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', WebkitTapHighlightColor: 'transparent' }}
                >
                  <Ban size={14} />
                  Cancel Lead
                </button>
              </div>
            )}
          </div>

          {/* Project Info Card */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Project Information</p>
              <button onClick={() => setActiveModal('edit')} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                <Pencil size={15} color="#64748b" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <InfoRow icon={<Tag size={14} color="#818cf8" />} label="Service" value={lead.serviceType} />
              <InfoRow icon={<MessageCircle size={14} color="#818cf8" />} label="Source" value={SOURCE_LABELS[lead.inquirySource] ?? lead.inquirySource} />
              {(lead.fullAddress || lead.siteLocation) && (
                <InfoRow icon={<MapPin size={14} color="#818cf8" />} label="Address" value={lead.fullAddress || lead.siteLocation || ''} />
              )}
              {lead.requirementDetails && (
                <InfoRow icon={<FileText size={14} color="#818cf8" />} label="Notes" value={lead.requirementDetails} />
              )}
            </div>
          </div>

          {followUps.length > 0 && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
              <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                Call Attempts — {followUps.length} total
              </p>
              {followUps.slice(-3).reverse().map(fu => (
                <div key={fu.mobileId} style={{ marginBottom: '10px', borderLeft: `3px solid ${fu.outcome === 'PICKED' ? '#10b981' : '#f43f5e'}`, paddingLeft: '12px' }}>
                  <p style={{ color: fu.outcome === 'PICKED' ? '#4ade80' : '#f87171', fontSize: '12px', fontWeight: '700', margin: '0 0 2px' }}>{fu.outcome === 'PICKED' ? 'Picked' : 'No Answer'}</p>
                  {fu.noteGiven && <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 2px' }}>{fu.noteGiven}</p>}
                  <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>{fmtDate(fu.createdAt)} · {fmtTime(fu.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ TAB 2 */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
            {notes.length === 0 && pendingVisits.length === 0 && pendingFollowUps.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: '10px' }}>
                <Activity size={32} color="#334155" />
                <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', margin: 0 }}>No activity yet. Actions you take will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '16px' }}>
                {/* ── Pending Visits ── */}
                {pendingVisits.map((visit) => (
                  <div key={visit.mobileId} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: `rgba(129, 140, 248, 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={13} color="#818cf8" />
                      </div>
                      <div style={{ width: '2px', flex: 1, backgroundColor: `rgba(129, 140, 248, 0.3)`, minHeight: '8px' }} />
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '12px', padding: '12px', borderLeft: `3px solid #818cf8`, marginBottom: '2px' }}>
                      <p style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '700', margin: '0 0 4px' }}>Upcoming Site Visit</p>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 6px', lineHeight: '1.4' }}>{visit.address}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                        <Clock size={11} color="#475569" />
                        <span style={{ color: '#475569', fontSize: '11px' }}>{fmtDate(visit.date)} · {visit.time}</span>
                      </div>
                      <button 
                        onClick={() => { setCompletingVisit(visit); setActiveModal('complete_visit'); }}
                        style={{ padding: '8px 12px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <CheckCircle2 size={14} /> Complete Visit
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* ── Pending Follow-ups ── */}
                {pendingFollowUps.map((fu) => (
                  <div key={fu.mobileId} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: `rgba(14, 165, 233, 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone size={13} color="#0ea5e9" />
                      </div>
                      <div style={{ width: '2px', flex: 1, backgroundColor: `rgba(14, 165, 233, 0.3)`, minHeight: '8px' }} />
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '12px', padding: '12px', borderLeft: `3px solid #0ea5e9`, marginBottom: '2px' }}>
                      <p style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '700', margin: '0 0 4px' }}>Upcoming Follow-Up</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <Calendar size={11} color="#475569" />
                        <span style={{ color: '#475569', fontSize: '11px' }}>{fmtDate(fu.scheduledDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* ── Historical Notes ── */}
                {sortedNotes.map((item) => {
                  const style = NOTE_STYLE[item.noteType] ?? NOTE_STYLE['MANUAL'];
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '12px' }}>
                      {/* Left border + icon */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: `${style.border}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {style.icon}
                        </div>
                        <div style={{ width: '2px', flex: 1, backgroundColor: `${style.border}30`, minHeight: '8px' }} />
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '12px', padding: '12px', borderLeft: `3px solid ${style.border}`, marginBottom: '2px' }}>
                        <p style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '700', margin: '0 0 4px' }}>{style.label}</p>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 6px', lineHeight: '1.4' }}>{item.noteText}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={11} color="#475569" />
                          <span style={{ color: '#475569', fontSize: '11px' }}>{fmtDate(item.createdAt)} · {fmtTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pinned Note Input */}
          <div style={{
            padding: '10px 16px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 70px))',
            backgroundColor: '#0f172a', borderTop: '1px solid #1e293b',
            display: 'flex', gap: '10px', alignItems: 'flex-end',
          }}>
            <textarea
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="Add a note to timeline…"
              rows={2}
              style={{
                flex: 1, padding: '10px 14px', backgroundColor: '#1e293b',
                border: '1.5px solid #334155', borderRadius: '12px', color: '#f1f5f9',
                fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif",
                resize: 'none', boxSizing: 'border-box', lineHeight: '1.4',
              }}
            />
            <button
              onClick={addManualNote}
              disabled={!noteInput.trim() || submittingNote}
              style={{
                width: '44px', height: '44px', backgroundColor: noteInput.trim() ? '#4f46e5' : '#1e293b',
                border: 'none', borderRadius: '12px', cursor: noteInput.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.15s', flexShrink: 0,
              }}
            >
              <Send size={18} color={noteInput.trim() ? '#fff' : '#475569'} />
            </button>
          </div>
        </div>
      )}

      {/* ── WhatsApp Modal ── */}
      <WhatsAppModal
        isOpen={isWaOpen}
        onClose={() => setIsWaOpen(false)}
        customerName={lead.customerName}
        contactNumber={lead.contactNumber}
        serviceType={lead.serviceType}
        address={lead.fullAddress || lead.siteLocation}
      />

      {/* ── MODAL: Picked ── */}
      {activeModal === 'picked' && (
        <PickedModal
          lead={lead}
          previousNotes={notes.filter(n => n.noteType === 'CALL_PICKED' || n.noteType === 'MANUAL')}
          notPickedCount={followUps.filter(f => f.outcome === 'NOT_PICKED').length}
          isFirstPick={followUps.filter(f => f.outcome === 'PICKED').length === 0}
          onClose={closeModal}
          onSave={async (data) => {
            await saveFollowUp({
              leadMobileId: lead.mobileId,
              leadContactNumber: lead.contactNumber,
              scheduledDate: data.nextCallDate || new Date().toISOString(),
              noteGiven: data.note,
              outcome: 'PICKED',
              pickedStatus: data.pickedStatus,
              nextCallDate: data.nextCallDate,
              nextCallTime: data.nextCallTime,
              cancelReason: data.cancelReason,
            });
            const noteTypeMap: Record<string, NoteType> = {
              INTERESTED: 'CALL_PICKED', BOOK_SITE_VISIT: 'VISIT_SCHEDULED',
              NEXT_DAY: 'CALL_PICKED', WANTS_RECALL: 'CALL_PICKED',
              NOT_INTERESTED: 'CANCELLED',
            };
            const nt: NoteType = noteTypeMap[data.pickedStatus] ?? 'CALL_PICKED';
            const noteText = `Call Picked — ${data.pickedStatus.replace('_', ' ')}${data.note ? ': ' + data.note : ''}`;
            await addNote(lead.mobileId, noteText, nt);

            if (data.pickedStatus === 'INTERESTED' || data.pickedStatus === 'WANTS_RECALL' || data.pickedStatus === 'NEXT_DAY') {
              await updateLeadStatus(lead.mobileId, 'FOLLOW_UP');
            } else if (data.pickedStatus === 'BOOK_SITE_VISIT') {
              if (data.visitDate && data.visitAddress) {
                await saveVisit({ leadMobileId: lead.mobileId, address: data.visitAddress, date: data.visitDate, time: data.visitTime ? toTimeStr(data.visitTime) : '10:00 AM', status: 'SCHEDULED', notes: data.note });
              }
              await updateLeadStatus(lead.mobileId, 'MEETING_SCHEDULED');
              await addNote(lead.mobileId, `Site visit scheduled at ${data.visitAddress} on ${fmtDate(data.visitDate!)}`, 'VISIT_SCHEDULED');
            } else if (data.pickedStatus === 'NOT_INTERESTED') {
              await updateLeadStatus(lead.mobileId, 'CANCELLED');
              await addNote(lead.mobileId, `Lead cancelled — Reason: ${data.cancelReason}`, 'CANCELLED');
            }

            await refreshStats();
            await loadAll();
            closeModal();
            addToast('✅ Call logged successfully!', 'success');
          }}
        />
      )}

      {/* ── MODAL: Not Picked ── */}
      {activeModal === 'not_picked' && (
        <NotPickedModal
          lead={lead}
          attemptCount={followUps.filter(f => f.outcome === 'NOT_PICKED').length + 1}
          onClose={closeModal}
          onSave={async (note) => {
            const nextDay = tomorrow();
            await saveFollowUp({
              leadMobileId: lead.mobileId,
              leadContactNumber: lead.contactNumber,
              scheduledDate: new Date(nextDay).toISOString(),
              noteGiven: note || 'No answer',
              outcome: 'NOT_PICKED',
              nextCallDate: nextDay,
            });
            const count = followUps.filter(f => f.outcome === 'NOT_PICKED').length + 1;
            await addNote(lead.mobileId, `Call unanswered (Attempt #${count})${note ? ' — ' + note : ''}`, 'CALL_NOT_PICKED');
            await refreshStats();
            await loadAll();
            closeModal();
            addToast('Call logged as No Answer. Recall set for tomorrow.', 'info');
          }}
        />
      )}

      {/* ── MODAL: Schedule Visit ── */}
      {activeModal === 'schedule_visit' && (
        <ScheduleVisitModal
          lead={lead}
          onClose={closeModal}
          onSave={async (data) => {
            await saveVisit({ leadMobileId: lead.mobileId, address: data.address, date: data.date, time: data.time ? toTimeStr(data.time) : '10:00 AM', status: 'SCHEDULED', notes: data.notes });
            await updateLeadStatus(lead.mobileId, 'MEETING_SCHEDULED');
            await addNote(lead.mobileId, `Site visit scheduled at ${data.address} on ${fmtDate(data.date)}${data.notes ? ' — Notes: ' + data.notes : ''}`, 'VISIT_SCHEDULED');
            await refreshStats();
            await loadAll();
            closeModal();
            addToast('✅ Site visit scheduled!', 'success');
          }}
        />
      )}

      {/* ── MODAL: Cancel ── */}
      {activeModal === 'cancel' && (
        <CancelModal
          onClose={closeModal}
          onSave={async (reason, comment) => {
            await updateLeadStatus(lead.mobileId, 'CANCELLED');
            await addNote(lead.mobileId, `Lead cancelled — Reason: ${reason}${comment ? '. ' + comment : ''}`, 'CANCELLED');
            await refreshStats();
            await loadAll();
            closeModal();
            addToast('Lead cancelled.', 'info');
          }}
        />
      )}

      {/* ── MODAL: Convert ── */}
      {activeModal === 'convert' && (
        <ConfirmModal
          title="Convert to Customer"
          icon={<Zap size={20} color="#10b981" />}
          message="This will move the lead out of your active pipeline and into the Customer Directory."
          confirmLabel="Confirm Conversion"
          confirmColor="#10b981"
          onClose={closeModal}
          onConfirm={async () => {
            const { setSelectedCustomerId } = useAppStore.getState();
            await updateLeadStatus(lead.mobileId, 'WON_ORDER');
            await saveCustomerFromLead(lead);
            await addNote(lead.mobileId, 'Lead converted to customer successfully.', 'CONVERTED');
            await refreshStats();
            await loadAll();
            closeModal();
            addToast('✅ Lead converted to customer!', 'success');
            setSelectedCustomerId(lead.mobileId);
            navigate('customer-detail');
          }}
        />
      )}

      {/* ── MODAL: Reactivate ── */}
      {activeModal === 'reactivate' && (
        <ReactivateModal
          onClose={closeModal}
          onSave={async (insight) => {
            await updateLeadStatus(lead.mobileId, 'FOLLOW_UP');
            await addNote(lead.mobileId, `Lead reactivated — Resetting to FOLLOW UP.${insight ? ' Reason: ' + insight : ''}`, 'REACTIVATED');
            await refreshStats();
            await loadAll();
            closeModal();
            addToast('✅ Lead reactivated!', 'success');
          }}
        />
      )}

      {/* ── MODAL: Edit ── */}
      {activeModal === 'edit' && (
        <EditLeadModal
          lead={lead}
          onClose={closeModal}
          onSave={async (updates) => {
            await updateLead(lead.mobileId, updates);
            await addNote(lead.mobileId, 'Lead profile updated.', 'EDITED');
            await loadAll();
            closeModal();
            addToast('Profile updated.', 'success');
          }}
        />
      )}
      {/* ── MODAL: Complete Visit ── */}
      {activeModal === 'complete_visit' && completingVisit && (
        <CompleteVisitModal
          visit={completingVisit}
          lead={lead}
          onClose={closeModal}
          onSave={async (data) => {
            await updateVisitStatus(completingVisit.mobileId, 'COMPLETED');
            
            if (data.outcome === 'WANTS_RECALL') {
              await saveFollowUp({ leadMobileId: lead.mobileId, leadContactNumber: lead.contactNumber, scheduledDate: data.date!, noteGiven: 'Requested recall after visit', outcome: 'NOT_PICKED', nextCallDate: data.date, nextCallTime: data.time });
              await updateLeadStatus(lead.mobileId, 'FOLLOW_UP');
              await addNote(lead.mobileId, `Visit marked complete. Needs recall on ${fmtDate(data.date!)}`, 'VISIT_COMPLETED');
            } else if (data.outcome === 'RESCHEDULE') {
              await saveVisit({ leadMobileId: lead.mobileId, address: completingVisit.address, date: data.date!, time: data.time ? toTimeStr(data.time) : '10:00 AM', status: 'SCHEDULED', notes: 'Rescheduled visit' });
              await updateLeadStatus(lead.mobileId, 'MEETING_SCHEDULED');
              await addNote(lead.mobileId, `Visit rescheduled to ${fmtDate(data.date!)}`, 'VISIT_SCHEDULED');
            } else if (data.outcome === 'NO_ANSWER') {
              await updateLeadStatus(lead.mobileId, 'FOLLOW_UP');
              await addNote(lead.mobileId, `Visit marked complete. No answer.`, 'VISIT_COMPLETED');
            } else if (data.outcome === 'NOT_INTERESTED') {
              await updateLeadStatus(lead.mobileId, 'CANCELLED');
              await addNote(lead.mobileId, `Lead cancelled after visit — Reason: ${data.cancelReason}`, 'CANCELLED');
            } else if (data.outcome === 'CONVERT') {
              await updateLeadStatus(lead.mobileId, 'WON_ORDER');
              await saveCustomerFromLead(lead);
              await addNote(lead.mobileId, 'Lead converted to customer after visit.', 'CONVERTED');
              const { setSelectedCustomerId } = useAppStore.getState();
              setSelectedCustomerId(lead.mobileId);
              navigate('customer-detail');
            }

            await refreshStats();
            await loadAll();
            closeModal();
            addToast('Visit completed!', 'success');
          }}
        />
      )}
    </MobileLayout>
  );
};

// ── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
    <div style={{ width: '30px', height: '30px', backgroundColor: 'rgba(79,70,229,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>{icon}</div>
    <div>
      <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ color: '#e2e8f0', fontSize: '14px', margin: 0, lineHeight: '1.4' }}>{value}</p>
    </div>
  </div>
);

// ── ActionBtn ────────────────────────────────────────────────────────────────

const ActionBtn: React.FC<{
  label: string; color: string; onClick: () => void;
  border?: string; textColor?: string; icon?: React.ReactNode;
}> = ({ label, color, onClick, border, textColor = '#ffffff', icon }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', padding: '14px', backgroundColor: color,
      border: border ? `1.5px solid ${border}` : 'none', borderRadius: '12px',
      color: textColor, fontSize: '14px', fontWeight: '700',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', WebkitTapHighlightColor: 'transparent',
    }}
  >
    {icon}{label}
  </button>
);

// ── Bottom Sheet Wrapper ──────────────────────────────────────────────────────

const BottomSheet: React.FC<{ title: string; icon?: React.ReactNode; onClose: () => void; children: React.ReactNode }> = ({ title, icon, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
    <div style={{ position: 'relative', backgroundColor: '#0f172a', borderRadius: '20px 20px 0 0', border: '1px solid #1e293b', maxHeight: '92vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 0' }}>
        {icon && <div style={{ width: '36px', height: '36px', backgroundColor: 'rgba(79,70,229,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>}
        <h2 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: '700', margin: 0, flex: 1 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} color="#64748b" /></button>
      </div>
      <div style={{ padding: '16px 20px 0' }}>{children}</div>
    </div>
  </div>
);

// ── MODAL: Picked ─────────────────────────────────────────────────────────────

interface PickedData {
  note: string; pickedStatus: string;
  nextCallDate?: string; nextCallTime?: string;
  visitDate?: string; visitTime?: string; visitAddress?: string;
  cancelReason?: string;
}

const OUTCOME_OPTS = [
  { key: 'INTERESTED',     label: 'Interested',       color: '#4f46e5' },
  { key: 'BOOK_SITE_VISIT',label: 'Book Site Visit',  color: '#10b981' },
  { key: 'NEXT_DAY',       label: 'Next Day',         color: '#0ea5e9' },
  { key: 'WANTS_RECALL',   label: 'Wants Recall',     color: '#f59e0b' },
  { key: 'NOT_INTERESTED', label: 'Not Interested',   color: '#f43f5e' },
];

const PickedModal: React.FC<{
  lead: LocalLead;
  previousNotes: LocalLeadNote[];
  notPickedCount: number;
  isFirstPick: boolean;
  onClose: () => void;
  onSave: (data: PickedData) => Promise<void>;
}> = ({ lead, previousNotes, isFirstPick, onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState('');
  const [nextCallDate, setNextCallDate] = useState('');
  const [nextCallTime, setNextCallTime] = useState('');
  const [visitDate, setVisitDate] = useState(tomorrow());
  const [visitTime, setVisitTime] = useState('10:00');
  const [visitAddress, setVisitAddress] = useState(lead.fullAddress || lead.siteLocation || '');
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = outcome !== '' &&
    (outcome !== 'INTERESTED' || nextCallDate) &&
    (outcome !== 'WANTS_RECALL' || nextCallDate) &&
    (outcome !== 'NOT_INTERESTED' || cancelReason) &&
    (outcome !== 'BOOK_SITE_VISIT' || (visitDate && visitAddress.trim()));

  const handleSave = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onSave({ note, pickedStatus: outcome, nextCallDate, nextCallTime, visitDate, visitTime, visitAddress, cancelReason });
    } finally { setSaving(false); }
  };

  return (
    <BottomSheet title="Log Successful Call" icon={<CheckCircle2 size={18} color="#10b981" />} onClose={onClose}>
      {previousNotes.length > 0 && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '12px', marginBottom: '14px', maxHeight: '100px', overflowY: 'auto' }}>
          <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 8px' }}>Previous Conversations</p>
          {previousNotes.map((n, i) => (
            <p key={n.mobileId} style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px' }}>#{i + 1} — {n.noteText}</p>
          ))}
        </div>
      )}

      <ModalLabel>Conversation Summary {isFirstPick ? '*' : '(Optional)'}</ModalLabel>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Mention specific requirements or customer mood..." rows={3} style={textareaStyle} />

      <ModalLabel>Pipeline Outcome</ModalLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {OUTCOME_OPTS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setOutcome(opt.key)}
            style={{
              padding: '12px', borderRadius: '10px', border: `1.5px solid ${outcome === opt.key ? opt.color : '#334155'}`,
              backgroundColor: outcome === opt.key ? `${opt.color}20` : '#1e293b',
              color: outcome === opt.key ? opt.color : '#64748b',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s',
            }}
          >{opt.label}</button>
        ))}
      </div>

      {(outcome === 'INTERESTED' || outcome === 'WANTS_RECALL') && (
        <ModalSection>
          <ModalLabel>Follow-up Date *</ModalLabel>
          <input type="date" value={nextCallDate} onChange={e => setNextCallDate(e.target.value)} style={inputStyle} />
          {outcome === 'WANTS_RECALL' && (<><ModalLabel>Follow-up Time</ModalLabel><input type="time" value={nextCallTime} onChange={e => setNextCallTime(e.target.value)} style={inputStyle} /></>)}
        </ModalSection>
      )}
      {outcome === 'NEXT_DAY' && (
        <ModalSection>
          <ModalLabel>Call Time (Optional)</ModalLabel>
          <input type="time" value={nextCallTime} onChange={e => setNextCallTime(e.target.value)} style={inputStyle} />
        </ModalSection>
      )}
      {outcome === 'BOOK_SITE_VISIT' && (
        <ModalSection>
          <ModalLabel>Visit Date *</ModalLabel>
          <input type="date" value={visitDate} min={new Date().toISOString().split('T')[0]} onChange={e => setVisitDate(e.target.value)} style={inputStyle} />
          <ModalLabel>Visit Time</ModalLabel>
          <input type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)} style={inputStyle} />
          <ModalLabel>Site Address *</ModalLabel>
          <input type="text" value={visitAddress} onChange={e => setVisitAddress(e.target.value)} placeholder="Address for visit" style={inputStyle} />
        </ModalSection>
      )}
      {outcome === 'NOT_INTERESTED' && (
        <ModalSection>
          <ModalLabel>Reason for Drop-off *</ModalLabel>
          <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={inputStyle}>
            <option value="">-- Select Reason --</option>
            {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </ModalSection>
      )}

      <button
        onClick={handleSave}
        disabled={!canSubmit || saving}
        style={{ ...submitBtnStyle, backgroundColor: canSubmit ? '#10b981' : '#1e293b', color: canSubmit ? '#fff' : '#475569', cursor: canSubmit ? 'pointer' : 'not-allowed', marginBottom: '20px' }}
      >
        {saving ? 'Saving…' : 'Log Call'}
      </button>
    </BottomSheet>
  );
};

// ── MODAL: Not Picked ─────────────────────────────────────────────────────────

const NotPickedModal: React.FC<{ lead: LocalLead; attemptCount: number; onClose: () => void; onSave: (note: string) => Promise<void> }> = ({ attemptCount, onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <BottomSheet title="Log Unanswered Call" icon={<PhoneMissed size={18} color="#f43f5e" />} onClose={onClose}>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', gap: '8px' }}>
        <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ color: '#f59e0b', fontSize: '12px', margin: 0 }}>System Note: Lead will be auto-scheduled for a recall tomorrow. This is attempt #{attemptCount}.</p>
      </div>
      <ModalLabel>Brief Observation (Optional)</ModalLabel>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ringing but no answer, switched off..." rows={3} style={{ ...textareaStyle, marginBottom: '14px' }} />
      <button
        onClick={async () => { setSaving(true); try { await onSave(note); } finally { setSaving(false); } }}
        disabled={saving}
        style={{ ...submitBtnStyle, backgroundColor: '#f43f5e', color: '#fff', marginBottom: '20px' }}
      >
        {saving ? 'Saving…' : 'Log Attempt'}
      </button>
    </BottomSheet>
  );
};

// ── MODAL: Schedule Visit ─────────────────────────────────────────────────────

const ScheduleVisitModal: React.FC<{ lead: LocalLead; onClose: () => void; onSave: (d: { address: string; date: string; time: string; notes: string }) => Promise<void> }> = ({ lead, onClose, onSave }) => {
  const [address, setAddress] = useState(lead.fullAddress || lead.siteLocation || '');
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const canSave = address.trim() && date;
  return (
    <BottomSheet title="Schedule Site Inspection" icon={<Calendar size={18} color="#818cf8" />} onClose={onClose}>
      <ModalLabel>Proposed Date *</ModalLabel>
      <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} style={inputStyle} />
      <ModalLabel>Proposed Time (Optional)</ModalLabel>
      <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
      <ModalLabel>Site Address *</ModalLabel>
      <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Address for the site visit" style={inputStyle} />
      <ModalLabel>Preparation Notes (Optional)</ModalLabel>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tools to bring, specific measurements to check..." rows={3} style={{ ...textareaStyle, marginBottom: '14px' }} />
      <button
        onClick={async () => { if (!canSave || saving) return; setSaving(true); try { await onSave({ address, date, time, notes }); } finally { setSaving(false); } }}
        disabled={!canSave || saving}
        style={{ ...submitBtnStyle, backgroundColor: canSave ? '#818cf8' : '#1e293b', color: canSave ? '#fff' : '#475569', cursor: canSave ? 'pointer' : 'not-allowed', marginBottom: '20px' }}
      >
        {saving ? 'Scheduling…' : 'Schedule Visit'}
      </button>
    </BottomSheet>
  );
};

// ── MODAL: Cancel ─────────────────────────────────────────────────────────────

const CancelModal: React.FC<{ onClose: () => void; onSave: (reason: string, comment: string) => Promise<void> }> = ({ onClose, onSave }) => {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <BottomSheet title="Cancel Lead" icon={<Ban size={18} color="#f43f5e" />} onClose={onClose}>
      <div style={{ backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
        <p style={{ color: '#f43f5e', fontSize: '12px', margin: 0 }}>Inquiry will be moved to the Cancelled tab. You can reactivate this profile anytime.</p>
      </div>
      <ModalLabel>Resolution Reason *</ModalLabel>
      <select value={reason} onChange={e => setReason(e.target.value)} style={{ ...inputStyle, marginBottom: '14px' }}>
        <option value="">-- Select Reason --</option>
        {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <ModalLabel>Final Comment (Optional)</ModalLabel>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Specify if there was any conflict or preference..." rows={3} style={{ ...textareaStyle, marginBottom: '14px' }} />
      <button
        onClick={async () => { if (!reason || saving) return; setSaving(true); try { await onSave(reason, comment); } finally { setSaving(false); } }}
        disabled={!reason || saving}
        style={{ ...submitBtnStyle, backgroundColor: reason ? '#f43f5e' : '#1e293b', color: reason ? '#fff' : '#475569', cursor: reason ? 'pointer' : 'not-allowed', marginBottom: '20px' }}
      >
        {saving ? 'Cancelling…' : 'Cancel Lead'}
      </button>
    </BottomSheet>
  );
};

// ── MODAL: Reactivate ─────────────────────────────────────────────────────────

const ReactivateModal: React.FC<{ onClose: () => void; onSave: (insight: string) => Promise<void> }> = ({ onClose, onSave }) => {
  const [insight, setInsight] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <BottomSheet title="Restore Opportunity" icon={<RotateCcw size={18} color="#818cf8" />} onClose={onClose}>
      <div style={{ backgroundColor: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
        <p style={{ color: '#818cf8', fontSize: '12px', margin: 0 }}>Resetting status to FOLLOW UP. This will appear as a fresh activity on your timeline.</p>
      </div>
      <ModalLabel>Reactivation Insight (Optional)</ModalLabel>
      <textarea value={insight} onChange={e => setInsight(e.target.value)} placeholder="Why is this client back in the pipeline?" rows={3} style={{ ...textareaStyle, marginBottom: '14px' }} />
      <button
        onClick={async () => { setSaving(true); try { await onSave(insight); } finally { setSaving(false); } }}
        disabled={saving}
        style={{ ...submitBtnStyle, backgroundColor: '#4f46e5', color: '#fff', marginBottom: '20px' }}
      >
        {saving ? 'Reactivating…' : 'Restore Opportunity'}
      </button>
    </BottomSheet>
  );
};

// ── MODAL: Confirm ─────────────────────────────────────────────────────────────

const ConfirmModal: React.FC<{ title: string; icon: React.ReactNode; message: string; confirmLabel: string; confirmColor: string; onClose: () => void; onConfirm: () => Promise<void> }> = ({ title, icon, message, confirmLabel, confirmColor, onClose, onConfirm }) => {
  const [saving, setSaving] = useState(false);
  return (
    <BottomSheet title={title} icon={icon} onClose={onClose}>
      <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{message}</p>
      </div>
      <button
        onClick={async () => { setSaving(true); try { await onConfirm(); } finally { setSaving(false); } }}
        disabled={saving}
        style={{ ...submitBtnStyle, backgroundColor: confirmColor, color: '#fff', marginBottom: '20px' }}
      >
        {saving ? 'Processing…' : confirmLabel}
      </button>
    </BottomSheet>
  );
};

// ── MODAL: Edit Lead ──────────────────────────────────────────────────────────

const EditLeadModal: React.FC<{ lead: LocalLead; onClose: () => void; onSave: (updates: Partial<LocalLead>) => Promise<void> }> = ({ lead, onClose, onSave }) => {
  const [phone, setPhone] = useState(lead.contactNumber);
  const [name, setName] = useState(lead.customerName);
  const [address, setAddress] = useState(lead.fullAddress || lead.siteLocation || '');
  const [service, setService] = useState(lead.serviceType);
  const [source, setSource] = useState(lead.inquirySource);
  const [refName, setRefName] = useState(lead.referenceName || '');
  const [reqDetails, setReqDetails] = useState(lead.requirementDetails || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!phone || !source || saving) return;
    setSaving(true);
    try {
      await onSave({
        contactNumber: phone, customerName: name, fullAddress: address,
        serviceType: service, inquirySource: source,
        referenceName: source === 'THROUGH_REFERENCE' ? refName : undefined,
        requirementDetails: reqDetails,
      });
    } finally { setSaving(false); }
  };

  return (
    <BottomSheet title="Edit Lead Profile" icon={<Pencil size={18} color="#f59e0b" />} onClose={onClose}>
      <ModalLabel>Contact Phone *</ModalLabel>
      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} style={inputStyle} />
      <ModalLabel>Customer Name</ModalLabel>
      <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <ModalLabel>Site Address</ModalLabel>
      <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
      <ModalLabel>Service Required *</ModalLabel>
      <select value={service} onChange={e => setService(e.target.value)} style={inputStyle}>
        {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <ModalLabel>Inquiry Source *</ModalLabel>
      <select value={source} onChange={e => setSource(e.target.value)} style={inputStyle}>
        {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {source === 'THROUGH_REFERENCE' && (
        <><ModalLabel>Reference Person Name *</ModalLabel>
        <input type="text" value={refName} onChange={e => setRefName(e.target.value)} style={inputStyle} /></>
      )}
      <ModalLabel>Requirement Details</ModalLabel>
      <textarea value={reqDetails} onChange={e => setReqDetails(e.target.value)} rows={3} style={{ ...textareaStyle, marginBottom: '14px' }} />
      <button
        onClick={handleSave}
        disabled={!phone || !source || saving}
        style={{ ...submitBtnStyle, backgroundColor: '#f59e0b', color: '#fff', marginBottom: '20px' }}
      >
        {saving ? 'Updating…' : 'Update Profile'}
      </button>
    </BottomSheet>
  );
};

// ── Modal helper components ──────────────────────────────────────────────────

const ModalLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', margin: '0 0 6px', letterSpacing: '0.04em' }}>{children}</p>
);
const ModalSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', backgroundColor: '#1e293b',
  border: '1.5px solid #334155', borderRadius: '12px', color: '#f1f5f9',
  fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif",
  boxSizing: 'border-box', marginBottom: '12px', appearance: 'none',
};
const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', backgroundColor: '#1e293b',
  border: '1.5px solid #334155', borderRadius: '12px', color: '#f1f5f9',
  fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif",
  resize: 'none', boxSizing: 'border-box', lineHeight: '1.5', marginBottom: '12px',
};
const submitBtnStyle: React.CSSProperties = {
  width: '100%', padding: '15px', border: 'none', borderRadius: '14px',
  fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent', transition: 'opacity 0.15s',
};

// ── MODAL: Complete Visit ───────────────────────────────────────────────────────

const CompleteVisitModal: React.FC<{
  visit: LocalVisit;
  lead: LocalLead;
  onClose: () => void;
  onSave: (data: { outcome: string; date?: string; time?: string; cancelReason?: string }) => Promise<void>;
}> = ({ visit, onClose, onSave }) => {
  const [outcome, setOutcome] = useState('');
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState('10:00');
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = outcome !== '' &&
    (outcome !== 'WANTS_RECALL' || date) &&
    (outcome !== 'RESCHEDULE' || date) &&
    (outcome !== 'NOT_INTERESTED' || cancelReason);

  const handleSave = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onSave({ outcome, date, time, cancelReason });
    } finally { setSaving(false); }
  };

  const OUTCOMES = [
    { key: 'WANTS_RECALL',   label: 'Wants Recall',    color: '#0ea5e9' },
    { key: 'RESCHEDULE',     label: 'Reschedule Visit',color: '#f59e0b' },
    { key: 'NO_ANSWER',      label: 'No Answer',       color: '#64748b' },
    { key: 'NOT_INTERESTED', label: 'Not Interested',  color: '#f43f5e' },
    { key: 'CONVERT',        label: 'Convert',         color: '#10b981' },
  ];

  return (
    <BottomSheet title="Complete Site Visit" icon={<CheckCircle2 size={18} color="#818cf8" />} onClose={onClose}>
      <ModalLabel>Visit Outcome *</ModalLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {OUTCOMES.map(opt => (
          <button
            key={opt.key}
            onClick={() => setOutcome(opt.key)}
            style={{
              padding: '12px', borderRadius: '10px', border: `1.5px solid ${outcome === opt.key ? opt.color : '#334155'}`,
              backgroundColor: outcome === opt.key ? `${opt.color}20` : '#1e293b',
              color: outcome === opt.key ? opt.color : '#64748b',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s',
            }}
          >{opt.label}</button>
        ))}
      </div>

      {(outcome === 'WANTS_RECALL' || outcome === 'RESCHEDULE') && (
        <ModalSection>
          <ModalLabel>{outcome === 'RESCHEDULE' ? 'New Date' : 'Recall Date'} *</ModalLabel>
          <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} style={inputStyle} />
          <ModalLabel>{outcome === 'RESCHEDULE' ? 'New Time' : 'Recall Time'}</ModalLabel>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
        </ModalSection>
      )}

      {outcome === 'NOT_INTERESTED' && (
        <ModalSection>
          <ModalLabel>Reason for Drop-off *</ModalLabel>
          <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }}>
            <option value="">-- Select Reason --</option>
            {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </ModalSection>
      )}

      {outcome === 'CONVERT' && (
        <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
          <p style={{ color: '#10b981', fontSize: '12px', margin: 0 }}>This will complete the visit and instantly convert the lead to a Customer.</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSubmit || saving}
        style={{ ...submitBtnStyle, backgroundColor: canSubmit ? '#818cf8' : '#1e293b', color: canSubmit ? '#fff' : '#475569', cursor: canSubmit ? 'pointer' : 'not-allowed', marginBottom: '20px' }}
      >
        {saving ? 'Processing…' : 'Complete Visit'}
      </button>
    </BottomSheet>
  );
};
