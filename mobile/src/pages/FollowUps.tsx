/**
 * PNP CRM Mobile — Follow-Ups Screen
 * File: mobile/src/pages/FollowUps.tsx
 *
 * Desktop CRM parity:
 *  - Shows customer NAME (not phone number)
 *  - Shows attempt count badge
 *  - Shows last note preview
 *  - Filter: All | Today | Overdue | Upcoming
 *  - ZERO dummy data fallbacks
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Phone, Clock, ChevronRight, Users } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { Header } from '../components/Header';
import { FilterChips } from '../components/FilterChips';
import { useAppStore } from '../store/appStore';
import { getAllFollowUps, getFollowUpCountByLead, type LocalFollowUp } from '../db/sqlite';

const FILTER_OPTIONS = [
  { label: 'All',      value: 'ALL' },
  { label: 'Today',    value: 'TODAY' },
  { label: 'Overdue',  value: 'OVERDUE' },
  { label: 'Upcoming', value: 'UPCOMING' },
];

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};
const isOverdue = (dateStr: string) => new Date(dateStr) < new Date() && !isToday(dateStr);

interface FollowUpWithCount extends LocalFollowUp {
  attemptCount?: number;
}

export const FollowUps: React.FC = () => {
  const { navigate, setSelectedLeadId } = useAppStore();
  const [followUps, setFollowUps] = useState<FollowUpWithCount[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('nearest');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getAllFollowUps();
      // Enrich each follow-up with total attempt count for its lead
      const enriched = await Promise.all(
        data.map(async (fu) => {
          const count = fu.leadMobileId
            ? await getFollowUpCountByLead(fu.leadMobileId)
            : 1;
          return { ...fu, attemptCount: count };
        })
      );
      setFollowUps(enriched);
    } catch {
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = followUps.filter((f) => {
    // Filter chip logic
    if (filter === 'TODAY' && !isToday(f.scheduledDate)) return false;
    if (filter === 'OVERDUE' && !isOverdue(f.scheduledDate)) return false;
    if (filter === 'UPCOMING' && !(new Date(f.scheduledDate) > new Date() && !isToday(f.scheduledDate))) return false;

    // Date range logic
    const fd = new Date(f.scheduledDate);
    if (fromDate && fd < new Date(fromDate)) return false;
    if (toDate && fd > new Date(toDate + 'T23:59:59')) return false;

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.scheduledDate).getTime();
    const timeB = new Date(b.scheduledDate).getTime();
    const nameA = (a.customerName || a.leadContactNumber || '').toLowerCase();
    const nameB = (b.customerName || b.leadContactNumber || '').toLowerCase();

    if (sortBy === 'nearest') return timeA - timeB;
    if (sortBy === 'furthest') return timeB - timeA;
    if (sortBy === 'az') return nameA.localeCompare(nameB);
    if (sortBy === 'za') return nameB.localeCompare(nameA);
    return 0;
  });

  const getAccentColor = (f: LocalFollowUp) => {
    if (isOverdue(f.scheduledDate)) return '#ef4444';
    if (isToday(f.scheduledDate))   return '#f59e0b';
    return '#4f46e5';
  };

  const getDateLabel = (f: LocalFollowUp) => {
    if (isOverdue(f.scheduledDate)) return `Overdue · ${new Date(f.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
    if (isToday(f.scheduledDate))   return `Today · ${new Date(f.scheduledDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    return new Date(f.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <MobileLayout>
      <Header />

      <div style={{ padding: '8px 16px 100px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Follow-Ups</h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{followUps.length} follow-up records</p>
        </div>

        {/* Counter Cards */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(245,158,11,0.2)' }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{followUps.filter(f => f.outcome === 'NOT_PICKED').length}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>Unanswered</span>
          </div>
          <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{followUps.filter(f => f.outcome === 'PICKED').length}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>Completed</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <FilterChips options={FILTER_OPTIONS} selected={filter} onChange={setFilter} />
        </div>

        {/* Sort and Date Range */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ backgroundColor: '#1e293b', color: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', outline: 'none', flex: 1, minWidth: '120px' }}
          >
            <option value="nearest">Nearest First</option>
            <option value="furthest">Furthest First</option>
            <option value="az">A-Z (Name)</option>
            <option value="za">Z-A (Name)</option>
          </select>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', outline: 'none', width: '45%', flex: 1 }}
          />
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', outline: 'none', width: '45%', flex: 1 }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
            <div style={{ width: '24px', height: '24px', border: '2.5px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '14px' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#1e293b', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={26} color="#4f46e5" />
            </div>
            <p style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '600', margin: 0 }}>No follow-ups here</p>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Follow-ups will appear here from lead actions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((f) => {
              const accent = getAccentColor(f);
              const dateLabel = getDateLabel(f);
              const displayName = f.customerName || f.leadContactNumber;

              return (
                <button
                  key={f.mobileId}
                  onClick={() => {
                    if (f.leadMobileId) {
                      setSelectedLeadId(f.leadMobileId);
                      navigate('lead-detail');
                    }
                  }}
                  style={{
                    width: '100%', display: 'flex', overflow: 'hidden',
                    backgroundColor: '#1e293b', borderRadius: '14px',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Left accent bar */}
                  <div style={{ width: '4px', backgroundColor: accent, flexShrink: 0 }} />

                  <div style={{ flex: 1, padding: '14px' }}>
                    {/* Row 1: Date + Attempt count */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} color={accent} />
                        <span style={{ color: accent, fontSize: '11px', fontWeight: '700' }}>{dateLabel}</span>
                      </div>
                      {f.attemptCount && f.attemptCount > 0 && (
                        <span style={{ backgroundColor: `${accent}20`, color: accent, fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px' }}>
                          #{f.attemptCount} Attempt{f.attemptCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Customer Name + Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} color="#64748b" />
                        <span style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700' }}>{displayName}</span>
                      </div>
                      <span style={{ backgroundColor: f.outcome === 'PICKED' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)', color: f.outcome === 'PICKED' ? '#10b981' : '#f43f5e', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px', flexShrink: 0, letterSpacing: '0.02em' }}>
                        {f.outcome === 'PICKED' ? 'Picked' : 'Not Picked'}
                      </span>
                    </div>

                    {/* Row 3: Service type */}
                    {f.serviceType && (
                      <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {f.serviceType}
                      </p>
                    )}

                    {/* Row 4: Last note preview */}
                    {f.noteGiven && (
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{f.noteGiven}"
                      </p>
                    )}

                    {/* Row 5: Phone */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${f.leadContactNumber}`; }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', padding: '4px 0', cursor: 'pointer' }}
                    >
                      <Phone size={13} color="#38bdf8" />
                      <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }}>{f.leadContactNumber}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px' }}>
                    <ChevronRight size={18} color="#475569" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
