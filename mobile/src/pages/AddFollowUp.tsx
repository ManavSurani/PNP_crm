/**
 * PNP CRM Mobile — Add Follow-Up Screen
 * File: mobile/src/pages/AddFollowUp.tsx
 */

import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { FormInput, FormSelect, ActionButton } from '../components/FormInput';
import { useAppStore } from '../store/appStore';
import { saveFollowUp, getAllLeads } from '../db/sqlite';
import { scheduleFollowUpNotification } from '../utils/notifications';

const OUTCOME_OPTIONS = [
  { label: 'Select Outcome', value: '' },
  { label: '📞 Not Picked', value: 'NOT_PICKED' },
  { label: '✅ Picked — Interested', value: 'PICKED' },
  { label: '🔥 Very Interested', value: 'INTERESTED' },
  { label: '❌ Not Interested', value: 'NOT_INTERESTED' },
  { label: '🔁 Call Back Later', value: 'CALL_BACK_LATER' },
];

// Helper to get tomorrow's date as YYYY-MM-DD
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const AddFollowUp: React.FC = () => {
  const { selectedLeadId, goBack, addToast } = useAppStore();

  const [form, setForm] = useState({
    outcome: '',
    noteGiven: '',
    nextCallDate: tomorrow(),
    nextCallTime: '10:00',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, val: string) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!form.outcome) { setError('Please select a call outcome.'); return; }
    if (saving) return;
    setSaving(true);

    try {
      // Find the lead's contact number to link the follow-up
      let contactNumber = '';
      try {
        const all = await getAllLeads();
        const lead = all.find((l) => l.mobileId === selectedLeadId);
        contactNumber = lead?.contactNumber ?? '';
      } catch {
        contactNumber = '0000000000'; // fallback for browser preview
      }

      const newFu = await saveFollowUp({
        leadMobileId: selectedLeadId ?? '',
        leadContactNumber: contactNumber,
        scheduledDate: `${form.nextCallDate}T${form.nextCallTime}:00.000Z`,
        noteGiven: form.noteGiven.trim() || undefined,
        outcome: form.outcome,
      });

      await scheduleFollowUpNotification(newFu);

      addToast('✅ Follow-up saved! Will sync with CRM on next sync.', 'success');
      goBack();
    } catch {
      addToast('Failed to save follow-up. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout hideBottomNav>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={22} color="#94a3b8" />
        </button>
        <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0 }}>Log Follow-Up</h1>
      </div>

      <div style={{ padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Outcome selector */}
        <FormSelect
          label="Call Outcome"
          value={form.outcome}
          onChange={(v) => { set('outcome', v); setError(''); }}
          options={OUTCOME_OPTIONS}
          required
        />
        {error && <p style={{ color: '#f43f5e', fontSize: '12px', margin: '-12px 0 0', fontWeight: '500' }}>⚠ {error}</p>}

        {/* Notes */}
        <FormInput
          label="Notes"
          value={form.noteGiven}
          onChange={(v) => set('noteGiven', v)}
          placeholder="What was discussed? Any important details…"
          multiline
          rows={4}
        />

        {/* Next Call */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', padding: '16px' }}>
          <p style={{ color: '#4f46e5', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            Schedule Next Call
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormInput label="Date" value={form.nextCallDate} onChange={(v) => set('nextCallDate', v)} type="date" />
            <FormInput label="Time" value={form.nextCallTime} onChange={(v) => set('nextCallTime', v)} type="time" />
          </div>
        </div>

        <ActionButton
          label={saving ? 'Saving…' : 'Save Follow-Up'}
          onClick={handleSave}
          color="indigo"
          icon={<Save size={18} color="#fff" />}
          disabled={saving}
        />

        <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', margin: 0 }}>
          Follow-up will be saved locally and synced to CRM on next sync.
        </p>
      </div>
    </MobileLayout>
  );
};
