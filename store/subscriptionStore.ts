import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCardStore } from '@/store/cardStore';
import {
  getCustomerInfo,
  getTierFromCustomerInfo,
  purchasePackage,
  restorePurchases,
  getOfferings,
  addCustomerInfoListener,
  getExpirationDate,
} from '@/utils/revenuecat';
import type { CustomerInfo, PurchasesPackage, PurchasesOffering } from 'react-native-purchases';

export type SubscriptionTier = 'free' | 'pro' | 'pro_plus';

const FREE_CARD_LIMIT = 2;
const DATA_RETENTION_DAYS = 90;

interface SubscriptionStore {
  tier: SubscriptionTier;
  isLoading: boolean;
  error: string | null;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  proExpiredAt: number | null;

  // RevenueCat actions
  initialize: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  reset: () => void;

  // Derived helpers (backward compat for consumers)
  isPro: () => boolean;
  isProPlus: () => boolean;
  hasAIAccess: () => boolean;
  hasFullCardAccess: () => boolean;
  canAddCard: (currentCardCount: number) => boolean;
  isCardReadOnly: (cardIndex: number) => boolean;
  daysUntilDataDeletion: () => number | null;
  getExpirationDate: () => Date | null;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      tier: 'free' as SubscriptionTier,
      isLoading: false,
      error: null,
      offerings: null,
      customerInfo: null,
      proExpiredAt: null as number | null,

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const customerInfo = await getCustomerInfo();
          const tier = getTierFromCustomerInfo(customerInfo);

          // Track when Pro expires for data retention countdown
          const prev = get();
          const proExpiredAt =
            prev.tier !== 'free' && tier === 'free'
              ? Date.now()
              : tier !== 'free'
                ? null
                : prev.proExpiredAt;

          set({ tier, customerInfo, proExpiredAt, isLoading: false });

          if (tier === 'free') {
            useCardStore.getState().enforceActiveLimit(FREE_CARD_LIMIT);
          }

          // Listen for updates (subscription renewed, cancelled, etc.)
          addCustomerInfoListener((info) => {
            const newTier = getTierFromCustomerInfo(info);
            const current = get();
            const newProExpiredAt =
              current.tier !== 'free' && newTier === 'free'
                ? Date.now()
                : newTier !== 'free'
                  ? null
                  : current.proExpiredAt;
            set({ tier: newTier, customerInfo: info, proExpiredAt: newProExpiredAt });
            if (newTier === 'free') {
              useCardStore.getState().enforceActiveLimit(FREE_CARD_LIMIT);
              // Reset overlay prefs to defaults (all on)
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const { useOverlayStore } = require('@/store/overlayStore');
              useOverlayStore.getState().resetOverlayPrefs();
            }
          });
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
        }
      },

      refreshCustomerInfo: async () => {
        try {
          const customerInfo = await getCustomerInfo();
          const tier = getTierFromCustomerInfo(customerInfo);
          set({ tier, customerInfo });
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      loadOfferings: async () => {
        set({ isLoading: true, error: null });
        try {
          const offerings = await getOfferings();
          set({ offerings, isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
        }
      },

      purchase: async (pkg: PurchasesPackage): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const customerInfo = await purchasePackage(pkg);
          const tier = getTierFromCustomerInfo(customerInfo);
          set({ tier, customerInfo, proExpiredAt: null, isLoading: false });
          return true;
        } catch (error: unknown) {
          const err = error as { userCancelled?: boolean; message?: string };
          if (err.userCancelled) {
            set({ isLoading: false });
            return false;
          }
          set({ isLoading: false, error: err.message ?? 'Purchase failed' });
          return false;
        }
      },

      restore: async (): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const customerInfo = await restorePurchases();
          const tier = getTierFromCustomerInfo(customerInfo);
          set({ tier, customerInfo, proExpiredAt: tier !== 'free' ? null : get().proExpiredAt, isLoading: false });
          return tier !== 'free';
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
          return false;
        }
      },

      reset: () => {
        set({ tier: 'free', customerInfo: null, offerings: null, error: null, proExpiredAt: null });
      },

      // Derived helpers
      isPro: () => {
        const { tier } = get();
        return tier === 'pro' || tier === 'pro_plus';
      },

      isProPlus: () => get().tier === 'pro_plus',

      hasAIAccess: () => get().tier === 'pro_plus',

      hasFullCardAccess: () => {
        const { tier } = get();
        return tier === 'pro' || tier === 'pro_plus';
      },

      canAddCard: (currentCardCount: number) => {
        return get().hasFullCardAccess() || currentCardCount < FREE_CARD_LIMIT;
      },

      isCardReadOnly: (cardIndex: number) => {
        return !get().hasFullCardAccess() && cardIndex >= FREE_CARD_LIMIT;
      },

      daysUntilDataDeletion: () => {
        const { tier, proExpiredAt } = get();
        if (tier === 'pro' || tier === 'pro_plus' || proExpiredAt === null) return null;
        const elapsed = Date.now() - proExpiredAt;
        const remaining = DATA_RETENTION_DAYS - Math.floor(elapsed / (24 * 60 * 60 * 1000));
        return Math.max(0, remaining);
      },

      getExpirationDate: () => {
        const { customerInfo } = get();
        if (!customerInfo) return null;
        return getExpirationDate(customerInfo);
      },
    }),
    {
      name: 'falcly-subscription',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tier: state.tier,
        proExpiredAt: state.proExpiredAt,
      }),
    },
  ),
);

export { FREE_CARD_LIMIT, DATA_RETENTION_DAYS };
