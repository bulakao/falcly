import { useState, useEffect } from 'react';
import { StyleSheet, Pressable, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '@/components/Themed';
import { FormInput, Label, Caption } from '@/components/atoms';
import { AlertBanner } from './AlertBanner';
import { SectionCard } from './SectionCard';
import { useUserStore } from '@/store/userStore';
import { useAppTheme } from '@/theme';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';

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
  const [expanded, setExpanded] = useState(false);

  // Local state
  const [cashText, setCashText] = useState(cashOnHand !== null ? String(cashOnHand) : '');
  const [incomeText, setIncomeText] = useState(monthlyIncome !== null ? String(monthlyIncome) : '');
  const [paydayText, setPaydayText] = useState(payday !== null ? String(payday) : '');
  const [expensesText, setExpensesText] = useState(committedExpenses !== null ? String(committedExpenses) : '');

  // Focus tracking
  const [cashFocused, setCashFocused] = useState(false);
  const [incomeFocused, setIncomeFocused] = useState(false);
  const [paydayFocused, setPaydayFocused] = useState(false);
  const [expensesFocused, setExpensesFocused] = useState(false);

  // Sync store → local when not focused
  useEffect(() => {
    if (!cashFocused) setCashText(cashOnHand !== null ? String(cashOnHand) : '');
  }, [cashOnHand, cashFocused]);
  useEffect(() => {
    if (!incomeFocused) setIncomeText(monthlyIncome !== null ? String(monthlyIncome) : '');
  }, [monthlyIncome, incomeFocused]);
  useEffect(() => {
    if (!paydayFocused) setPaydayText(payday !== null ? String(payday) : '');
  }, [payday, paydayFocused]);
  useEffect(() => {
    if (!expensesFocused) setExpensesText(committedExpenses !== null ? String(committedExpenses) : '');
  }, [committedExpenses, expensesFocused]);

  // Debounced saves
  useDebouncedSave(cashText, (v) => {
    const n = parseFloat(v);
    if (!isNaN(n) && n >= 0) setCashOnHand(n);
  });
  useDebouncedSave(incomeText, (v) => {
    const n = parseFloat(v);
    if (!isNaN(n) && n >= 0) setMonthlyIncome(n);
  });
  useDebouncedSave(paydayText, (v) => {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1 && n <= 31) setPayday(n);
  });
  useDebouncedSave(expensesText, (v) => {
    const n = parseFloat(v);
    if (!isNaN(n) && n >= 0) setCommittedExpenses(n);
  });

  return (
    <SectionCard>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <RNView style={styles.headerText}>
          <Text style={[styles.title, { color: t.textPrimary }]}>Your Finances</Text>
          <Text style={[styles.subtitle, { color: t.textMuted }]}>
            Used to calculate if you can safely pay off your statement balance.
          </Text>
        </RNView>
        <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={t.textMuted} />
      </Pressable>

      {!expanded ? null : (<>
      {/* Cash on Hand */}
      <Label>Cash on Hand</Label>
      <Caption color={t.textMuted}>Liquid cash available to pay credit card bills.</Caption>
      <FormInput
        value={cashText}
        onChangeText={setCashText}
        placeholder="e.g. 25000"
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
            cashStaleness === 'stale' && { color: t.textMuted, fontWeight: '600' },
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
        onChangeText={setIncomeText}
        placeholder="e.g. 40000"
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
        onChangeText={setPaydayText}
        placeholder="e.g. 15"
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
        onChangeText={setExpensesText}
        placeholder="e.g. 15000"
        keyboardType="numeric"
        onFocus={() => setExpensesFocused(true)}
        onBlur={() => setExpensesFocused(false)}
      />
      </>)}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  timestamp: {
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
});
