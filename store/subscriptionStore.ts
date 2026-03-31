import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'pro';

const FREE_CARD_LIMIT = 2;
const TRIAL_DURATION_DAYS = 14;

interface SubscriptionStore {
  tier: SubscriptionTier;
  trialEndsAt: number | null; // timestamp, set when trial starts
  startTrial: () => void;
  isTrialActive: () => boolean;
  checkTrialExpiry: () => void;
  canAddCard: (currentCardCount: number) => boolean;
  getTrialEndDate: () => Date | null;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      tier: 'free' as SubscriptionTier,
      trialEndsAt: null,
      startTrial: () => {
        const trialEnd = Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
        set({ tier: 'pro', trialEndsAt: trialEnd });
      },
      isTrialActive: () => {
        const { tier, trialEndsAt } = get();
        return tier === 'pro' && trialEndsAt !== null && Date.now() < trialEndsAt;
      },
      checkTrialExpiry: () => {
        const { tier, trialEndsAt } = get();
        if (tier === 'pro' && trialEndsAt !== null && Date.now() >= trialEndsAt) {
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
      }),
    },
  ),
);

export { FREE_CARD_LIMIT, TRIAL_DURATION_DAYS };
