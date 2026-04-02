import { useState, useEffect } from 'react';
import { StyleSheet, Pressable, View as RNView } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { Text } from '@/components/Themed';
import { FormInput, Label, Caption } from '@/components/atoms';
import { AlertBanner } from './AlertBanner';
import { useUserStore } from '@/store/userStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';

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
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const setCommittedExpenses = useUserStore((s) => s.setCommittedExpenses);

  const cashStaleness = cashUpdatedAt ? getStalenessLevel(cashUpdatedAt) : null;
  const [expanded, setExpanded] = useState(true);

  // Local state — show empty string for null/zero so placeholder is visible
  const initMoney = (v: number | null) => (v != null && v > 0 ? formatMoney(String(v)) : '');
  const [cashText, setCashText] = useState(initMoney(cashOnHand));
  const [incomeText, setIncomeText] = useState(initMoney(monthlyIncome));
  const [paydayText, setPaydayText] = useState(payday !== null && payday > 0 ? String(payday) : '');
  const [expensesText, setExpensesText] = useState(initMoney(committedExpenses));

  // Focus tracking
  const [cashFocused, setCashFocused] = useState(false);
  const [incomeFocused, setIncomeFocused] = useState(false);
  const [paydayFocused, setPaydayFocused] = useState(false);
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
            Used to calculate if you can safely pay off your statement balance.
          </Text>
        </RNView>
        <RNView style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronDown size={20} color={t.textSecondary} />
        </RNView>
      </Pressable>

      {expanded && (
        <RNView style={[styles.enrichSection, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }]}>
          {/* Cash on Hand */}
          <Label>Cash on Hand</Label>
          <Caption color={t.textMuted}>Liquid cash available to pay credit card bills.</Caption>
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

          {/* Committed Expenses */}
          <Label>Committed Monthly Expenses</Label>
          <Caption color={t.textMuted}>Fixed expenses (rent, utilities, etc.) deducted from available cash.</Caption>
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
  divider: {
    height: 1,
    marginVertical: 20,
  },
});
