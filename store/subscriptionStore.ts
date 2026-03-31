import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'pro';
export type PlanType = 'annual' | 'monthly';

const FREE_CARD_LIMIT = 2;
const TRIAL_DURATION_DAYS = 14;

interface SubscriptionStore {
  tier: SubscriptionTier;
  trialEndsAt: number | null; // timestamp, set when trial starts
  planType: PlanType | null; // null = trial or free, set on purchase
  startTrial: () => void;
  isTrialActive: () => boolean;
  isPaidPro: () => boolean;
  purchasePro: (plan: PlanType) => void;
  verifyEntitlement: () => void;
  checkTrialExpiry: () => void;
  canAddCard: (currentCardCount: number) => boolean;
  getTrialEndDate: () => Date | null;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      tier: 'free' as SubscriptionTier,
      trialEndsAt: null,
      planType: null as PlanType | null,
      startTrial: () => {
        const trialEnd = Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
        set({ tier: 'pro', trialEndsAt: trialEnd });
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
        set({ tier: 'pro', planType: plan, trialEndsAt: null });
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
          set({ tier: 'free' });
        }
      },
      canAddCard: (currentCardCount: number) => {
        return get().tier === 'pro' || currentCardCount < FREE_CARD_LIMIT;
      },
      getTrialEndDate: () => {
        const { trialEndsAt } = get();
        return trialEndsAt !== null ? new Date(trialEndsAt) : null;
      },
    }),
    {
      name: 'falcly-subscription',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tier: state.tier,
        trialEndsAt: state.trialEndsAt,
        planType: state.planType,
      }),
    },
  ),
);

export { FREE_CARD_LIMIT, TRIAL_DURATION_DAYS };
