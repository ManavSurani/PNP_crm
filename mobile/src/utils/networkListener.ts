/**
 * PNP CRM Mobile — Live Network Observer
 * File: mobile/src/utils/networkListener.ts
 *
 * Listens for network status changes (online / offline)
 * and updates the global store in real-time.
 */

import { Network, type ConnectionStatus } from '@capacitor/network';
import { useAppStore } from '../store/appStore';

export async function initNetworkListener(): Promise<() => void> {
  const store = useAppStore.getState();

  try {
    // 1. Initial check
    const status = await Network.getStatus();
    store.setIsOnline(status.connected);

    // 2. Add listener
    const listener = await Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      const currentOnline = useAppStore.getState().isOnline;
      if (currentOnline !== status.connected) {
        store.setIsOnline(status.connected);
        if (status.connected) {
          store.setSyncState('idle');
          store.addToast('📶 Back Online — Ready to sync with CRM', 'success');
        } else {
          store.setSyncState('offline');
          store.addToast('📡 Offline Mode — All changes will queue locally', 'info');
        }
      }
    });

    return () => {
      listener.remove();
    };
  } catch {
    // Browser fallback (use navigator.onLine)
    store.setIsOnline(navigator.onLine);

    const handleOnline = () => {
      useAppStore.getState().setIsOnline(true);
      useAppStore.getState().setSyncState('idle');
      useAppStore.getState().addToast('📶 Back Online — Ready to sync with CRM', 'success');
    };

    const handleOffline = () => {
      useAppStore.getState().setIsOnline(false);
      useAppStore.getState().setSyncState('offline');
      useAppStore.getState().addToast('📡 Offline Mode — All changes will queue locally', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}
