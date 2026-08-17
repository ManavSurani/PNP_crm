/**
 * PNP CRM Mobile — Sync Hub Screen
 * File: mobile/src/pages/SyncHub.tsx
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, WifiOff, Clock, Users, Phone, MapPin } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { ActionButton } from '../components/FormInput';
import { useAppStore } from '../store/appStore';
import { getDashboardStats, getPendingLeads, getPendingFollowUps, getPendingVisits, markLeadsSynced, markFollowUpsSynced, markVisitsSynced, type LocalLead, type LocalFollowUp, type LocalVisit } from '../db/sqlite';
import { CapacitorHttp } from '@capacitor/core';

interface SyncLog {
  id: string;
  timestamp: string;
  result: 'success' | 'error' | 'partial';
  leads: number;
  followUps: number;
  visits: number;
  message: string;
}

const loadSyncLog = (): SyncLog[] => {
  try {
    return JSON.parse(localStorage.getItem('pnp_sync_log') ?? '[]');
  } catch {
    return [];
  }
};

export const SyncHub: React.FC = () => {
  const { goBack, syncState, setSyncState, lastSyncTime, setLastSyncTime, addToast, stats, setStats, setPendingSyncCount } = useAppStore();
  const [pendingLeads, setPendingLeads] = useState(0);
  const [pendingFU, setPendingFU] = useState(0);
  const [pendingVisits, setPendingVisits] = useState(0);
  const [syncLog, setSyncLog] = useState<SyncLog[]>([]);
  const tunnelUrl = localStorage.getItem('pnp_tunnel_url') ?? '';
  const syncSecret = localStorage.getItem('pnp_sync_secret') ?? '';

  const loadPending = useCallback(async () => {
    try {
      const [l, f, v, s] = await Promise.all([
        getPendingLeads(), getPendingFollowUps(), getPendingVisits(), getDashboardStats(),
      ]);
      setPendingLeads(l.length);
      setPendingFU(f.length);
      setPendingVisits(v.length);
      setStats(s);
      setPendingSyncCount(l.length + f.length + v.length);
    } catch {
      setPendingLeads(0); setPendingFU(0); setPendingVisits(0);
    }
    setSyncLog(loadSyncLog());
  }, [setStats, setPendingSyncCount]);

  useEffect(() => { loadPending(); }, [loadPending]);

  const totalPending = pendingLeads + pendingFU + pendingVisits;

  const handleSync = async () => {
    if (syncState === 'syncing' || !tunnelUrl) {
      if (!tunnelUrl) addToast('No tunnel URL configured. Go to Settings first.', 'error');
      return;
    }
    if (!syncSecret) {
      addToast('No Sync Secret Key configured. Go to Settings first.', 'error');
      return;
    }
    setSyncState('syncing');

    try {
      const [leads, fus, visits] = await Promise.all([getPendingLeads(), getPendingFollowUps(), getPendingVisits()]);

      const cleanUrl = tunnelUrl.trim().replace(/\/+$/, '');
      const res = await CapacitorHttp.post({
        url: `${cleanUrl}/api/mobile/sync`,
        headers: {
          'Content-Type': 'application/json',
          'x-mobile-sync-key': syncSecret.trim(),
          'ngrok-skip-browser-warning': 'true',
        },
        data: { leads, followUps: fus, visits },
        connectTimeout: 15000,
        readTimeout: 15000,
      });

      if (res.status >= 400) {
        throw new Error(`HTTP ${res.status}: ${res.data?.error || 'Sync rejected by server'}`);
      }

      // Mark records as SYNCED so they are not re-sent next time
      await Promise.all([
        markLeadsSynced(leads.map((l: LocalLead) => l.mobileId)),
        markFollowUpsSynced(fus.map((f: LocalFollowUp) => f.mobileId)),
        markVisitsSynced(visits.map((v: LocalVisit) => v.mobileId)),
      ]);

      const logEntry: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        result: 'success',
        leads: leads.length,
        followUps: fus.length,
        visits: visits.length,
        message: `Synced ${leads.length} leads, ${fus.length} follow-ups, ${visits.length} visits.`,
      };

      const newLog = [logEntry, ...loadSyncLog()].slice(0, 10);
      localStorage.setItem('pnp_sync_log', JSON.stringify(newLog));
      setSyncLog(newLog);

      setSyncState('success');
      setLastSyncTime(new Date().toISOString());
      addToast(`✅ Sync complete! ${leads.length + fus.length + visits.length} items pushed to CRM.`, 'success');

      await loadPending();
    } catch (err: any) {
      setSyncState('error');
      const logEntry: SyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        result: 'error',
        leads: 0, followUps: 0, visits: 0,
        message: err?.message ?? 'Unknown error',
      };
      const newLog = [logEntry, ...loadSyncLog()].slice(0, 10);
      localStorage.setItem('pnp_sync_log', JSON.stringify(newLog));
      setSyncLog(newLog);
      addToast('Sync failed. Check your internet & tunnel URL.', 'error');
    }
  };

  const statusBannerConfig = {
    idle:    { bg: 'rgba(71,85,105,0.2)', border: 'rgba(71,85,105,0.3)', icon: <Clock size={22} color="#94a3b8" />, title: 'Ready to Sync', color: '#94a3b8' },
    syncing: { bg: 'rgba(79,70,229,0.15)', border: 'rgba(79,70,229,0.3)', icon: <RefreshCw size={22} color="#818cf8" style={{ animation: 'spin 0.8s linear infinite' }} />, title: 'Syncing…', color: '#818cf8' },
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: <CheckCircle size={22} color="#34d399" />, title: 'All Synced!', color: '#34d399' },
    error:   { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)', icon: <XCircle size={22} color="#f87171" />, title: 'Sync Failed', color: '#f87171' },
    offline: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: <WifiOff size={22} color="#fbbf24" />, title: 'Offline', color: '#fbbf24' },
  };
  const banner = statusBannerConfig[syncState];

  return (
    <MobileLayout hideBottomNav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={22} color="#94a3b8" />
        </button>
        <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0 }}>Sync Hub</h1>
      </div>

      <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Status Banner */}
        <div style={{ backgroundColor: banner.bg, border: `1px solid ${banner.border}`, borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {banner.icon}
          <div>
            <p style={{ color: banner.color, fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>{banner.title}</p>
            {lastSyncTime && (
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                Last sync: {new Date(lastSyncTime).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })}
              </p>
            )}
            {!lastSyncTime && <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Never synced</p>}
          </div>
        </div>

        {/* Pending counts */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            Pending Items ({totalPending})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <PendingRow icon={<Users size={16} color="#818cf8" />} label="Leads" count={pendingLeads} color="#818cf8" />
            <PendingRow icon={<Phone size={16} color="#38bdf8" />} label="Follow-ups" count={pendingFU} color="#38bdf8" />
            <PendingRow icon={<MapPin size={16} color="#34d399" />} label="Site Visits" count={pendingVisits} color="#34d399" />
          </div>
        </div>

        {/* Tunnel URL */}
        {!tunnelUrl && (
          <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>⚠ No Tunnel URL configured</p>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Go to Settings to set your Cloudflare tunnel URL before syncing.</p>
          </div>
        )}

        <ActionButton
          label={syncState === 'syncing' ? 'Syncing…' : `Sync Now (${totalPending} items)`}
          onClick={handleSync}
          color="indigo"
          icon={<RefreshCw size={18} color="#fff" />}
          disabled={syncState === 'syncing' || totalPending === 0}
        />

        {/* Sync Log */}
        {syncLog.length > 0 && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>Recent Sync Log</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {syncLog.map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '1px solid #0f172a' }}>
                  <div>
                    <span style={{ color: log.result === 'success' ? '#34d399' : '#f87171', fontSize: '12px', fontWeight: '700' }}>
                      {log.result === 'success' ? '✓ ' : '✗ '}{log.message}
                    </span>
                  </div>
                  <span style={{ color: '#475569', fontSize: '11px', flexShrink: 0, marginLeft: '8px' }}>
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

const PendingRow: React.FC<{ icon: React.ReactNode; label: string; count: number; color: string }> = ({ icon, label, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '32px', height: '32px', backgroundColor: `${color}18`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>{label}</span>
    </div>
    <span style={{ color: count > 0 ? color : '#475569', fontSize: '16px', fontWeight: '700' }}>
      {count}
    </span>
  </div>
);
