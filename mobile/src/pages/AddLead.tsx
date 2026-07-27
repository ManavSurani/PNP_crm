/**
 * PNP CRM Mobile — Add New Lead Screen
 * File: mobile/src/pages/AddLead.tsx
 *
 * Exact desktop CRM parity:
 *  - 5 fields: Customer Name, Contact Phone*, Inquiry Source*, Service Required, Site Address
 *  - Correct dropdown values matching desktop CRM
 *  - Real-time duplicate phone detection (600ms debounce)
 *  - Reference Person Name (conditional: shown only when source = THROUGH_REFERENCE)
 *  - 3 action buttons: Cancel | Quick Visit (green) | Create Lead ✓ (indigo)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, User, Phone, ChevronDown, MapPin, CheckCircle, ExternalLink, X, AlertTriangle, UserCheck,
} from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { useAppStore } from '../store/appStore';
import { saveLead, checkDuplicatePhone, addLeadNote, getDashboardStats, type LocalLead } from '../db/sqlite';

// ── Dropdown Options (exact desktop CRM values) ──────────────────────────────

const SOURCE_OPTIONS = [
  { label: '--Select--',   value: '' },
  { label: 'WhatsApp',     value: 'WHATSAPP' },
  { label: 'Facebook',     value: 'FACEBOOK' },
  { label: 'Instagram',    value: 'INSTAGRAM' },
  { label: 'Website',      value: 'WEBSITE' },
  { label: 'Direct Call',  value: 'DIRECT_CALL' },
  { label: 'Walk In',      value: 'WALK_IN' },
  { label: 'Reference',    value: 'THROUGH_REFERENCE' },
];

const SERVICE_OPTIONS = [
  { label: '--Select--',      value: '' },
  { label: 'Interior Design', value: 'Interior Design' },
  { label: '2BHK Interior',   value: '2BHK Interior' },
  { label: '3BHK Interior',   value: '3BHK Interior' },
  { label: '4BHK Interior',   value: '4BHK Interior' },
  { label: 'Raw house',       value: 'Raw house' },
  { label: 'Office',          value: 'Office' },
  { label: 'Other',           value: 'Other' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export const AddLead: React.FC = () => {
  const { goBack, navigate, addToast, setStats, setPendingSyncCount, setSelectedLeadId } = useAppStore();

  const [form, setForm] = useState({
    customerName:    '',
    contactPhone:    '',
    inquirySource:   '',
    referenceName:   '',
    serviceRequired: '',
    fullAddress:     '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Duplicate detection state
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState<LocalLead | null>(null);
  const [duplicateAck, setDuplicateAck] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Field helpers ────────────────────────────────────────────────────────────

  const setField = (field: string, val: string) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  // Phone input: digits only, max 10 chars
  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    setField('contactPhone', digits);
    setDuplicateLead(null);
    setDuplicateAck(false);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (digits.length === 10) {
      setPhoneChecking(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const found = await checkDuplicatePhone(digits);
          setDuplicateLead(found);
        } catch {
          setDuplicateLead(null);
        } finally {
          setPhoneChecking(false);
        }
      }, 600);
    }
  };

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!/^\d{10}$/.test(form.contactPhone)) errs.contactPhone = 'Enter a valid 10-digit phone number';
    if (!form.inquirySource)                  errs.inquirySource = 'Please select an inquiry source';
    if (form.inquirySource === 'THROUGH_REFERENCE' && !form.referenceName.trim()) {
      errs.referenceName = 'Reference person name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // ── Save helpers ─────────────────────────────────────────────────────────────

  const buildLeadPayload = () => ({
    customerName:    form.customerName.trim() || 'Unknown Customer',
    contactNumber:   form.contactPhone,
    inquirySource:   form.inquirySource,
    referenceName:   form.inquirySource === 'THROUGH_REFERENCE' ? form.referenceName.trim() : undefined,
    serviceType:     form.serviceRequired || 'Interior Design',
    fullAddress:     form.fullAddress.trim() || undefined,
    siteLocation:    form.fullAddress.trim() || undefined,
    priority:        'MEDIUM' as const,
    status:          'NEW_INQUIRY',
  });

  const handleCreateLead = async () => {
    if (!validate() || saving) return;
    if (duplicateLead && !duplicateAck) return;
    setSaving(true);
    try {
      const newLead = await saveLead(buildLeadPayload() as Parameters<typeof saveLead>[0]);
      await addLeadNote(
        newLead.mobileId,
        `Lead created on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        'SYSTEM_CREATE'
      );
      const stats = await getDashboardStats();
      setStats(stats);
      setPendingSyncCount(stats.pendingSync);
      addToast('✅ Lead created successfully!', 'success');
      goBack();
    } catch (err: any) {
      if (err?.message?.includes('UNIQUE')) {
        addToast('A lead with this phone number already exists.', 'error');
      } else {
        addToast('Failed to save lead. Please try again.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleQuickVisit = async () => {
    if (!validate() || saving) return;
    if (duplicateLead && !duplicateAck) return;
    setSaving(true);
    try {
      const newLead = await saveLead(buildLeadPayload() as Parameters<typeof saveLead>[0]);
      await addLeadNote(
        newLead.mobileId,
        `Lead created on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        'SYSTEM_CREATE'
      );
      const stats = await getDashboardStats();
      setStats(stats);
      setPendingSyncCount(stats.pendingSync);
      setSelectedLeadId(newLead.mobileId);
      navigate('lead-detail');
    } catch (err: any) {
      if (err?.message?.includes('UNIQUE')) {
        addToast('A lead with this phone number already exists.', 'error');
      } else {
        addToast('Failed to save lead. Please try again.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = saving || (duplicateLead !== null && !duplicateAck);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <MobileLayout hideBottomNav>
      {/* Sticky Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px 16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <ArrowLeft size={22} color="#94a3b8" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0 }}>Capture New Lead</h1>
          <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Add a fresh inquiry to your sales pipeline.</p>
        </div>
      </div>

      {/* Form Body */}
      <div style={{ padding: '20px 16px 160px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Field 1: Customer Name ── */}
        <FieldWrapper>
          <FieldLabel label="Customer Name" />
          <InputWithIcon
            icon={<User size={16} color="#64748b" />}
            value={form.customerName}
            onChange={v => setField('customerName', v)}
            placeholder="Full name"
            type="text"
          />
        </FieldWrapper>

        {/* ── Field 2: Contact Phone (required + duplicate detection) ── */}
        <FieldWrapper>
          <FieldLabel label="Contact Phone" required />
          <div style={{ position: 'relative' }}>
            <InputWithIcon
              icon={<Phone size={16} color="#64748b" />}
              value={form.contactPhone}
              onChange={handlePhoneChange}
              placeholder="10-digit mobile number"
              type="tel"
              inputMode="numeric"
              hasError={!!errors.contactPhone}
              rightSlot={phoneChecking ? <Spinner /> : null}
            />
          </div>
          {errors.contactPhone && <ErrorText msg={errors.contactPhone} />}

          {/* Duplicate Warning Panel */}
          {duplicateLead && !phoneChecking && (
            <div style={{
              marginTop: '10px',
              backgroundColor: 'rgba(234,179,8,0.08)',
              border: '1.5px solid rgba(234,179,8,0.4)',
              borderRadius: '12px', padding: '14px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#eab308" />
                <span style={{ color: '#eab308', fontSize: '13px', fontWeight: '700' }}>Record Already Exists</span>
              </div>
              <div style={{
                backgroundColor: '#1e293b', borderRadius: '8px', padding: '10px 12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <p style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                    {duplicateLead.customerName || 'Unknown Customer'}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0 0' }}>
                    {duplicateLead.contactNumber} · {duplicateLead.serviceType}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedLeadId(duplicateLead.mobileId); navigate('lead-detail'); }}
                  style={{ background: 'none', border: '1px solid #334155', borderRadius: '8px', padding: '6px 10px', color: '#818cf8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Open →
                </button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={duplicateAck}
                  onChange={e => setDuplicateAck(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                />
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  I understand, create duplicate lead anyway.
                </span>
              </label>
            </div>
          )}
        </FieldWrapper>

        {/* ── Field 3: Inquiry Source (required) ── */}
        <FieldWrapper>
          <FieldLabel label="Inquiry Source" required />
          <SelectField
            value={form.inquirySource}
            onChange={v => setField('inquirySource', v)}
            options={SOURCE_OPTIONS}
            hasError={!!errors.inquirySource}
          />
          {errors.inquirySource && <ErrorText msg={errors.inquirySource} />}
        </FieldWrapper>

        {/* ── Field 3b: Reference Person Name (conditional) ── */}
        {form.inquirySource === 'THROUGH_REFERENCE' && (
          <FieldWrapper style={{ animation: 'slideDown 0.2s ease-out' }}>
            <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
            <FieldLabel label="Reference Person Name" required />
            <InputWithIcon
              icon={<UserCheck size={16} color="#64748b" />}
              value={form.referenceName}
              onChange={v => setField('referenceName', v)}
              placeholder="Name of reference person"
              type="text"
              hasError={!!errors.referenceName}
            />
            {errors.referenceName && <ErrorText msg={errors.referenceName} />}
          </FieldWrapper>
        )}

        {/* ── Field 4: Service Required ── */}
        <FieldWrapper>
          <FieldLabel label="Service Required" />
          <SelectField
            value={form.serviceRequired}
            onChange={v => setField('serviceRequired', v)}
            options={SERVICE_OPTIONS}
          />
        </FieldWrapper>

        {/* ── Field 5: Site Address ── */}
        <FieldWrapper>
          <FieldLabel label="Site Address" />
          <div style={{ position: 'relative' }}>
            <MapPin size={16} color="#64748b" style={{ position: 'absolute', left: '14px', top: '14px' }} />
            <textarea
              value={form.fullAddress}
              onChange={e => setField('fullAddress', e.target.value)}
              placeholder="Full site address / location details"
              rows={3}
              style={{
                width: '100%', padding: '12px 14px 12px 38px',
                backgroundColor: '#1e293b', border: '1.5px solid #334155',
                borderRadius: '12px', color: '#f1f5f9', fontSize: '14px',
                outline: 'none', fontFamily: "'Inter', sans-serif",
                resize: 'none', boxSizing: 'border-box', lineHeight: '1.5',
              }}
            />
          </div>
        </FieldWrapper>

      </div>

      {/* ── Sticky Bottom Button Bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0f172a', borderTop: '1px solid #1e293b',
        padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', gap: '10px', zIndex: 100,
      }}>
        {/* Cancel */}
        <button
          onClick={goBack}
          disabled={saving}
          style={{
            flex: '0 0 auto', padding: '0 18px', height: '50px',
            backgroundColor: 'transparent', border: '1.5px solid #334155',
            borderRadius: '14px', color: '#94a3b8', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={16} />
          Cancel
        </button>

        {/* Quick Visit */}
        <button
          onClick={handleQuickVisit}
          disabled={isDisabled}
          style={{
            flex: 1, height: '50px',
            backgroundColor: isDisabled ? '#1e293b' : '#10b981',
            border: 'none', borderRadius: '14px',
            color: isDisabled ? '#475569' : '#ffffff',
            fontSize: '14px', fontWeight: '700',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'background-color 0.15s', WebkitTapHighlightColor: 'transparent',
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          <ExternalLink size={16} />
          Quick Visit
        </button>

        {/* Create Lead */}
        <button
          onClick={handleCreateLead}
          disabled={isDisabled}
          style={{
            flex: 1, height: '50px',
            backgroundColor: isDisabled ? '#1e293b' : '#4f46e5',
            border: 'none', borderRadius: '14px',
            color: isDisabled ? '#475569' : '#ffffff',
            fontSize: '14px', fontWeight: '700',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'background-color 0.15s', WebkitTapHighlightColor: 'transparent',
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          {saving ? (
            <Spinner color="#ffffff" />
          ) : (
            <>
              <CheckCircle size={16} />
              Create Lead
            </>
          )}
        </button>
      </div>
    </MobileLayout>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const FieldWrapper: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
    {children}
  </div>
);

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', letterSpacing: '0.04em' }}>
    {label}{required && <span style={{ color: '#f43f5e', marginLeft: '3px' }}>*</span>}
  </label>
);

const ErrorText: React.FC<{ msg: string }> = ({ msg }) => (
  <p style={{ color: '#f43f5e', fontSize: '12px', margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
    ⚠ {msg}
  </p>
);

const Spinner: React.FC<{ color?: string }> = ({ color = '#64748b' }) => (
  <>
    <div style={{
      width: '16px', height: '16px',
      border: `2px solid ${color}40`, borderTopColor: color,
      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

interface InputWithIconProps {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  hasError?: boolean;
  rightSlot?: React.ReactNode | null;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({
  icon, value, onChange, placeholder, type = 'text', inputMode, hasError, rightSlot,
}) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
    <div style={{ position: 'absolute', left: '14px', display: 'flex', alignItems: 'center' }}>{icon}</div>
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '13px 40px 13px 40px',
        backgroundColor: '#1e293b',
        border: `1.5px solid ${hasError ? '#f43f5e' : '#334155'}`,
        borderRadius: '12px', color: '#f1f5f9', fontSize: '14px',
        outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
      }}
    />
    {rightSlot && (
      <div style={{ position: 'absolute', right: '14px', display: 'flex', alignItems: 'center' }}>
        {rightSlot}
      </div>
    )}
  </div>
);

interface SelectFieldProps {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  hasError?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ value, onChange, options, hasError }) => (
  <div style={{ position: 'relative' }}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '13px 40px 13px 14px', appearance: 'none',
        backgroundColor: '#1e293b',
        border: `1.5px solid ${hasError ? '#f43f5e' : '#334155'}`,
        borderRadius: '12px', color: value ? '#f1f5f9' : '#64748b',
        fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box', cursor: 'pointer',
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} style={{ color: '#f1f5f9', backgroundColor: '#1e293b' }}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown size={16} color="#64748b" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
  </div>
);
