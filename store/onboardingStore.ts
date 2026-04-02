import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingStep = 'welcome' | 'card_entry' | 'first_status' | 'complete';

interface OnboardingStore {
  step: OnboardingStep;
  isComplete: boolean;
  setStep: (step: OnboardingStep) => void;
  complete: () => void;
  reset: () => void;
}

// Migrate from v0 (had signup, enrichment, paywall, notifications steps)
function migrateStep(step: string): OnboardingStep {
  if (step === 'signup' || step === 'enrichment') return 'card_entry';
  if (step === 'paywall' || step === 'notifications') return 'complete';
  if (['welcome', 'card_entry', 'first_status', 'complete'].includes(step)) {
    return step as OnboardingStep;
  }
  return 'welcome';
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
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) {
          const state = persisted as Record<string, unknown>;
          const step = migrateStep(state.step as string);
          return {
            ...state,
            step,
            isComplete: step === 'complete' || (state.isComplete as boolean),
          };
        }
        return persisted as OnboardingStore;
      },
    },
  ),
);
