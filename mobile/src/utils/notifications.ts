/**
 * PNP CRM Mobile — Local Notification Scheduler
 * File: mobile/src/utils/notifications.ts
 *
 * Wraps @capacitor/local-notifications with safe fallbacks
 * so it works on both native Android devices and in web browsers.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import type { LocalFollowUp, LocalVisit } from '../db/sqlite';

/** Request notification permissions on device */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch {
    // Graceful fallback for browser
    console.log('[Notifications] Web mode — Local Notifications API skipped');
    return false;
  }
}

/** Schedule an alarm for a follow-up call */
export async function scheduleFollowUpNotification(fu: LocalFollowUp): Promise<number | null> {
  try {
    const scheduledTime = new Date(fu.scheduledDate);
    // Only schedule if in the future
    if (scheduledTime <= new Date()) return null;

    const notifId = Math.abs(crc32(fu.mobileId));

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: `📞 Follow-Up Call Due`,
          body: `Call ${fu.leadContactNumber}${fu.noteGiven ? ` — ${fu.noteGiven}` : ''}`,
          schedule: { at: scheduledTime },
          sound: 'beep.wav',
          actionTypeId: 'OPEN_APP',
          extra: { type: 'followup', mobileId: fu.mobileId },
        },
      ],
    });

    console.log(`[Notifications] Scheduled follow-up alarm for ${scheduledTime.toLocaleString('en-IN')}`);
    return notifId;
  } catch (err) {
    console.log('[Notifications] Local notification scheduling skipped (browser preview):', err);
    return null;
  }
}

/** Schedule an alarm for a site visit */
export async function scheduleVisitNotification(visit: LocalVisit): Promise<number | null> {
  try {
    const scheduledTime = new Date(`${visit.date}T${parseTimeTo24h(visit.time)}`);
    if (scheduledTime <= new Date()) return null;

    const notifId = Math.abs(crc32(visit.mobileId));

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: `📍 Site Visit Today`,
          body: `Visit scheduled at ${visit.address} (${visit.time})`,
          schedule: { at: scheduledTime },
          sound: 'beep.wav',
          actionTypeId: 'OPEN_APP',
          extra: { type: 'visit', mobileId: visit.mobileId },
        },
      ],
    });

    console.log(`[Notifications] Scheduled visit alarm for ${scheduledTime.toLocaleString('en-IN')}`);
    return notifId;
  } catch (err) {
    console.log('[Notifications] Local notification scheduling skipped (browser preview):', err);
    return null;
  }
}

// Helper to convert "10:30 AM" or "03:00 PM" to "10:30:00" or "15:00:00"
function parseTimeTo24h(timeStr: string): string {
  try {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '10:00:00';
    let [, hours, mins, modifier] = match;
    let h = parseInt(hours, 10);
    if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
    if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${mins}:00`;
  } catch {
    return '10:00:00';
  }
}

// Simple deterministic hash to get a numeric 32-bit ID for Capacitor notifications
function crc32(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
