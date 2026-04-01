import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { profile as profileTable } from '@/db/schema/local';
import { setAnalyticsOptOut } from '@/utils/analytics';

const PROFILE_ID = 'local';

interface UserStore {
  cashOnHand: number | null;
  cashUpdatedAt: number | null;
  monthlyIncome: number | null;
  payday: number | null;
  committedExpenses: number | null;
  analyticsOptOut: boolean;
  _initialized: boolean;
  loadProfile: () => void;
  setCashOnHand: (amount: number) => void;
  setIncome: (income: number, payday: number) => void;
  setMonthlyIncome: (income: number) => void;
  setPayday: (day: number) => void;
  setCommittedExpenses: (amount: number) => void;
  setAnalyticsOptOut: (optOut: boolean) => void;
  reset: () => void;
}

function ensureProfile() {
  const existing = db.select().from(profileTable).where(eq(profileTable.id, PROFILE_ID)).get();
  if (!existing) {
    db.insert(profileTable).values({ id: PROFILE_ID }).run();
  }
}

function updateProfile(updates: Record<string, unknown>) {
  ensureProfile();
  db.update(profileTable).set(updates).where(eq(profileTable.id, PROFILE_ID)).run();
}

export const useUserStore = create<UserStore>()((set) => ({
  cashOnHand: null,
  cashUpdatedAt: null,
  monthlyIncome: null,
  payday: null,
  committedExpenses: null,
  analyticsOptOut: false,
  _initialized: false,

  loadProfile: () => {
    try {
      ensureProfile();
      const row = db.select().from(profileTable).where(eq(profileTable.id, PROFILE_ID)).get();
      if (row) {
        set({
          cashOnHand: row.cashOnHand,
          cashUpdatedAt: row.cashUpdatedAt ? row.cashUpdatedAt.getTime() : null,
          monthlyIncome: row.monthlyIncome,
          payday: row.payday,
          committedExpenses: row.committedExpenses,
          analyticsOptOut: row.analyticsOptOut,
          _initialized: true,
        });
      } else {
        set({ _initialized: true });
      }
    } catch {
      set({ _initialized: true });
    }
  },

  setCashOnHand: (amount: number) => {
    const now = Date.now();
    updateProfile({ cashOnHand: amount, cashUpdatedAt: new Date(now) });
    set({ cashOnHand: amount, cashUpdatedAt: now });
  },
  setIncome: (income: number, payday: number) => {
    updateProfile({ monthlyIncome: income, payday });
    set({ monthlyIncome: income, payday });
  },
  setMonthlyIncome: (income: number) => {
    updateProfile({ monthlyIncome: income });
    set({ monthlyIncome: income });
  },
  setPayday: (day: number) => {
    updateProfile({ payday: day });
    set({ payday: day });
  },
  setCommittedExpenses: (amount: number) => {
    updateProfile({ committedExpenses: amount });
    set({ committedExpenses: amount });
  },
  setAnalyticsOptOut: (optOut: boolean) => {
    setAnalyticsOptOut(optOut);
    updateProfile({ analyticsOptOut: optOut });
    set({ analyticsOptOut: optOut });
  },
  reset: () => {
    db.delete(profileTable).where(eq(profileTable.id, PROFILE_ID)).run();
    set({
      cashOnHand: null,
      cashUpdatedAt: null,
      monthlyIncome: null,
      payday: null,
      committedExpenses: null,
      analyticsOptOut: false,
    });
  },
}));
