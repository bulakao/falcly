import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingStep = 'welcome' | 'signup' | 'card_entry' | 'first_status' | 'enrichment' | 'paywall' | 'notifications' | 'complete';

interface OnboardingStore {
  step: OnboardingStep;
  isComplete: boolean;
  setStep: (step: OnboardingStep) => void;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      step: 'welcome' as OnboardingStep,
      isComplete: false,
      setStep: (step) => set({ step }),
      complete: () => set({ step: 'complete', isComplete: true }),
      reset: () => set({ step: 'welcome', isComplete: false }),
    }),
    {
      name: 'falcly-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
