/**
 * PNP CRM Mobile — LeadCard Component
 * File: mobile/src/components/LeadCard.tsx
 */

import React from 'react';
import { Phone, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import type { LocalLead } from '../db/sqlite';

interface LeadCardProps {
  lead: LocalLead;
  onTap: () => void;
  onAction?: (action: 'edit' | 'archive' | 'delete', e: React.MouseEvent) => void;
}

const STATUS_CONFIG: Record<string, { borderColor: string; chipBg: string; chipText: string; label: string }> = {
  NEW_INQUIRY:       { borderColor: '#f59e0b', chipBg: '#fffbeb', chipText: '#92400e', label: 'New Inquiry' },
  FOLLOW_UP:         { borderColor: '#0ea5e9', chipBg: '#f0f9ff', chipText: '#0c4a6e', label: 'Follow-up' },
  MEETING_SCHEDULED: { borderColor: '#4f46e5', chipBg: '#eef2ff', chipText: '#312e81', label: 'Visit Booked' },
  WON_ORDER:         { borderColor: '#10b981', chipBg: '#ecfdf5', chipText: '#064e3b', label: 'Won' },
  CANCELLED:         { borderColor: '#ef4444', chipBg: '#fff1f2', chipText: '#881337', label: 'Cancelled' },
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onTap, onAction }) => {
  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG['NEW_INQUIRY'];
  const isSynced = lead.syncStatus === 'SYNCED';

  return (
    <button
      onClick={onTap}
      style={{
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: '14px',
        padding: '0',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.1s ease, opacity 0.1s ease',
      }}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
      onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {/* Colored left border */}
      <div style={{ width: '4px', backgroundColor: cfg.borderColor, flexShrink: 0 }} />

      {/* Card content */}
      <div style={{ flex: 1, padding: '14px 14px 14px 14px', minWidth: 0 }}>
        {/* Top row: name + status chip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <span style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lead.customerName}
          </span>
          <span style={{ backgroundColor: cfg.chipBg, color: cfg.chipText, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', flexShrink: 0, letterSpacing: '0.03em' }}>
            {cfg.label}
          </span>
        </div>

        {/* Phone row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Phone size={13} color="#64748b" strokeWidth={2} />
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>{lead.contactNumber}</span>
        </div>

        {/* Bottom row: service badge + sync indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ backgroundColor: 'rgba(79,70,229,0.15)', color: '#a5b4fc', fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px' }}>
            {lead.serviceType}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isSynced
              ? <Wifi size={12} color="#10b981" />
              : <WifiOff size={12} color="#f59e0b" />
            }
            <span style={{ fontSize: '10px', color: isSynced ? '#10b981' : '#f59e0b', fontWeight: '500' }}>
              {isSynced ? 'Synced' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Right chevron or Menu */}
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px' }}>
        {onAction ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onAction('edit', e); }}
            style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ width: '4px', height: '4px', backgroundColor: '#94a3b8', borderRadius: '50%', margin: '2px 0', boxShadow: '0 6px 0 #94a3b8, 0 -6px 0 #94a3b8' }} />
          </button>
        ) : (
          <ChevronRight size={18} color="#475569" />
        )}
      </div>
    </button>
  );
};
