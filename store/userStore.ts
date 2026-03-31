import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAnalyticsOptOut } from '@/utils/analytics';

interface UserStore {
  cashOnHand: number | null;
  cashUpdatedAt: number | null;
  monthlyIncome: number | null;
  payday: number | null; // day of month, 1–31
  committedExpenses: number | null;
  analyticsOptOut: boolean;
  setCashOnHand: (amount: number) => void;
  setIncome: (income: number, payday: number) => void;
  setCommittedExpenses: (amount: number) => void;
  setAnalyticsOptOut: (optOut: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      cashOnHand: null,
      cashUpdatedAt: null,
      monthlyIncome: null,
      payday: null,
      committedExpenses: null,
      analyticsOptOut: false,
      setCashOnHand: (amount: number) => {
        set({ cashOnHand: amount, cashUpdatedAt: Date.now() });
      },
      setIncome: (income: number, payday: number) => {
        set({ monthlyIncome: income, payday });
      },
      setCommittedExpenses: (amount: number) => {
        set({ committedExpenses: amount });
      },
      setAnalyticsOptOut: (optOut: boolean) => {
        setAnalyticsOptOut(optOut);
        set({ analyticsOptOut: optOut });
      },
    }),
    {
      name: 'falcly-user',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
