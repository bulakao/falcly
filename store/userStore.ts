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
  setMonthlyIncome: (income: number) => void;
  setPayday: (day: number) => void;
  setCommittedExpenses: (amount: number) => void;
  setAnalyticsOptOut: (optOut: boolean) => void;
  reset: () => void;
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
      setMonthlyIncome: (income: number) => {
        set({ monthlyIncome: income });
      },
      setPayday: (day: number) => {
        set({ payday: day });
      },
      setCommittedExpenses: (amount: number) => {
        set({ committedExpenses: amount });
      },
      setAnalyticsOptOut: (optOut: boolean) => {
        setAnalyticsOptOut(optOut);
        set({ analyticsOptOut: optOut });
      },
      reset: () => set({
        cashOnHand: null,
        cashUpdatedAt: null,
        monthlyIncome: null,
        payday: null,
        committedExpenses: null,
        analyticsOptOut: false,
      }),
    }),
    {
      name: 'falcly-user',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
