/**
 * PNP CRM Mobile — Site Visits Screen (Full Rebuild)
 * File: mobile/src/pages/Visits.tsx
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { Header } from '../components/Header';
import { FilterChips } from '../components/FilterChips';
import { VisitCard } from '../components/VisitCard';
import { useAppStore } from '../store/appStore';
import { getAllVisits, type LocalVisit } from '../db/sqlite';

const FILTER_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Today', value: 'TODAY' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'Completed', value: 'COMPLETED' },
];

const isToday = (dateStr: string) =>
  new Date(dateStr).toDateString() === new Date().toDateString();

const isUpcoming = (dateStr: string) =>
  new Date(dateStr) > new Date() && !isToday(dateStr);

export const Visits: React.FC = () => {
  const { navigate, setSelectedVisitId, notificationCount } = useAppStore();
  const [visits, setVisits] = useState<LocalVisit[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getAllVisits();
      setVisits(data);
    } catch {
      // Browser mode / SQLite unavailable — show empty state, never fake data
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const todayVisits = visits.filter((v) => isToday(v.date) && v.status === 'SCHEDULED');

  const filtered = visits.filter((v) => {
    if (filter === 'TODAY')     return isToday(v.date);
    if (filter === 'UPCOMING')  return isUpcoming(v.date) && v.status === 'SCHEDULED';
    if (filter === 'COMPLETED') return v.status === 'COMPLETED';
    return true;
  });

  const openVisit = (id: string) => {
    setSelectedVisitId(id);
    navigate('visit-detail');
  };

  return (
    <MobileLayout>
      <Header notificationCount={notificationCount} />

      <div style={{ padding: '8px 16px 100px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Site Visits</h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{visits.length} total visits</p>
        </div>

        {/* Counter Cards */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{visits.filter(v => v.status === 'SCHEDULED').length}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>Pending</span>
          </div>
          <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(79,70,229,0.2)' }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#818cf8' }}>{visits.filter(v => v.status === 'COMPLETED').length}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginTop: '4px' }}>Completed</span>
          </div>
        </div>

        {/* Today's summary banner */}
        {todayVisits.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '14px', padding: '14px 16px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={20} color="#10b981" />
            </div>
            <div>
              <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: '700', margin: '0 0 2px' }}>
                {todayVisits.length} visit{todayVisits.length > 1 ? 's' : ''} today
              </p>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Check them below</p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <FilterChips options={FILTER_OPTIONS} selected={filter} onChange={setFilter} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
            <div style={{ width: '24px', height: '24px', border: '2.5px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#1e293b', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={28} color="#10b981" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: '600', margin: '0 0 6px' }}>No visits here</p>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Tap + to schedule a new site visit</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((v) => (
              <VisitCard key={v.mobileId} visit={v} onTap={() => openVisit(v.mobileId)} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('add-visit')}
        style={{
          position: 'fixed', bottom: '90px', right: '20px',
          width: '56px', height: '56px', borderRadius: '9999px',
          backgroundColor: '#10b981', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(16,185,129,0.5)', zIndex: 50,
          WebkitTapHighlightColor: 'transparent',
        }}
        onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)'; }}
        onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        <Plus size={26} color="#ffffff" strokeWidth={2.5} />
      </button>
    </MobileLayout>
  );
};
