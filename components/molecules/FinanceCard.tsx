import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Pressable, View as RNView } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Text } from '@/components/Themed';
import { FormInput, Label, Caption } from '@/components/atoms';
import { AlertBanner } from './AlertBanner';
import { useUserStore } from '@/store/userStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';

const FINANCE_HINT_DISMISSED_KEY = 'falcly-finance-hint-dismissed';

function formatMoney(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length === 2 ? formatted + '.' + parts[1] : formatted;
}

function parseMoney(formatted: string): number {
  return parseFloat(formatted.replace(/,/g, '')) || 0;
}

function formatInt(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

function ordinalSuffix(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function Divider() {
  const t = useAppTheme();
  return <RNView style={[styles.divider, { backgroundColor: t.border }]} />;
}

export function FinanceCard() {
  const t = useAppTheme();
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const cashUpdatedAt = useUserStore((s) => s.cashUpdatedAt);
  const setCashOnHand = useUserStore((s) => s.setCashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const setMonthlyIncome = useUserStore((s) => s.setMonthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const setPayday = useUserStore((s) => s.setPayday);
  const payday2 = useUserStore((s) => s.payday2);
  const setPayday2 = useUserStore((s) => s.setPayday2);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const setCommittedExpenses = useUserStore((s) => s.setCommittedExpenses);

  const cashStaleness = cashUpdatedAt ? getStalenessLevel(cashUpdatedAt) : null;
  const [expanded, setExpanded] = useState(true);

  // Hint explainer for new users with no finance fields set
  const [hintDismissed, setHintDismissed] = useState(true); // default true to avoid flash
  useEffect(() => {
    AsyncStorage.getItem(FINANCE_HINT_DISMISSED_KEY).then((v) => {
      setHintDismissed(v === 'true');
    });
  }, []);
  const dismissHint = useCallback(() => {
    setHintDismissed(true);
    AsyncStorage.setItem(FINANCE_HINT_DISMISSED_KEY, 'true');
  }, []);
  const allFieldsEmpty = cashOnHand == null && monthlyIncome == null && payday == null && committedExpenses == null;
  const showHint = allFieldsEmpty && !hintDismissed;

  // Local state — show empty string for null/zero so placeholder is visible
  const initMoney = (v: number | null) => (v != null && v > 0 ? formatMoney(String(v)) : '');
  const [cashText, setCashText] = useState(initMoney(cashOnHand));
  const [incomeText, setIncomeText] = useState(initMoney(monthlyIncome));
  const [paydayText, setPaydayText] = useState(payday !== null && payday > 0 ? String(payday) : '');
  const [payday2Text, setPayday2Text] = useState(payday2 !== null && payday2 > 0 ? String(payday2) : '');
  const [expensesText, setExpensesText] = useState(initMoney(committedExpenses));

  // Focus tracking
  const [cashFocused, setCashFocused] = useState(false);
  const [incomeFocused, setIncomeFocused] = useState(false);
  const [paydayFocused, setPaydayFocused] = useState(false);
  const [payday2Focused, setPayday2Focused] = useState(false);
  const [expensesFocused, setExpensesFocused] = useState(false);

  // Sync store → local when not focused
  useEffect(() => {
    if (!cashFocused) setCashText(initMoney(cashOnHand));
  }, [cashOnHand, cashFocused]);
  useEffect(() => {
    if (!incomeFocused) setIncomeText(initMoney(monthlyIncome));
  }, [monthlyIncome, incomeFocused]);
  useEffect(() => {
    if (!paydayFocused) setPaydayText(payday !== null && payday > 0 ? String(payday) : '');
  }, [payday, paydayFocused]);
  useEffect(() => {
    if (!payday2Focused) setPayday2Text(payday2 !== null && payday2 > 0 ? String(payday2) : '');
  }, [payday2, payday2Focused]);
  useEffect(() => {
    if (!expensesFocused) setExpensesText(initMoney(committedExpenses));
  }, [committedExpenses, expensesFocused]);

  // Formatted change handlers
  const handleCashChange = (v: string) => setCashText(formatMoney(v));
  const handleIncomeChange = (v: string) => setIncomeText(formatMoney(v));
  const handlePaydayChange = (v: string) => {
    const cleaned = formatInt(v);
    if (cleaned === '') { setPaydayText(''); return; }
    const n = parseInt(cleaned, 10);
    if (n >= 1 && n <= 31) setPaydayText(String(n));
  };
  const handlePayday2Change = (v: string) => {
    const cleaned = formatInt(v);
    if (cleaned === '') { setPayday2Text(''); return; }
    const n = parseInt(cleaned, 10);
    if (n >= 1 && n <= 31) setPayday2Text(String(n));
  };
  const handleExpensesChange = (v: string) => setExpensesText(formatMoney(v));

  // Debounced saves
  useDebouncedSave(cashText, (v) => {
    const n = parseMoney(v);
    if (n >= 0) setCashOnHand(n);
  });
  useDebouncedSave(incomeText, (v) => {
    const n = parseMoney(v);
    if (n >= 0) setMonthlyIncome(n);
  });
  useDebouncedSave(paydayText, (v) => {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1 && n <= 31) setPayday(n);
  });
  useDebouncedSave(payday2Text, (v) => {
    if (v === '') { setPayday2(null); return; }
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1 && n <= 31) setPayday2(n);
  });
  useDebouncedSave(expensesText, (v) => {
    const n = parseMoney(v);
    if (n >= 0) setCommittedExpenses(n);
  });

  return (
    <RNView style={[styles.enrichContainer, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Pressable style={styles.enrichToggle} onPress={() => setExpanded((v) => !v)}>
        <RNView style={styles.enrichTextWrap}>
          <Text style={[styles.enrichTitle, { color: t.accent }]}>Your Finances</Text>
          <Text style={[styles.enrichHint, { color: t.textMuted }]}>
            Helps Falcly calculate if you can cover your card payments.
          </Text>
        </RNView>
        <RNView style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronDown size={20} color={t.textSecondary} />
        </RNView>
      </Pressable>

      {expanded && (
        <RNView style={[styles.enrichSection, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }]}>
          {showHint && (
            <RNView style={[styles.hintBanner, { backgroundColor: t.accentBg ?? t.surface }]}>
              <Text style={[styles.hintText, { color: t.accent }]}>
                Fill this in to see if you can cover your payments.
              </Text>
              <Pressable onPress={dismissHint} hitSlop={8}>
                <X size={14} color={t.textMuted} />
              </Pressable>
            </RNView>
          )}
          {/* Funds Available */}
          <Label>Funds Available</Label>
          <Caption color={t.textMuted}>Your accessible funds across all accounts — used as the starting point for payment calculations.</Caption>
          <FormInput
            value={cashText}
            onChangeText={handleCashChange}
            placeholder="25000"
            keyboardType="numeric"
            onFocus={() => setCashFocused(true)}
            onBlur={() => setCashFocused(false)}
          />
          {cashUpdatedAt !== null && (
            <Text
              style={[
                styles.timestamp,
                { color: t.textMuted },
                cashStaleness === 'warning' && { color: t.caution },
                cashStaleness === 'stale' && { color: t.textMuted, fontFamily: fonts.interSemiBold },
              ]}
            >
              Updated {formatUpdatedAgo(cashUpdatedAt)}
            </Text>
          )}
          {cashStaleness === 'warning' && (
            <AlertBanner message="⚠️ Cash amount may be outdated" variant="warning" />
          )}
          {cashStaleness === 'stale' && (
            <AlertBanner message="⚠ Cash data is stale" variant="stale" />
          )}

          <Divider />

          {/* Monthly Income */}
          <Label>Monthly Income</Label>
          <Caption color={t.textMuted}>Factored into projections only when payday falls before your due date.</Caption>
          <FormInput
            value={incomeText}
            onChangeText={handleIncomeChange}
            placeholder="40000"
            keyboardType="numeric"
            onFocus={() => setIncomeFocused(true)}
            onBlur={() => setIncomeFocused(false)}
          />

          <Divider />

          {/* Payday */}
          <Label>Payday (day of month)</Label>
          <Caption color={t.textMuted}>The day your salary arrives each month (1–31).</Caption>
          <FormInput
            value={paydayText}
            onChangeText={handlePaydayChange}
            placeholder="15"
            keyboardType="numeric"
            onFocus={() => setPaydayFocused(true)}
            onBlur={() => setPaydayFocused(false)}
          />

          <Divider />

          {/* Second Payday */}
          <Label>Second Payday</Label>
          <Caption color={t.textMuted}>Optional — if you&apos;re paid twice a month (e.g. 15th and 30th).</Caption>
          <FormInput
            value={payday2Text}
            onChangeText={handlePayday2Change}
            placeholder="e.g. 30"
            keyboardType="numeric"
            onFocus={() => setPayday2Focused(true)}
            onBlur={() => setPayday2Focused(false)}
          />
          {payday !== null && payday2 !== null && monthlyIncome !== null && monthlyIncome > 0 && (
            <Text style={[styles.splitHint, { color: t.textMuted }]}>
              Income split evenly: ₱{formatMoney(String(Math.round(monthlyIncome / 2)))} on the {payday}{ordinalSuffix(payday)} · ₱{formatMoney(String(Math.round(monthlyIncome / 2)))} on the {payday2}{ordinalSuffix(payday2)}
            </Text>
          )}

          <Divider />

          {/* Fixed Monthly Expenses */}
          <Label>Fixed Monthly Expenses</Label>
          <Caption color={t.textMuted}>Regular fixed costs (rent, utilities, subscriptions) deducted before calculating what&apos;s available.</Caption>
          <FormInput
            value={expensesText}
            onChangeText={handleExpensesChange}
            placeholder="15000"
            keyboardType="numeric"
            onFocus={() => setExpensesFocused(true)}
            onBlur={() => setExpensesFocused(false)}
          />
        </RNView>
      )}
    </RNView>
  );
}

const styles = StyleSheet.create({
  timestamp: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  enrichContainer: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  enrichToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  enrichTextWrap: {
    flex: 1,
  },
  enrichTitle: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  enrichHint: {
    fontSize: 12,
  },
  enrichSection: {
    padding: 16,
    paddingTop: 8,
  },
  splitHint: {
    fontSize: 12,
    marginTop: 6,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
    flex: 1,
  },
});
