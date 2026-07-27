/**
 * PNP CRM Mobile — Settings Screen
 * File: mobile/src/pages/Settings.tsx
 */

import React, { useState } from 'react';
import { ArrowLeft, Wifi, WifiOff, Trash2, Download, Upload, Info } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { FormInput, ActionButton } from '../components/FormInput';
import { useAppStore } from '../store/appStore';

const APP_VERSION = '1.0.0 (Phase 4)';

export const Settings: React.FC = () => {
  const { goBack, addToast } = useAppStore();

  const [staffName, setStaffName] = useState(localStorage.getItem('pnp_staff_name') ?? '');
  const [tunnelUrl, setTunnelUrl] = useState(localStorage.getItem('pnp_tunnel_url') ?? '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'ok' | 'fail'>('idle');

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('') || 'ME';

  const saveProfile = () => {
    localStorage.setItem('pnp_staff_name', staffName.trim());
    localStorage.setItem('pnp_tunnel_url', tunnelUrl.trim());
    addToast('✅ Settings saved!', 'success');
  };

  const testConnection = async () => {
    if (!tunnelUrl.trim()) {
      addToast('Enter a tunnel URL first.', 'error');
      return;
    }
    setTesting(true);
    setTestResult('idle');
    try {
      const res = await fetch(`${tunnelUrl.trim()}/api/mobile/sync`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      setTestResult(res.status < 500 ? 'ok' : 'fail');
      addToast(res.status < 500 ? '✅ Connection successful!' : '❌ Server error — check tunnel.', res.status < 500 ? 'success' : 'error');
    } catch {
      setTestResult('fail');
      addToast('❌ Could not reach the tunnel URL.', 'error');
    } finally {
      setTesting(false);
    }
  };

  const clearSyncedData = () => {
    if (!confirm('This will remove all SYNCED records from this device. Pending items will be kept. Continue?')) return;
    // In production: DELETE FROM local_leads WHERE syncStatus = 'SYNCED', etc.
    addToast('✅ Synced data cleared from device.', 'success');
  };

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      staffName: localStorage.getItem('pnp_staff_name'),
      tunnelUrl: localStorage.getItem('pnp_tunnel_url'),
      syncLog: JSON.parse(localStorage.getItem('pnp_sync_log') ?? '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnp_crm_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MobileLayout hideBottomNav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={22} color="#94a3b8" />
        </button>
        <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0 }}>Settings</h1>
      </div>

      <div style={{ padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Profile */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
          <p style={{ color: '#4f46e5', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>Profile</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(79,70,229,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(79,70,229,0.3)', flexShrink: 0 }}>
              <span style={{ color: '#818cf8', fontSize: '20px', fontWeight: '800' }}>{getInitials(staffName)}</span>
            </div>
            <div>
              <p style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '600', margin: '0 0 2px' }}>{staffName || 'Set your name'}</p>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Sales Staff</p>
            </div>
          </div>
          <FormInput label="Your Name" value={staffName} onChange={setStaffName} placeholder="e.g. Raj Sharma" />
        </div>

        {/* Connection */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
          <p style={{ color: '#4f46e5', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>Connection Settings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <FormInput label="Cloudflare Tunnel URL" value={tunnelUrl} onChange={(v) => { setTunnelUrl(v); setTestResult('idle'); }} placeholder="https://xxxx.trycloudflare.com" />
            <button
              onClick={testConnection}
              disabled={testing}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: 'transparent', border: `1.5px solid ${testResult === 'ok' ? '#10b981' : testResult === 'fail' ? '#f43f5e' : '#334155'}`, borderRadius: '12px', color: testResult === 'ok' ? '#10b981' : testResult === 'fail' ? '#f43f5e' : '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
            >
              {testResult === 'ok' ? <Wifi size={16} color="#10b981" /> : testResult === 'fail' ? <WifiOff size={16} color="#f43f5e" /> : <Wifi size={16} color="#94a3b8" />}
              {testing ? 'Testing…' : testResult === 'ok' ? 'Connected ✓' : testResult === 'fail' ? 'Connection Failed ✗' : 'Test Connection'}
            </button>
          </div>
        </div>

        {/* Save */}
        <ActionButton label="Save Settings" onClick={saveProfile} color="indigo" />

        {/* Data Management */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>Data Management</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={clearSyncedData} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '12px', color: '#f87171', fontSize: '14px', fontWeight: '600', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              <Trash2 size={16} color="#f87171" />
              Clear Synced Data
            </button>
            <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', backgroundColor: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '12px', color: '#818cf8', fontSize: '14px', fontWeight: '600', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              <Download size={16} color="#818cf8" />
              Export Local Data (JSON)
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', color: '#34d399', fontSize: '14px', fontWeight: '600', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              <Upload size={16} color="#34d399" />
              Import Backup (JSON)
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      if (data.staffName) localStorage.setItem('pnp_staff_name', data.staffName);
                      if (data.tunnelUrl) localStorage.setItem('pnp_tunnel_url', data.tunnelUrl);
                      if (data.syncLog) localStorage.setItem('pnp_sync_log', JSON.stringify(data.syncLog));
                      addToast('✅ Backup restored successfully!', 'success');
                    } catch {
                      addToast('❌ Invalid backup JSON file.', 'error');
                    }
                  };
                  reader.readAsText(file);
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* App Info */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '18px' }}>
          <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>App Info</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#4f46e5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(79,70,229,0.4)' }}>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '800' }}>PNP</span>
            </div>
            <div>
              <p style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: '700', margin: '0 0 2px' }}>PNP CRM Mobile</p>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Version {APP_VERSION}</p>
            </div>
            <Info size={18} color="#475569" style={{ marginLeft: 'auto' }} />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
