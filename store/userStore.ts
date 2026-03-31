import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStore {
  cashOnHand: number | null;
  cashUpdatedAt: number | null;
  setCashOnHand: (amount: number) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      cashOnHand: null,
      cashUpdatedAt: null,
      setCashOnHand: (amount: number) => {
        set({ cashOnHand: amount, cashUpdatedAt: Date.now() });
      },
    }),
    {
      name: 'falcly-user',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
