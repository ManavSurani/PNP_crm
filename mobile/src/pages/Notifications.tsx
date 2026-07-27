/**
 * PNP CRM Mobile — Notifications Screen
 * File: mobile/src/pages/Notifications.tsx
 *
 * Desktop CRM parity:
 *  - Shows customer NAME (not phone number) in all notification titles
 *  - Zero dummy data fallbacks — empty state shown when no notifications
 *  - Counts: overdue follow-ups + today's site visits
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Bell, Clock, MapPin, RefreshCw, ChevronRight } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { useAppStore } from '../store/appStore';
import { getPendingFollowUps, getAllVisits, getPendingLeads, type LocalFollowUp, type LocalVisit } from '../db/sqlite';

interface NotificationItem {
  id: string;
  type: 'OVERDUE_FOLLOWUP' | 'TODAY_VISIT' | 'PENDING_SYNC';
  title: string;
  subtitle: string;
  time: string;
  action: () => void;
}

export const Notifications: React.FC = () => {
  const { goBack, navigate, setNotificationCount, setSelectedLeadId } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const items: NotificationItem[] = [];

      // 1. Overdue follow-ups — show customer NAME
      const followUps = await getPendingFollowUps();
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const overdue = followUps.filter((f) => new Date(f.scheduledDate) < now);

      overdue.forEach((f: LocalFollowUp) => {
        const displayName = f.customerName || f.leadContactNumber;
        items.push({
          id: `notif-fu-${f.mobileId}`,
          type: 'OVERDUE_FOLLOWUP',
          title: `Overdue Follow-Up: ${displayName}`,
          subtitle: `Scheduled for ${new Date(f.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}${f.noteGiven ? ' · ' + f.noteGiven.slice(0, 40) : ''}`,
          time: 'Action needed',
          action: () => {
            setSelectedLeadId(f.leadMobileId);
            navigate('lead-detail');
          },
        });
      });

      // 2. Today's site visits — show customer NAME + address
      const visits = await getAllVisits();
      const todayVisits = visits.filter((v: LocalVisit) => v.date === todayStr && v.status === 'SCHEDULED');

      todayVisits.forEach((v: LocalVisit) => {
        const displayName = v.customerName || 'Unknown Customer';
        items.push({
          id: `notif-v-${v.mobileId}`,
          type: 'TODAY_VISIT',
          title: `Site Visit Today: ${displayName}`,
          subtitle: `At ${v.address} · ${v.time}`,
          time: v.time,
          action: () => {
            setSelectedLeadId(v.leadMobileId);
            navigate('lead-detail');
          },
        });
      });

      // 3. Pending sync items
      const pendingLeads = await getPendingLeads();
      const totalPending = pendingLeads.length + overdue.length;
      if (totalPending > 0) {
        items.push({
          id: 'notif-sync-pending',
          type: 'PENDING_SYNC',
          title: `${totalPending} Pending Item(s) Unsynced`,
          subtitle: 'Tap to open Sync Hub and push changes to CRM server',
          time: 'Pending',
          action: () => navigate('sync-hub'),
        });
      }

      setNotifications(items);
      setNotificationCount(overdue.length + todayVisits.length);
    } catch {
      // On error (browser mode / SQLite unavailable): show empty state, never fake data
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setLoading(false);
    }
  }, [setNotificationCount]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const getItemStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'OVERDUE_FOLLOWUP': return { border: '#f43f5e', bg: 'rgba(244,63,94,0.1)', icon: <Clock size={18} color="#f43f5e" /> };
      case 'TODAY_VISIT':      return { border: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <MapPin size={18} color="#10b981" /> };
      case 'PENDING_SYNC':     return { border: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <RefreshCw size={18} color="#f59e0b" /> };
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
        <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0, flex: 1 }}>Notifications</h1>
      </div>

      <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '24px', height: '24px', border: '2.5px solid #4f46e5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '14px' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#1e293b', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={26} color="#64748b" />
            </div>
            <p style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '600', margin: 0 }}>All caught up!</p>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No active notifications.</p>
          </div>
        ) : (
          notifications.map((item) => {
            const style = getItemStyle(item.type);
            return (
              <button
                key={item.id}
                onClick={item.action}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  backgroundColor: '#1e293b', borderRadius: '14px', padding: '14px',
                  border: `1px solid ${style.border}40`, cursor: 'pointer',
                  textAlign: 'left', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ width: '40px', height: '40px', backgroundColor: style.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {style.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: '700', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight size={18} color="#475569" style={{ flexShrink: 0 }} />
              </button>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
};
