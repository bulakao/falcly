import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCardStore } from '@/store/cardStore';

export type SubscriptionTier = 'free' | 'pro';
export type PlanType = 'annual' | 'monthly';

const FREE_CARD_LIMIT = 2;
const TRIAL_DURATION_DAYS = 14;
const DATA_RETENTION_DAYS = 90;

interface SubscriptionStore {
  tier: SubscriptionTier;
  trialEndsAt: number | null; // timestamp, set when trial starts
  planType: PlanType | null; // null = trial or free, set on purchase
  proExpiredAt: number | null; // timestamp when Pro expired (for 90-day data retention)
  startTrial: () => void;
  isTrialActive: () => boolean;
  isPaidPro: () => boolean;
  purchasePro: (plan: PlanType) => void;
  verifyEntitlement: () => void;
  checkTrialExpiry: () => void;
  canAddCard: (currentCardCount: number) => boolean;
  getTrialEndDate: () => Date | null;
  isCardReadOnly: (cardIndex: number) => boolean;
  daysUntilDataDeletion: () => number | null;
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
        set({ tier: 'pro', trialEndsAt: trialEnd, proExpiredAt: null });
      },
      isTrialActive: () => {
        const { tier, trialEndsAt, planType } = get();
        return tier === 'pro' && trialEndsAt !== null && planType === null && Date.now() < trialEndsAt;
      },
      isPaidPro: () => {
        const { tier, planType } = get();
        return tier === 'pro' && planType !== null;
      },
      purchasePro: (plan: PlanType) => {
        // RevenueCat would handle the actual purchase here
        // On success, grant 'pro' entitlement and record plan type
        set({ tier: 'pro', planType: plan, trialEndsAt: null, proExpiredAt: null });
      },
      verifyEntitlement: () => {
        // RevenueCat would verify the entitlement on app launch
        // For now, if paid pro, entitlement is always valid (persisted)
        // Trial expiry is handled by checkTrialExpiry()
        get().checkTrialExpiry();
      },
      checkTrialExpiry: () => {
        const { tier, trialEndsAt, planType } = get();
        // Only expire trial users (not paid subscribers)
        if (tier === 'pro' && planType === null && trialEndsAt !== null && Date.now() >= trialEndsAt) {
          set({ tier: 'free', proExpiredAt: Date.now() });
          useCardStore.getState().enforceActiveLimit(FREE_CARD_LIMIT);
        }
      },
      canAddCard: (currentCardCount: number) => {
        return get().tier === 'pro' || currentCardCount < FREE_CARD_LIMIT;
      },
      getTrialEndDate: () => {
        const { trialEndsAt } = get();
        return trialEndsAt !== null ? new Date(trialEndsAt) : null;
      },
      isCardReadOnly: (cardIndex: number) => {
        const { tier } = get();
        // Cards at index >= FREE_CARD_LIMIT are read-only on free tier
        return tier === 'free' && cardIndex >= FREE_CARD_LIMIT;
      },
      daysUntilDataDeletion: () => {
        const { tier, proExpiredAt } = get();
        if (tier === 'pro' || proExpiredAt === null) return null;
        const elapsed = Date.now() - proExpiredAt;
        const remaining = DATA_RETENTION_DAYS - Math.floor(elapsed / (24 * 60 * 60 * 1000));
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
