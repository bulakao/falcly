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

interface SubscriptionStore {
  tier: SubscriptionTier;
  isLoading: boolean;
  error: string | null;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  // RevenueCat actions
  initialize: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  reset: () => void;

  // Derived helpers
  isPro: () => boolean;
  isProPlus: () => boolean;
  hasAIAccess: () => boolean;
  hasFullCardAccess: () => boolean;
  canAddCard: (currentCardCount: number) => boolean;
  isCardReadOnly: (cardIndex: number) => boolean;
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

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const customerInfo = await getCustomerInfo();
          const tier = getTierFromCustomerInfo(customerInfo);

          set({ tier, customerInfo, isLoading: false });

          if (tier === 'free') {
            useCardStore.getState().enforceActiveLimit(FREE_CARD_LIMIT);
          }

          // Listen for updates (subscription renewed, cancelled, etc.)
          addCustomerInfoListener((info) => {
            const newTier = getTierFromCustomerInfo(info);
            set({ tier: newTier, customerInfo: info });
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
          set({ tier, customerInfo, isLoading: false });
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
          set({ tier, customerInfo, isLoading: false });
          return tier !== 'free';
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
          return false;
        }
      },

      reset: () => {
        set({ tier: 'free', customerInfo: null, offerings: null, error: null });
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
      }),
    },
  ),
);

export { FREE_CARD_LIMIT };
