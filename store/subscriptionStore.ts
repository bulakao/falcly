import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCardStore } from '@/store/cardStore';

export type SubscriptionTier = 'free' | 'trial' | 'pro' | 'pro_plus';
export type PlanType = 'pro_monthly' | 'pro_quarterly' | 'pro_annual' | 'pro_plus_monthly' | 'pro_plus_quarterly' | 'pro_plus_annual';

const FREE_CARD_LIMIT = 2;
const TRIAL_DURATION_DAYS = 30;
const DATA_RETENTION_DAYS = 90;

interface SubscriptionStore {
  tier: SubscriptionTier;
  trialEndsAt: number | null;      // timestamp, set when trial starts
  planType: PlanType | null;       // null = free or trial, set on purchase
  proExpiredAt: number | null;     // timestamp when Pro/Pro+ expired (for 90-day data retention)
  startTrial: () => void;
  isTrialActive: () => boolean;
  isPro: () => boolean;
  isProPlus: () => boolean;
  hasAIAccess: () => boolean;
  hasFullCardAccess: () => boolean;
  purchasePlan: (plan: PlanType) => void;
  verifyEntitlement: () => void;
  checkTrialExpiry: () => void;
  canAddCard: (currentCardCount: number) => boolean;
  getTrialEndDate: () => Date | null;
  isCardReadOnly: (cardIndex: number) => boolean;
  daysUntilDataDeletion: () => number | null;
  trialDaysRemaining: () => number | null;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      tier: 'free' as SubscriptionTier,
      trialEndsAt: null,
      planType: null as PlanType | null,
      proExpiredAt: null as number | null,

      startTrial: () => {
        const trialEnd = Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
        set({ tier: 'trial', trialEndsAt: trialEnd, proExpiredAt: null });
      },

      isTrialActive: () => {
        const { tier, trialEndsAt } = get();
        return tier === 'trial' && trialEndsAt !== null && Date.now() < trialEndsAt;
      },

      isPro: () => {
        const { tier } = get();
        return tier === 'pro' || tier === 'pro_plus';
      },

      isProPlus: () => {
        return get().tier === 'pro_plus';
      },

      // AI access: pro_plus only
      hasAIAccess: () => {
        return get().tier === 'pro_plus';
      },

      // Full card access (no 2-card limit): trial, pro, pro_plus
      hasFullCardAccess: () => {
        const { tier } = get();
        return tier === 'trial' || tier === 'pro' || tier === 'pro_plus';
      },

      purchasePlan: (plan: PlanType) => {
        // RevenueCat handles the actual purchase
        // On success, grant the appropriate tier
        const tier: SubscriptionTier = plan.startsWith('pro_plus') ? 'pro_plus' : 'pro';
        set({ tier, planType: plan, trialEndsAt: null, proExpiredAt: null });
      },

      verifyEntitlement: () => {
        // RevenueCat verifies entitlement on app launch
        // For now, trial expiry is handled locally
        get().checkTrialExpiry();
      },

      checkTrialExpiry: () => {
        const { tier, trialEndsAt } = get();
        if (tier === 'trial' && trialEndsAt !== null && Date.now() >= trialEndsAt) {
          // Trial expired → fall back to free
          set({ tier: 'free', trialEndsAt: null, proExpiredAt: Date.now() });
          useCardStore.getState().enforceActiveLimit(FREE_CARD_LIMIT);
        }
      },

      canAddCard: (currentCardCount: number) => {
        return get().hasFullCardAccess() || currentCardCount < FREE_CARD_LIMIT;
      },

      getTrialEndDate: () => {
        const { trialEndsAt } = get();
        return trialEndsAt !== null ? new Date(trialEndsAt) : null;
      },

      isCardReadOnly: (cardIndex: number) => {
        // Cards beyond free limit are read-only on free tier
        return !get().hasFullCardAccess() && cardIndex >= FREE_CARD_LIMIT;
      },

      daysUntilDataDeletion: () => {
        const { tier, proExpiredAt } = get();
        if (tier === 'pro' || tier === 'pro_plus' || proExpiredAt === null) return null;
        const elapsed = Date.now() - proExpiredAt;
        const remaining = DATA_RETENTION_DAYS - Math.floor(elapsed / (24 * 60 * 60 * 1000));
        return Math.max(0, remaining);
      },

      trialDaysRemaining: () => {
        const { tier, trialEndsAt } = get();
        if (tier !== 'trial' || trialEndsAt === null) return null;
        const remaining = Math.ceil((trialEndsAt - Date.now()) / (24 * 60 * 60 * 1000));
        return Math.max(0, remaining);
      },
    }),
    {
      name: 'falcly-subscription',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tier: state.tier,
        trialEndsAt: state.trialEndsAt,
        planType: state.planType,
        proExpiredAt: state.proExpiredAt,
      }),
    },
  ),
);

export { FREE_CARD_LIMIT, TRIAL_DURATION_DAYS, DATA_RETENTION_DAYS };
