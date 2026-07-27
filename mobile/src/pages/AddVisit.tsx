/**
 * PNP CRM Mobile — Add Visit Screen
 * File: mobile/src/pages/AddVisit.tsx
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { FormInput, FormSelect, ActionButton } from '../components/FormInput';
import { useAppStore } from '../store/appStore';
import { saveVisit, updateLeadStatus, getAllLeads, type LocalLead } from '../db/sqlite';
import { scheduleVisitNotification } from '../utils/notifications';

const tomorrow = () => {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const AddVisit: React.FC = () => {
  const { goBack, addToast, selectedLeadId } = useAppStore();
  const [leads, setLeads] = useState<LocalLead[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    leadMobileId: selectedLeadId ?? '',
    address: '',
    date: tomorrow(),
    time: '10:00',
    notes: '',
  });

  useEffect(() => {
    getAllLeads()
      .then((data) => setLeads(data))
      .catch(() => setLeads([]));
  }, []);

  const leadOptions = [
    { label: 'Select a lead', value: '' },
    ...leads.map((l) => ({ label: `${l.customerName} — ${l.contactNumber}`, value: l.mobileId })),
  ];

  const setField = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.leadMobileId) errs.leadMobileId = 'Please select a lead';
    if (!form.address.trim()) errs.address = 'Visit address is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.time) errs.time = 'Time is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      // Format time to readable string (e.g. "10:30 AM")
      const [h, m] = form.time.split(':');
      const hr = parseInt(h);
      const timeStr = `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;

      const newVisit = await saveVisit({
        leadMobileId: form.leadMobileId,
        address: form.address.trim(),
        date: form.date,
        time: timeStr,
        status: 'SCHEDULED',
        notes: form.notes.trim() || undefined,
      });

      await scheduleVisitNotification(newVisit);

      // Auto-update lead status to MEETING_SCHEDULED
      await updateLeadStatus(form.leadMobileId, 'MEETING_SCHEDULED');

      addToast('✅ Site visit scheduled! Lead status updated to Visit Booked.', 'success');
      goBack();
    } catch {
      addToast('Failed to schedule visit. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

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
        <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0 }}>Schedule Site Visit</h1>
      </div>

      <div style={{ padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        <FormSelect label="Lead" value={form.leadMobileId} onChange={(v) => setField('leadMobileId', v)} options={leadOptions} required />
        {errors.leadMobileId && <p style={{ color: '#f43f5e', fontSize: '12px', margin: '-12px 0 0', fontWeight: '500' }}>⚠ {errors.leadMobileId}</p>}

        <FormInput label="Visit Address" value={form.address} onChange={(v) => setField('address', v)} placeholder="Property address for the visit" required />
        {errors.address && <p style={{ color: '#f43f5e', fontSize: '12px', margin: '-12px 0 0', fontWeight: '500' }}>⚠ {errors.address}</p>}

        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '16px' }}>
          <p style={{ color: '#10b981', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            Visit Schedule
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormInput label="Date" value={form.date} onChange={(v) => setField('date', v)} type="date" required />
            <FormInput label="Time" value={form.time} onChange={(v) => setField('time', v)} type="time" required />
          </div>
        </div>

        <FormInput label="Preparation Notes" value={form.notes} onChange={(v) => setField('notes', v)} placeholder="Any preparation notes for the visit?" multiline rows={3} />

        <ActionButton
          label={saving ? 'Scheduling…' : 'Schedule Visit'}
          onClick={handleSave}
          color="emerald"
          icon={<Save size={18} color="#fff" />}
          disabled={saving}
        />

        <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', margin: 0 }}>
          Lead status will automatically update to "Visit Booked".
        </p>
      </div>
    </MobileLayout>
  );
};
