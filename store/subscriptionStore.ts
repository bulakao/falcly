import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'pro';

const FREE_CARD_LIMIT = 2;

interface SubscriptionStore {
  tier: SubscriptionTier;
  trialEndsAt: number | null; // timestamp, set when trial starts (MO-02)
  canAddCard: (currentCardCount: number) => boolean;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (_set, get) => ({
      tier: 'free' as SubscriptionTier,
      trialEndsAt: null,
      canAddCard: (currentCardCount: number) => {
        return get().tier === 'pro' || currentCardCount < FREE_CARD_LIMIT;
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

export { FREE_CARD_LIMIT };
