/**
 * PNP CRM Mobile — App-wide State Store
 * File: mobile/src/store/appStore.ts
 *
 * Uses Zustand for lightweight global state management.
 * Tracks sync status, dashboard stats, navigation, and active navigation.
 */

import { create } from 'zustand';
import type { DashboardStats } from '../db/sqlite';

// ── Types ───────────────────────────────────────────────────────────────────

export type ActiveTab = 'home' | 'leads' | 'followups' | 'visits' | 'customers';

export type Screen =
  | 'dashboard'
  | 'leads'
  | 'add-lead'
  | 'lead-detail'
  | 'add-followup'
  | 'followups'
  | 'visits'
  | 'add-visit'
  | 'visit-detail'
  | 'customers'
  | 'customer-detail'
  | 'sync-hub'
  | 'settings'
  | 'notifications';

export type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  // ── Navigation ──
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  currentScreen: Screen;
  screenHistory: Screen[];
  navigate: (screen: Screen) => void;
  goBack: () => void;

  // Selected IDs for detail screens
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;

  selectedVisitId: string | null;
  setSelectedVisitId: (id: string | null) => void;

  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;

  // Notification badge count (overdue follow-ups + today's visits)
  notificationCount: number;
  setNotificationCount: (n: number) => void;

  // Network online/offline status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // ── Dashboard Stats ──
  stats: DashboardStats;
  setStats: (stats: DashboardStats) => void;

  // ── Sync Engine State ──
  syncState: SyncState;
  setSyncState: (state: SyncState) => void;
  lastSyncTime: string | null;
  setLastSyncTime: (time: string) => void;

  // ── Toast Notifications ──
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Pending sync count badge on "Sync Data" button
  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ── Navigation ──
  activeTab: 'home',
  setActiveTab: (tab) => {
    const screenMap: Record<ActiveTab, Screen> = {
      home: 'dashboard',
      leads: 'leads',
      followups: 'followups',
      visits: 'visits',
      customers: 'customers',
    };
    set({ activeTab: tab, currentScreen: screenMap[tab], screenHistory: [] });
  },

  currentScreen: 'dashboard',
  screenHistory: [],

  navigate: (screen) => {
    const current = get().currentScreen;
    set((state) => ({
      currentScreen: screen,
      screenHistory: [...state.screenHistory, current],
    }));
  },

  goBack: () => {
    const history = get().screenHistory;
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set((state) => ({
      currentScreen: prev,
      screenHistory: state.screenHistory.slice(0, -1),
    }));
  },

  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),

  selectedVisitId: null,
  setSelectedVisitId: (id) => set({ selectedVisitId: id }),

  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),

  notificationCount: 0,
  setNotificationCount: (notificationCount) => set({ notificationCount }),

  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),

  // ── Dashboard Stats ──
  stats: { totalLeads: 0, followUps: 0, newInquiries: 0, siteVisits: 0, pendingSync: 0 },
  setStats: (stats) => set({ stats }),

  // ── Sync State ──
  syncState: 'idle',
  setSyncState: (syncState) => set({ syncState }),
  lastSyncTime: null,
  setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),

  // ── Toasts ──
  toasts: [],
  addToast: (message, type) => {
    const id = `toast-${Date.now()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // ── Pending Sync Count ──
  pendingSyncCount: 0,
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
}));

