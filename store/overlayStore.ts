import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardOverlayItem } from '@/types/overlay';

export interface OverlayPrefs {
  enabled: boolean;
  alerts: boolean;
  statements: boolean;
  tips: boolean;
  promos: boolean;
  affiliates: boolean;
  frequencyDays: number;
}

const DEFAULT_OVERLAY_PREFS: OverlayPrefs = {
  enabled: true,
  alerts: true,
  statements: true,
  tips: true,
  promos: true,
  affiliates: true,
  frequencyDays: 1,
};

interface OverlayState {
  queue: CardOverlayItem[];
  dismissedIds: string[];
  lastShownAt: number | null;
  overlayPrefs: OverlayPrefs;

  enqueue: (item: CardOverlayItem) => void;
  dismiss: (id: string) => void;
  getNextOverlay: (cardId?: string) => CardOverlayItem | null;
  clearQueue: () => void;
  resetDismissed: () => void;
  shouldShowOverlay: () => boolean;
  setOverlayPrefs: (prefs: Partial<OverlayPrefs>) => void;
  resetOverlayPrefs: () => void;
}

export const useOverlayStore = create<OverlayState>()(
  persist(
    (set, get) => ({
      queue: [],
      dismissedIds: [],
      lastShownAt: null,
      overlayPrefs: { ...DEFAULT_OVERLAY_PREFS },

      enqueue: (item: CardOverlayItem) => {
        const { queue, dismissedIds } = get();
        // Skip if already in queue or dismissed
        if (queue.some((q) => q.id === item.id)) return;
        if (dismissedIds.includes(item.id)) return;
        // Also deduplicate by wikiId+cardId to avoid re-queuing same wiki for same card
        if (
          item.wikiId &&
          dismissedIds.some((id) => id.startsWith(`wiki-${item.wikiId}-${item.cardId || 'portfolio'}`))
        ) return;

        const updated = [...queue, item].sort((a, b) => a.priority - b.priority);
        set({ queue: updated });
      },

      dismiss: (id: string) => {
        const { queue, dismissedIds } = get();
        set({
          queue: queue.filter((q) => q.id !== id),
          dismissedIds: [...dismissedIds, id],
          lastShownAt: Date.now(),
        });
      },

      getNextOverlay: (cardId?: string) => {
        const { queue, overlayPrefs } = get();
        if (!overlayPrefs.enabled) return null;

        const typeEnabled = (item: CardOverlayItem): boolean => {
          switch (item.type) {
            case 'alert': return overlayPrefs.alerts;
            case 'statement': return overlayPrefs.statements;
            case 'tip': return overlayPrefs.tips;
            case 'wiki': return overlayPrefs.tips; // wiki falls under tips toggle
            case 'promo': return overlayPrefs.promos;
            case 'affiliate': return overlayPrefs.affiliates;
            default: return true;
          }
        };

        const filtered = queue.filter((item) => {
          if (!typeEnabled(item)) return false;
          if (cardId !== undefined) return item.cardId === cardId;
          return !item.cardId; // portfolio-level
        });

        return filtered[0] ?? null;
      },

      clearQueue: () => set({ queue: [] }),

      resetDismissed: () => set({ dismissedIds: [], queue: [] }),

      shouldShowOverlay: () => {
        const { lastShownAt, overlayPrefs } = get();
        if (!overlayPrefs.enabled) return false;
        if (lastShownAt === null) return true;
        const elapsed = Date.now() - lastShownAt;
        const intervalMs = overlayPrefs.frequencyDays * 24 * 60 * 60 * 1000;
        return elapsed >= intervalMs;
      },

      setOverlayPrefs: (prefs: Partial<OverlayPrefs>) => {
        const { overlayPrefs } = get();
        set({ overlayPrefs: { ...overlayPrefs, ...prefs } });
      },

      resetOverlayPrefs: () => {
        set({ overlayPrefs: { ...DEFAULT_OVERLAY_PREFS } });
      },
    }),
    {
      name: 'falcly-overlays',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dismissedIds: state.dismissedIds,
        lastShownAt: state.lastShownAt,
        overlayPrefs: state.overlayPrefs,
      }),
    },
  ),
);

export { DEFAULT_OVERLAY_PREFS };
