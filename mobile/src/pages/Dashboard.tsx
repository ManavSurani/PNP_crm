/**
 * PNP CRM Mobile — Dashboard Page
 * File: mobile/src/pages/Dashboard.tsx
 *
 * Pixel-perfect implementation of the approved V3 Dashboard mockup:
 * - Dark navy background (#0f172a)
 * - 2x2 stat grid with huge bold numbers on dark cards (#1e293b)
 * - 3 solid vibrant Quick Action buttons (Indigo, Emerald, Rose)
 */

import React, { useEffect, useCallback } from 'react';
import {
  UserPlus, Phone, UserCheck, MapPin,
  Plus, RefreshCw, AlertTriangle
} from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { QuickAction } from '../components/QuickAction';
import { useAppStore } from '../store/appStore';
import { getDashboardStats, getPendingFollowUps, getTodayVisits } from '../db/sqlite';
import { syncToServer } from '../../sync/sync-engine';

export const Dashboard: React.FC = () => {
  const {
    stats, setStats,
    syncState, setSyncState,
    setLastSyncTime,
    addToast,
    pendingSyncCount,
    setNotificationCount,
    navigate,
  } = useAppStore();

  // Load stats from local SQLite on mount and after sync
  const loadStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
      const [followUps, visits] = await Promise.all([
        getPendingFollowUps(),
        getTodayVisits(),
      ]);
      const now = new Date();
      const overdue = followUps.filter((f) => new Date(f.scheduledDate) < now);
      const todayScheduledVisits = visits.filter((v) => v.status === 'SCHEDULED');
      setNotificationCount(overdue.length + todayScheduledVisits.length);
    } catch {
      setStats({ totalLeads: 0, followUps: 0, newInquiries: 0, siteVisits: 0, pendingSync: 0 });
      setNotificationCount(0);
    }
  }, [setStats, setNotificationCount]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── Sync Handler ──────────────────────────────────────────────────────────
  const handleSync = async () => {
    if (syncState === 'syncing') return;
    setSyncState('syncing');

    const result = await syncToServer((msg) => console.log('[Sync]', msg));

    if (result.success) {
      setSyncState('success');
      setLastSyncTime(new Date().toLocaleTimeString('en-IN'));
      await loadStats(); // refresh numbers
      const summary = `✅ Synced! ${result.leadsInserted} lead${result.leadsInserted !== 1 ? 's' : ''} added to CRM.`;
      addToast(summary, 'success');
      setTimeout(() => setSyncState('idle'), 3000);
    } else {
      setSyncState('error');
      addToast(result.errorMessage || 'Sync failed. Check your connection.', 'error');
      setTimeout(() => setSyncState('idle'), 4000);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <MobileLayout>
      {/* CSS Keyframes for spinner and animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <Header />

      {/* ── Page Content ── */}
      <div style={{ padding: '8px 16px 24px' }}>

        {/* ── Greeting ── */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500', margin: 0 }}>
            Good {getTimeOfDay()} 👋
          </p>
          <h1 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: '4px 0 0', letterSpacing: '-0.3px' }}>
            Your CRM Overview
          </h1>
        </div>

        {/* ── 2x2 Stat Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          <StatCard
            icon={<UserPlus size={20} color="#ffffff" strokeWidth={2} />}
            iconBgColor="rgba(79,70,229,0.8)"
            number={stats.totalLeads}
            label="Total Leads"
          />
          <StatCard
            icon={<Phone size={20} color="#ffffff" strokeWidth={2} />}
            iconBgColor="rgba(14,165,233,0.8)"
            number={stats.followUps}
            label="Follow-ups"
          />
          <StatCard
            icon={<UserCheck size={20} color="#ffffff" strokeWidth={2} />}
            iconBgColor="rgba(245,158,11,0.8)"
            number={stats.newInquiries}
            label="New Inquiries"
          />
          <StatCard
            icon={<MapPin size={20} color="#ffffff" strokeWidth={2} />}
            iconBgColor="rgba(16,185,129,0.8)"
            number={stats.siteVisits}
            label="Site Visits"
          />
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <h2 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '700', margin: 0 }}>
              Quick Actions
            </h2>
            {pendingSyncCount > 0 && (
              <span
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#000',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  animation: 'pulse 2s infinite',
                }}
              >
                {pendingSyncCount} pending
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <QuickAction
              icon={<Plus size={22} color="#ffffff" strokeWidth={2.5} />}
              label="Add Lead"
              backgroundColor="#4f46e5"
              shadowColor="rgba(79,70,229,0.4)"
              onClick={() => navigate('add-lead')}
            />

            {/* Sync Data — Emerald */}
            <QuickAction
              icon={<RefreshCw size={22} color="#ffffff" strokeWidth={2} />}
              label="Sync Data"
              backgroundColor="#10b981"
              shadowColor="rgba(16,185,129,0.4)"
              onClick={() => navigate('sync-hub')}
              loading={syncState === 'syncing'}
            />

            {/* View Overdue — Rose */}
            <QuickAction
              icon={<AlertTriangle size={22} color="#ffffff" strokeWidth={2} />}
              label="View Overdue"
              backgroundColor="#f43f5e"
              shadowColor="rgba(244,63,94,0.4)"
              onClick={() => navigate('followups')}
            />
          </div>
        </div>

        {/* ── Last Sync Info ── */}
        <SyncStatusBar />
      </div>
    </MobileLayout>
  );
};

// ── Sub Components ─────────────────────────────────────────────────────────

const SyncStatusBar: React.FC = () => {
  const { syncState, lastSyncTime } = useAppStore();

  const stateConfig = {
    idle:    { color: '#64748b', text: lastSyncTime ? `Last synced: ${lastSyncTime}` : 'Not synced yet' },
    syncing: { color: '#f59e0b', text: 'Syncing with CRM server…' },
    success: { color: '#10b981', text: `✓ Synced successfully at ${lastSyncTime}` },
    error:   { color: '#f43f5e', text: '✗ Sync failed — check your connection' },
    offline: { color: '#64748b', text: 'Offline — data saved locally' },
  };

  const cfg = stateConfig[syncState] || stateConfig.idle;

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '12px 16px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: cfg.color,
          flexShrink: 0,
          animation: syncState === 'syncing' ? 'pulse 1s infinite' : 'none',
        }}
      />
      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>
        {cfg.text}
      </span>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
