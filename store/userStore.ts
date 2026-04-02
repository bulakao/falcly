import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { profile as profileTable } from '@/db/schema/local';
import { setAnalyticsOptOut } from '@/utils/analytics';

const PROFILE_ID = 'local';

type ThemePreference = 'system' | 'light' | 'dark';

interface UserStore {
  cashOnHand: number | null;
  cashUpdatedAt: number | null;
  monthlyIncome: number | null;
  payday: number | null;
  committedExpenses: number | null;
  analyticsOptOut: boolean;
  themePreference: ThemePreference;
  // Notifications
  notifyStatementReminder: boolean;
  notifyDueReminder: boolean;
  notifyHighUtilization: boolean;
  // Currency
  currencySymbol: string;
  // Defaults
  defaultInterestRate: number;
  defaultMinPaymentPct: number;
  defaultMinPaymentFloor: number;

  _initialized: boolean;
  loadProfile: () => void;
  setCashOnHand: (amount: number) => void;
  setIncome: (income: number, payday: number) => void;
  setMonthlyIncome: (income: number) => void;
  setPayday: (day: number) => void;
  setCommittedExpenses: (amount: number) => void;
  setAnalyticsOptOut: (optOut: boolean) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setNotifyStatementReminder: (v: boolean) => void;
  setNotifyDueReminder: (v: boolean) => void;
  setNotifyHighUtilization: (v: boolean) => void;
  setCurrencySymbol: (symbol: string) => void;
  setDefaultInterestRate: (rate: number) => void;
  setDefaultMinPaymentPct: (pct: number) => void;
  setDefaultMinPaymentFloor: (floor: number) => void;
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
  themePreference: 'system' as ThemePreference,
  notifyStatementReminder: true,
  notifyDueReminder: true,
  notifyHighUtilization: false,
  currencySymbol: '₱',
  defaultInterestRate: 0.02,
  defaultMinPaymentPct: 0.05,
  defaultMinPaymentFloor: 500,
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
          themePreference: (row.themePreference as ThemePreference) ?? 'system',
          notifyStatementReminder: row.notifyStatementReminder ?? true,
          notifyDueReminder: row.notifyDueReminder ?? true,
          notifyHighUtilization: row.notifyHighUtilization ?? false,
          currencySymbol: row.currencySymbol ?? '₱',
          defaultInterestRate: row.defaultInterestRate ?? 0.02,
          defaultMinPaymentPct: row.defaultMinPaymentPct ?? 0.05,
          defaultMinPaymentFloor: row.defaultMinPaymentFloor ?? 500,
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
  setThemePreference: (pref: ThemePreference) => {
    updateProfile({ themePreference: pref });
    set({ themePreference: pref });
  },
  setNotifyStatementReminder: (v: boolean) => {
    updateProfile({ notifyStatementReminder: v });
    set({ notifyStatementReminder: v });
  },
  setNotifyDueReminder: (v: boolean) => {
    updateProfile({ notifyDueReminder: v });
    set({ notifyDueReminder: v });
  },
  setNotifyHighUtilization: (v: boolean) => {
    updateProfile({ notifyHighUtilization: v });
    set({ notifyHighUtilization: v });
  },
  setCurrencySymbol: (symbol: string) => {
    updateProfile({ currencySymbol: symbol });
    set({ currencySymbol: symbol });
  },
  setDefaultInterestRate: (rate: number) => {
    updateProfile({ defaultInterestRate: rate });
    set({ defaultInterestRate: rate });
  },
  setDefaultMinPaymentPct: (pct: number) => {
    updateProfile({ defaultMinPaymentPct: pct });
    set({ defaultMinPaymentPct: pct });
  },
  setDefaultMinPaymentFloor: (floor: number) => {
    updateProfile({ defaultMinPaymentFloor: floor });
    set({ defaultMinPaymentFloor: floor });
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
      themePreference: 'system',
      notifyStatementReminder: true,
      notifyDueReminder: true,
      notifyHighUtilization: false,
      currencySymbol: '₱',
      defaultInterestRate: 0.02,
      defaultMinPaymentPct: 0.05,
      defaultMinPaymentFloor: 500,
    });
  },
}));
