import { create } from 'zustand';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { profile as profileTable } from '@/db/schema/local';
import { setAnalyticsOptOut } from '@/utils/analytics';
import { detectLocaleCurrency } from '@/utils/currency';

const PROFILE_ID = 'local';

type ThemePreference = 'system' | 'light' | 'dark';
export type PayoffStrategy = 'full' | 'minimum' | 'fixed' | 'aggressive';

interface UserStore {
  cashOnHand: number | null;
  cashUpdatedAt: number | null;
  monthlyIncome: number | null;
  payday: number | null;
  payday2: number | null;
  committedExpenses: number | null;
  analyticsOptOut: boolean;
  themePreference: ThemePreference;
  // Notifications
  notifyStatementReminder: boolean;
  notifyDueReminder: boolean;
  notifyHighUtilization: boolean;
  // Currency
  globalCurrency: string;
  // Defaults
  defaultInterestRate: number;
  defaultMinPaymentPct: number;
  defaultMinPaymentFloor: number;
  // Payoff strategy
  payoffStrategy: PayoffStrategy;
  fixedPayoffAmount: number | null;
  lastSyncedAt: number | null;

  _initialized: boolean;
  loadProfile: () => void;
  setCashOnHand: (amount: number) => void;
  setIncome: (income: number, payday: number) => void;
  setMonthlyIncome: (income: number) => void;
  setPayday: (day: number) => void;
  setPayday2: (day: number | null) => void;
  setCommittedExpenses: (amount: number) => void;
  setAnalyticsOptOut: (optOut: boolean) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setNotifyStatementReminder: (v: boolean) => void;
  setNotifyDueReminder: (v: boolean) => void;
  setNotifyHighUtilization: (v: boolean) => void;
  setGlobalCurrency: (currency: string) => void;
  setDefaultInterestRate: (rate: number) => void;
  setDefaultMinPaymentPct: (pct: number) => void;
  setDefaultMinPaymentFloor: (floor: number) => void;
  setPayoffStrategy: (strategy: PayoffStrategy) => void;
  setFixedPayoffAmount: (amount: number | null) => void;
  setLastSyncedAt: (ts: number) => void;
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
  payday2: null,
  committedExpenses: null,
  analyticsOptOut: false,
  themePreference: 'system' as ThemePreference,
  notifyStatementReminder: true,
  notifyDueReminder: true,
  notifyHighUtilization: false,
  globalCurrency: detectLocaleCurrency(),
  defaultInterestRate: 0.02,
  defaultMinPaymentPct: 0.05,
  defaultMinPaymentFloor: 500,
  payoffStrategy: 'full' as PayoffStrategy,
  fixedPayoffAmount: null,
  lastSyncedAt: null,
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
          payday2: row.payday2,
          committedExpenses: row.committedExpenses,
          analyticsOptOut: row.analyticsOptOut,
          themePreference: (row.themePreference as ThemePreference) ?? 'system',
          notifyStatementReminder: row.notifyStatementReminder ?? true,
          notifyDueReminder: row.notifyDueReminder ?? true,
          notifyHighUtilization: row.notifyHighUtilization ?? false,
          globalCurrency: row.currencySymbol ?? detectLocaleCurrency(),
          defaultInterestRate: row.defaultInterestRate ?? 0.02,
          defaultMinPaymentPct: row.defaultMinPaymentPct ?? 0.05,
          defaultMinPaymentFloor: row.defaultMinPaymentFloor ?? 500,
          payoffStrategy: (row.payoffStrategy as PayoffStrategy) ?? 'full',
          fixedPayoffAmount: row.fixedPayoffAmount ?? null,
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
  setPayday2: (day: number | null) => {
    updateProfile({ payday2: day });
    set({ payday2: day });
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
  setGlobalCurrency: (currency: string) => {
    updateProfile({ currencySymbol: currency });
    set({ globalCurrency: currency });
  },
  setDefaultInterestRate: (rate: number) => {
    updateProfile({ defaultInterestRate: rate });
    set({ defaultInterestRate: rate });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useCardStore } = require('@/store/cardStore');
    useCardStore.getState().applyDefaultsToCards({ interestRate: rate });
  },
  setDefaultMinPaymentPct: (pct: number) => {
    updateProfile({ defaultMinPaymentPct: pct });
    set({ defaultMinPaymentPct: pct });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useCardStore } = require('@/store/cardStore');
    useCardStore.getState().applyDefaultsToCards({ minPaymentPct: pct });
  },
  setDefaultMinPaymentFloor: (floor: number) => {
    updateProfile({ defaultMinPaymentFloor: floor });
    set({ defaultMinPaymentFloor: floor });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useCardStore } = require('@/store/cardStore');
    useCardStore.getState().applyDefaultsToCards({ minPaymentFloor: floor });
  },
  setPayoffStrategy: (strategy: PayoffStrategy) => {
    updateProfile({ payoffStrategy: strategy });
    set({ payoffStrategy: strategy });
  },
  setFixedPayoffAmount: (amount: number | null) => {
    updateProfile({ fixedPayoffAmount: amount });
    set({ fixedPayoffAmount: amount });
  },
  setLastSyncedAt: (ts: number) => {
    set({ lastSyncedAt: ts });
  },
  reset: () => {
    db.delete(profileTable).where(eq(profileTable.id, PROFILE_ID)).run();
    set({
      cashOnHand: null,
      cashUpdatedAt: null,
      monthlyIncome: null,
      payday: null,
      payday2: null,
      committedExpenses: null,
      analyticsOptOut: false,
      themePreference: 'system',
      notifyStatementReminder: true,
      notifyDueReminder: true,
      notifyHighUtilization: false,
      globalCurrency: detectLocaleCurrency(),
      defaultInterestRate: 0.02,
      defaultMinPaymentPct: 0.05,
      defaultMinPaymentFloor: 500,
      payoffStrategy: 'full',
      fixedPayoffAmount: null,
      lastSyncedAt: null,
    });
  },
}));

/** Returns an array of payday days, filtering out nulls from [payday, payday2]. */
export function getPaydays(): number[] {
  const { payday, payday2 } = useUserStore.getState();
  return [payday, payday2].filter((d): d is number => d != null);
}
