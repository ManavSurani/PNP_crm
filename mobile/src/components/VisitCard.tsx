/**
 * PNP CRM Mobile — VisitCard Component
 * File: mobile/src/components/VisitCard.tsx
 */

import React from 'react';
import { MapPin, Calendar, Clock, FileText, Wifi, WifiOff, ChevronRight } from 'lucide-react';
import type { LocalVisit } from '../db/sqlite';

interface VisitCardProps {
  visit: LocalVisit;
  onTap: () => void;
}

const STATUS_CONFIG: Record<string, { borderColor: string; chipBg: string; chipText: string; label: string }> = {
  SCHEDULED:  { borderColor: '#10b981', chipBg: '#ecfdf5', chipText: '#064e3b', label: 'Scheduled' },
  COMPLETED:  { borderColor: '#4f46e5', chipBg: '#eef2ff', chipText: '#312e81', label: 'Completed ✓' },
  CANCELLED:  { borderColor: '#f43f5e', chipBg: '#fff1f2', chipText: '#881337', label: 'Cancelled' },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const VisitCard: React.FC<VisitCardProps> = ({ visit, onTap }) => {
  const cfg = STATUS_CONFIG[visit.status] ?? STATUS_CONFIG['SCHEDULED'];
  const isSynced = visit.syncStatus === 'SYNCED';
  const isOverdue = visit.status === 'SCHEDULED' && new Date(visit.date) < new Date() && new Date(visit.date).toDateString() !== new Date().toDateString();

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
      <div style={{ width: '4px', backgroundColor: isOverdue ? '#e11d48' : cfg.borderColor, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '14px', minWidth: 0 }}>
        {/* Top row: address + status chip */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
          <div 
            onClick={(e) => { e.stopPropagation(); window.open(`https://maps.google.com/?q=${encodeURIComponent(visit.address)}`, '_blank'); }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', flex: 1, minWidth: 0, cursor: 'pointer' }}
          >
            <MapPin size={14} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: '700', lineHeight: '1.3', textDecoration: 'underline', textDecorationColor: 'rgba(16,185,129,0.5)' }}>
              {visit.address}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
            {isOverdue && (
              <span style={{ backgroundColor: '#fff1f2', color: '#e11d48', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', flexShrink: 0, letterSpacing: '0.02em' }}>
                Missed Visit
              </span>
            )}
            <span style={{ backgroundColor: cfg.chipBg, color: cfg.chipText, fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', flexShrink: 0, letterSpacing: '0.02em' }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Date + Time row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} color="#64748b" />
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{formatDate(visit.date)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} color="#64748b" />
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{visit.time}</span>
          </div>
        </div>

        {/* Notes row */}
        {visit.notes && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
            <FileText size={12} color="#64748b" />
            <span style={{ color: '#64748b', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{visit.notes}</span>
          </div>
        )}

        {/* Sync badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isSynced ? <Wifi size={11} color="#10b981" /> : <WifiOff size={11} color="#f59e0b" />}
          <span style={{ fontSize: '10px', color: isSynced ? '#10b981' : '#f59e0b', fontWeight: '500' }}>
            {isSynced ? 'Synced' : 'Pending sync'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px' }}>
        <ChevronRight size={18} color="#475569" />
      </div>
    </button>
  );
};
