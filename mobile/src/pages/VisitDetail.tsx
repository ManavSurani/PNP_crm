/**
 * PNP CRM Mobile — Visit Detail Screen
 * File: mobile/src/pages/VisitDetail.tsx
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, FileText, Phone, CheckCircle2, X } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { ActionButton } from '../components/FormInput';
import { useAppStore } from '../store/appStore';
import { getAllVisits, getAllLeads, updateVisitStatus, saveFollowUp, saveVisit, updateLeadStatus, addLeadNote, saveCustomerFromLead, getDashboardStats, type LocalVisit, type LocalLead } from '../db/sqlite';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  SCHEDULED: { label: 'Scheduled', bg: '#ecfdf5', text: '#064e3b' },
  COMPLETED: { label: 'Completed ✓', bg: '#eef2ff', text: '#312e81' },
  CANCELLED: { label: 'Cancelled', bg: '#fff1f2', text: '#881337' },
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const CANCEL_REASONS = ['Budget issue', 'Bought from competitor', 'No longer required', 'Not reachable', 'Other'];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const toTimeStr = (t: string) => {
  const [h, m] = t.split(':');
  const hh = parseInt(h, 10);
  return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
};

export const VisitDetail: React.FC = () => {
  const { selectedVisitId, goBack, navigate, addToast, setStats } = useAppStore();
  const [visit, setVisit] = useState<LocalVisit | null>(null);
  const [lead, setLead] = useState<LocalLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const refreshStats = async () => {
    try {
      const stats = await getDashboardStats();
      setStats(stats);
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [visits, leads] = await Promise.all([getAllVisits(), getAllLeads()]);
        const found = visits.find((v) => v.mobileId === selectedVisitId);
        setVisit(found ?? null);
        if (found) {
          setLead(leads.find((l) => l.mobileId === found.leadMobileId) ?? null);
        }
      } catch {
        setVisit({
          mobileId: 'v1', leadMobileId: 'demo-1', address: 'Vastrapur, Ahmedabad',
          date: new Date().toISOString().split('T')[0], time: '10:30 AM',
          status: 'SCHEDULED', syncStatus: 'PENDING', createdAt: new Date().toISOString(),
          notes: 'Client wants modular kitchen discussion',
        });
        setLead({ mobileId: 'demo-1', customerName: 'Rajesh Patel', contactNumber: '9876543210', serviceType: 'INTERIOR', inquirySource: 'REFERENCE', priority: 'HIGH', status: 'VISIT_BOOKED', syncStatus: 'PENDING', createdAt: new Date().toISOString() });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedVisitId]);

  const handleStatusUpdate = async (status: 'COMPLETED' | 'CANCELLED') => {
    if (!visit) return;
    try {
      await updateVisitStatus(visit.mobileId, status);
      setVisit((prev) => prev ? { ...prev, status } : null);
      addToast(status === 'COMPLETED' ? '✅ Visit marked as completed!' : 'Visit cancelled.', status === 'COMPLETED' ? 'success' : 'info');
    } catch {
      addToast('Failed to update visit status.', 'error');
    }
  };

  if (loading || !visit) {
    return (
      <MobileLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ width: '24px', height: '24px', border: '2.5px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </MobileLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[visit.status] ?? STATUS_CONFIG['SCHEDULED'];
  const isActive = visit.status === 'SCHEDULED';

  return (
    <MobileLayout hideBottomNav>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={22} color="#94a3b8" />
        </button>
        <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0, flex: 1 }}>Visit Details</h1>
        <span style={{ backgroundColor: statusCfg.bg, color: statusCfg.text, fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '9999px' }}>
          {statusCfg.label}
        </span>
      </div>

      <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Visit Info */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
          <p style={{ color: '#10b981', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>Visit Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <InfoRow icon={<MapPin size={15} color="#10b981" />} label="Address" value={
              <a href={`https://maps.google.com/?q=${encodeURIComponent(visit.address)}`} target="_blank" rel="noreferrer" style={{ color: '#e2e8f0', textDecoration: 'underline', textDecorationColor: 'rgba(16,185,129,0.5)' }}>
                {visit.address}
              </a>
            } />
            <InfoRow icon={<Calendar size={15} color="#10b981" />} label="Date" value={formatDate(visit.date)} />
            <InfoRow icon={<Clock size={15} color="#10b981" />} label="Time" value={visit.time} />
            {visit.notes && <InfoRow icon={<FileText size={15} color="#10b981" />} label="Notes" value={visit.notes} />}
          </div>
        </div>

        {/* Lead Quick Info */}
        {lead && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Customer</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '700', margin: '0 0 4px' }}>{lead.customerName}</p>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{lead.contactNumber}</p>
              </div>
              <a href={`tel:${lead.contactNumber}`} style={{ textDecoration: 'none' }}>
                <div style={{ width: '44px', height: '44px', backgroundColor: '#1d4ed8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(29,78,216,0.4)' }}>
                  <Phone size={20} color="#ffffff" />
                </div>
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        {isActive && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ActionButton label="Complete Visit" onClick={() => setShowCompleteModal(true)} color="emerald" icon={<CheckCircle2 size={16} color="#fff" />} />
            <ActionButton label="Cancel Visit" onClick={() => handleStatusUpdate('CANCELLED')} color="rose" outline />
          </div>
        )}

        <ActionButton label="Log Follow-Up Call" onClick={() => navigate('add-followup')} color="indigo" icon={<Phone size={16} color="#fff" />} />
      </div>

      {showCompleteModal && lead && (
        <CompleteVisitModal
          visit={visit}
          lead={lead}
          onClose={() => setShowCompleteModal(false)}
          onSave={async (data) => {
            await updateVisitStatus(visit.mobileId, 'COMPLETED');
            
            if (data.outcome === 'WANTS_RECALL') {
              await saveFollowUp({ leadMobileId: lead.mobileId, leadContactNumber: lead.contactNumber, scheduledDate: data.date!, noteGiven: 'Requested recall after visit', outcome: 'NOT_PICKED', nextCallDate: data.date, nextCallTime: data.time });
              await updateLeadStatus(lead.mobileId, 'FOLLOW_UP');
              await addLeadNote(lead.mobileId, `Visit marked complete. Needs recall on ${fmtDate(data.date!)}`, 'VISIT_COMPLETED');
            } else if (data.outcome === 'RESCHEDULE') {
              await saveVisit({ leadMobileId: lead.mobileId, address: visit.address, date: data.date!, time: data.time ? toTimeStr(data.time) : '10:00 AM', status: 'SCHEDULED', notes: 'Rescheduled visit' });
              await updateLeadStatus(lead.mobileId, 'MEETING_SCHEDULED');
              await addLeadNote(lead.mobileId, `Visit rescheduled to ${fmtDate(data.date!)}`, 'VISIT_SCHEDULED');
            } else if (data.outcome === 'NO_ANSWER') {
              await updateLeadStatus(lead.mobileId, 'FOLLOW_UP');
              await addLeadNote(lead.mobileId, `Visit marked complete. No answer.`, 'VISIT_COMPLETED');
            } else if (data.outcome === 'NOT_INTERESTED') {
              await updateLeadStatus(lead.mobileId, 'CANCELLED');
              await addLeadNote(lead.mobileId, `Lead cancelled after visit — Reason: ${data.cancelReason}`, 'CANCELLED');
            } else if (data.outcome === 'CONVERT') {
              await updateLeadStatus(lead.mobileId, 'WON_ORDER');
              await saveCustomerFromLead(lead);
              await addLeadNote(lead.mobileId, 'Lead converted to customer after visit.', 'CONVERTED');
              const { setSelectedCustomerId } = useAppStore.getState();
              setSelectedCustomerId(lead.mobileId);
              navigate('customer-detail');
            }

            await refreshStats();
            setShowCompleteModal(false);
            setVisit((prev) => prev ? { ...prev, status: 'COMPLETED' } : null);
            addToast('Visit completed!', 'success');
          }}
        />
      )}
    </MobileLayout>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
    <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <div style={{ color: '#e2e8f0', fontSize: '14px', margin: 0, lineHeight: '1.4' }}>{value}</div>
    </div>
  </div>
);

// ── Modal helpers ────────────────────────────────────────────────────────────

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
const submitBtnStyle: React.CSSProperties = {
  width: '100%', padding: '15px', border: 'none', borderRadius: '14px',
  fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent', transition: 'opacity 0.15s',
};

// ── Complete Visit Modal ─────────────────────────────────────────────────────

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

