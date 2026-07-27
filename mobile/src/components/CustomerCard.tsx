/**
 * PNP CRM Mobile — CustomerCard Component
 * File: mobile/src/components/CustomerCard.tsx
 */

import React from 'react';
import { Phone, ChevronRight } from 'lucide-react';
import type { LocalCustomer } from '../db/sqlite';

interface CustomerCardProps {
  customer: LocalCustomer;
  onTap: () => void;
}

const PROJECT_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE:    { bg: '#ecfdf5', text: '#064e3b', label: 'Active Project' },
  COMPLETED: { bg: '#eef2ff', text: '#312e81', label: 'Completed ✓' },
  ON_HOLD:   { bg: '#fffbeb', text: '#92400e', label: 'On Hold' },
};

const SERVICE_LABELS: Record<string, string> = {
  INTERIOR:   'Interior',
  EXTERIOR:   'Exterior',
  FULL_HOME:  'Full Home',
  COMMERCIAL: 'Commercial',
  OTHER:      'Other',
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');

const formatWonDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onTap }) => {
  const psCfg = PROJECT_STATUS_CONFIG[customer.projectStatus] ?? PROJECT_STATUS_CONFIG['ACTIVE'];
  const initials = getInitials(customer.customerName);

  return (
    <button
      onClick={onTap}
      style={{
        width: '100%', backgroundColor: '#1e293b', borderRadius: '14px',
        padding: '0', border: 'none', cursor: 'pointer', display: 'flex',
        overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        textAlign: 'left', WebkitTapHighlightColor: 'transparent',
      }}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
      onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {/* Sky-blue left border */}
      <div style={{ width: '4px', backgroundColor: '#0ea5e9', flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {/* Avatar with initials */}
        <div style={{
          width: '44px', height: '44px', backgroundColor: 'rgba(14,165,233,0.15)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: '1.5px solid rgba(14,165,233,0.3)',
        }}>
          <span style={{ color: '#38bdf8', fontSize: '16px', fontWeight: '700' }}>{initials}</span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {customer.customerName}
            </span>
            <span style={{ backgroundColor: psCfg.bg, color: psCfg.text, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', flexShrink: 0 }}>
              {psCfg.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Phone size={12} color="#64748b" />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>{customer.contactNumber}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: 'rgba(79,70,229,0.15)', color: '#a5b4fc', fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '6px' }}>
              {SERVICE_LABELS[customer.serviceType] ?? customer.serviceType}
            </span>
            {customer.wonAt && (
              <span style={{ color: '#475569', fontSize: '11px' }}>Won {formatWonDate(customer.wonAt)}</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px' }}>
        <ChevronRight size={18} color="#475569" />
      </div>
    </button>
  );
};
