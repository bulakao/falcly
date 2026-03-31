import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStore {
  cashOnHand: number | null;
  cashUpdatedAt: number | null;
  monthlyIncome: number | null;
  payday: number | null; // day of month, 1–31
  setCashOnHand: (amount: number) => void;
  setIncome: (income: number, payday: number) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      cashOnHand: null,
      cashUpdatedAt: null,
      monthlyIncome: null,
      payday: null,
      setCashOnHand: (amount: number) => {
        set({ cashOnHand: amount, cashUpdatedAt: Date.now() });
      },
      setIncome: (income: number, payday: number) => {
        set({ monthlyIncome: income, payday });
      },
    }),
    {
      name: 'falcly-user',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
