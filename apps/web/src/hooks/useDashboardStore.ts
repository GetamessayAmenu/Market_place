/**
 * Zustand store for seller dashboard client-side state.
 * Only non-sensitive data is persisted to localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Lang } from '../lib/i18n';

interface SnoozedAction {
  id: string;
  until: number; // Unix ms timestamp
}

interface DashboardState {
  // ── Language ──────────────────────────────────────────────────────────────
  language: Lang;
  setLanguage: (lang: Lang) => void;

  // ── Dismissed items ────────────────────────────────────────────────────────
  dismissedAlerts: string[];
  dismissedRecommendations: string[];
  dismissedSeasonalSuggestions: string[];
  dismissAlert: (id: string) => void;
  dismissRecommendation: (id: string) => void;
  dismissSeasonalSuggestion: (id: string) => void;
  dismissOptionalSection: (section: 'rentals' | 'custom_orders') => void;
  hiddenSections: string[];

  // ── Snoozed actions ────────────────────────────────────────────────────────
  snoozedActions: SnoozedAction[];
  snoozeAction: (id: string, hours: number) => void;
  clearExpiredSnoozes: () => void;

  // ── Pinned quick actions ───────────────────────────────────────────────────
  pinnedQuickActions: string[];
  setPinnedQuickActions: (actions: string[]) => void;

  // ── Low stock threshold ────────────────────────────────────────────────────
  lowStockThreshold: number;
  setLowStockThreshold: (n: number) => void;

  // ── Notifications badge ───────────────────────────────────────────────────
  unreadNotifCount: number;
  setUnreadNotifCount: (n: number) => void;

  // ── Revenue chart range ────────────────────────────────────────────────────
  chartRange: '7d' | '30d' | '90d' | '1y';
  setChartRange: (range: '7d' | '30d' | '90d' | '1y') => void;

  // ── Message filter ─────────────────────────────────────────────────────────
  messageFilter: 'all' | 'inquiry' | 'order' | 'rental' | 'custom';
  setMessageFilter: (f: 'all' | 'inquiry' | 'order' | 'rental' | 'custom') => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      // Language
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      // Dismissed
      dismissedAlerts: [],
      dismissedRecommendations: [],
      dismissedSeasonalSuggestions: [],
      hiddenSections: [],
      dismissAlert: (id) =>
        set((s) => ({ dismissedAlerts: [...s.dismissedAlerts, id] })),
      dismissRecommendation: (id) =>
        set((s) => ({ dismissedRecommendations: [...s.dismissedRecommendations, id] })),
      dismissSeasonalSuggestion: (id) =>
        set((s) => ({ dismissedSeasonalSuggestions: [...s.dismissedSeasonalSuggestions, id] })),
      dismissOptionalSection: (section) =>
        set((s) => ({ hiddenSections: [...s.hiddenSections, section] })),

      // Snooze
      snoozedActions: [],
      snoozeAction: (id, hours) => {
        const until = Date.now() + hours * 3600000;
        set((s) => ({
          snoozedActions: [
            ...s.snoozedActions.filter((a) => a.id !== id),
            { id, until },
          ],
        }));
      },
      clearExpiredSnoozes: () => {
        const now = Date.now();
        set((s) => ({
          snoozedActions: s.snoozedActions.filter((a) => a.until > now),
        }));
      },

      // Pinned quick actions
      pinnedQuickActions: ['view_orders', 'view_analytics', 'seller_settings', 'view_reviews'],
      setPinnedQuickActions: (actions) => set({ pinnedQuickActions: actions }),

      // Low stock threshold
      lowStockThreshold: 5,
      setLowStockThreshold: (n) => set({ lowStockThreshold: n }),

      // Notifications
      unreadNotifCount: 0,
      setUnreadNotifCount: (n) => set({ unreadNotifCount: n }),

      // Chart
      chartRange: '30d',
      setChartRange: (range) => set({ chartRange: range }),

      // Messages
      messageFilter: 'all',
      setMessageFilter: (f) => set({ messageFilter: f }),
    }),
    {
      name: 'seller-dashboard-prefs', // localStorage key
      // Only persist non-sensitive user preferences
      partialize: (state) => ({
        language: state.language,
        dismissedAlerts: state.dismissedAlerts,
        dismissedRecommendations: state.dismissedRecommendations,
        dismissedSeasonalSuggestions: state.dismissedSeasonalSuggestions,
        hiddenSections: state.hiddenSections,
        pinnedQuickActions: state.pinnedQuickActions,
        lowStockThreshold: state.lowStockThreshold,
        chartRange: state.chartRange,
      }),
    }
  )
);
