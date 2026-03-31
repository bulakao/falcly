import { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { exportDataAsCSV } from '@/utils/csvExport';
import { Button, Badge, FormInput, Heading, SectionHeader, Label } from '@/components/atoms';

export default function SettingsScreen() {
  const t = useAppTheme();
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const cashUpdatedAt = useUserStore((s) => s.cashUpdatedAt);
  const setCashOnHand = useUserStore((s) => s.setCashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const setIncome = useUserStore((s) => s.setIncome);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const setCommittedExpenses = useUserStore((s) => s.setCommittedExpenses);

  const tier = useSubscriptionStore((s) => s.tier);
  const isTrialActive = useSubscriptionStore((s) => s.isTrialActive);
  const isPaidPro = useSubscriptionStore((s) => s.isPaidPro);
  const planType = useSubscriptionStore((s) => s.planType);
  const getTrialEndDate = useSubscriptionStore((s) => s.getTrialEndDate);
  const trialEndDate = getTrialEndDate();

  const [editing, setEditing] = useState(false);
  const [cashText, setCashText] = useState('');

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeText, setIncomeText] = useState('');
  const [paydayText, setPaydayText] = useState('');

  const [editingExpenses, setEditingExpenses] = useState(false);
  const [expensesText, setExpensesText] = useState('');

  const analyticsOptOut = useUserStore((s) => s.analyticsOptOut);
  const setAnalyticsOptOutStore = useUserStore((s) => s.setAnalyticsOptOut);

  const cards = useCardStore((s) => s.cards);
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const [exporting, setExporting] = useState(false);

  const cashStaleness = cashUpdatedAt ? getStalenessLevel(cashUpdatedAt) : null;

  function handleEditCash() {
    setCashText(cashOnHand !== null ? String(cashOnHand) : '');
    setEditing(true);
  }

  function handleSaveCash() {
    const amount = parseFloat(cashText);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }
    setCashOnHand(amount);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleEditIncome() {
    setIncomeText(monthlyIncome !== null ? String(monthlyIncome) : '');
    setPaydayText(payday !== null ? String(payday) : '');
    setEditingIncome(true);
  }

  function handleSaveIncome() {
    const income = parseFloat(incomeText);
    if (isNaN(income) || income < 0) {
      Alert.alert('Invalid', 'Enter a valid income amount.');
      return;
    }
    const day = parseInt(paydayText, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Invalid', 'Payday must be between 1 and 31.');
      return;
    }
    setIncome(income, day);
    setEditingIncome(false);
  }

  function handleCancelIncome() {
    setEditingIncome(false);
  }

  function handleEditExpenses() {
    setExpensesText(committedExpenses !== null ? String(committedExpenses) : '');
    setEditingExpenses(true);
  }

  function handleSaveExpenses() {
    const amount = parseFloat(expensesText);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }
    setCommittedExpenses(amount);
    setEditingExpenses(false);
  }

  function handleCancelExpenses() {
    setEditingExpenses(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Heading>Settings</Heading>

        {/* Pro Subscription Status */}
        {tier === 'pro' && (
          <View style={[styles.proSection, { borderColor: t.accent, backgroundColor: t.accentBg }]}>
            <View style={[styles.proBadgeRow, { backgroundColor: 'transparent' }]}>
              <Badge label="PRO" variant="pro" />
              <Text style={[styles.proStatusText, { color: t.accentText }]}>
                {isPaidPro()
                  ? planType === 'annual' ? 'Annual Plan' : 'Monthly Plan'
                  : isTrialActive() ? 'Free Trial' : 'Active'}
              </Text>
            </View>
            {isTrialActive() && trialEndDate && (
              <Text style={[styles.trialEndText, { color: t.accent }]}>
                Your trial ends on{' '}
                {trialEndDate.toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            )}
            {isPaidPro() && (
              <Text style={[styles.trialEndText, { color: t.accent }]}>
                {planType === 'annual' ? '₱999/yr' : '₱149/mo'} · Cancel anytime
              </Text>
            )}
          </View>
        )}

        {/* Cash on Hand */}
        <View style={[styles.section, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}>
          <SectionHeader
            title="Cash on Hand"
            subtitle="Your liquid cash available to pay credit card bills."
          />

          {editing ? (
            <View>
              <FormInput
                value={cashText}
                onChangeText={setCashText}
                placeholder="e.g. 25000"
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.buttonRow}>
                <View style={styles.buttonFlex}>
                  <Button label="Cancel" onPress={handleCancel} variant="secondary" />
                </View>
                <View style={styles.buttonFlex}>
                  <Button label="Save" onPress={handleSaveCash} />
                </View>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.valueRow}>
                <Text style={[styles.valueText, { color: t.textPrimary }]}>
                  {cashOnHand !== null
                    ? `₱${cashOnHand.toLocaleString()}`
                    : 'Not set'}
                </Text>
                <Pressable style={[styles.editButton, { backgroundColor: t.surface }]} onPress={handleEditCash}>
                  <Text style={[styles.editButtonText, { color: t.accent }]}>
                    {cashOnHand !== null ? 'Update' : 'Set Cash'}
                  </Text>
                </Pressable>
              </View>

              {/* Timestamp */}
              {cashUpdatedAt !== null && (
                <Text
                  style={[
                    styles.timestamp,
                    { color: t.textMuted },
                    cashStaleness === 'warning' && { color: t.caution },
                    cashStaleness === 'stale' && { color: t.textMuted, fontWeight: '600' },
                  ]}
                >
                  Cash updated {formatUpdatedAgo(cashUpdatedAt)}
                </Text>
              )}

              {/* Staleness nudge at 5+ days */}
              {cashStaleness === 'warning' && (
                <Pressable style={[styles.stalenessWarning, { backgroundColor: t.cautionBg }]} onPress={handleEditCash}>
                  <Text style={[styles.stalenessWarningText, { color: t.cautionText }]}>
                    ⚠️ Cash amount may be outdated · Tap to update
                  </Text>
                </Pressable>
              )}
              {cashStaleness === 'stale' && (
                <Pressable style={[styles.stalenessStale, { backgroundColor: t.surface, borderColor: t.border }]} onPress={handleEditCash}>
                  <Text style={[styles.stalenessStaleText, { color: t.textMuted }]}>
                    ⚠ Cash data is stale — update for accurate projections
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Monthly Income & Payday */}
        <View style={[styles.section, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}>
          <SectionHeader
            title="Monthly Income & Payday"
            subtitle="Your monthly income and the day it arrives. Income is factored into payoff projections only when payday falls before your card due date."
          />

          {editingIncome ? (
            <View>
              <Label>Monthly Income</Label>
              <FormInput
                value={incomeText}
                onChangeText={setIncomeText}
                placeholder="e.g. 40000"
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
              />
              <View style={{ marginTop: 12 }}>
                <Label>Payday (day of month)</Label>
              </View>
              <FormInput
                value={paydayText}
                onChangeText={setPaydayText}
                placeholder="e.g. 15"
                keyboardType="numeric"
                selectTextOnFocus
              />
              <View style={styles.buttonRow}>
                <View style={styles.buttonFlex}>
                  <Button label="Cancel" onPress={handleCancelIncome} variant="secondary" />
                </View>
                <View style={styles.buttonFlex}>
                  <Button label="Save" onPress={handleSaveIncome} />
                </View>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.valueRow}>
                <View>
                  <Text style={[styles.valueText, { color: t.textPrimary }]}>
                    {monthlyIncome !== null
                      ? `₱${monthlyIncome.toLocaleString()}`
                      : 'Not set'}
                  </Text>
                  {payday !== null && (
                    <Text style={[styles.paydayLabel, { color: t.textMuted }]}>
                      Payday: day {payday} of each month
                    </Text>
                  )}
                </View>
                <Pressable style={[styles.editButton, { backgroundColor: t.surface }]} onPress={handleEditIncome}>
                  <Text style={[styles.editButtonText, { color: t.accent }]}>
                    {monthlyIncome !== null ? 'Update' : 'Set Income'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Committed Monthly Expenses */}
        <View style={[styles.section, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}>
          <SectionHeader
            title="Committed Monthly Expenses"
            subtitle="Your total fixed monthly expenses (rent, utilities, etc.). Deducted from available cash in payoff projections."
          />

          {editingExpenses ? (
            <View>
              <FormInput
                value={expensesText}
                onChangeText={setExpensesText}
                placeholder="e.g. 15000"
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.buttonRow}>
                <View style={styles.buttonFlex}>
                  <Button label="Cancel" onPress={handleCancelExpenses} variant="secondary" />
                </View>
                <View style={styles.buttonFlex}>
                  <Button label="Save" onPress={handleSaveExpenses} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Text style={[styles.valueText, { color: t.textPrimary }]}>
                {committedExpenses !== null
                  ? `₱${committedExpenses.toLocaleString()}`
                  : 'Not set'}
              </Text>
              <Pressable style={[styles.editButton, { backgroundColor: t.surface }]} onPress={handleEditExpenses}>
                <Text style={[styles.editButtonText, { color: t.accent }]}>
                  {committedExpenses !== null ? 'Update' : 'Set Expenses'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Export Data */}
        <View style={[styles.section, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}>
          <SectionHeader
            title="Export Data"
            subtitle="Export all your cards, installments, subscriptions, and profile data as a CSV file."
          />
          <Button
            label={exporting ? 'Exporting...' : 'Export as CSV'}
            onPress={() => {
              setExporting(true);
              exportDataAsCSV(cards, {
                cashOnHand,
                monthlyIncome,
                payday,
                committedExpenses,
              })
                .catch((e: unknown) => {
                  const message = e instanceof Error ? e.message : 'Export failed';
                  Alert.alert('Export Error', message);
                })
                .finally(() => {
                  setExporting(false);
                });
            }}
            disabled={exporting}
          />
        </View>

        {/* Cloud Sync Status */}
        {tier === 'pro' && (
          <View style={[styles.section, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}>
            <SectionHeader
              title="Cloud Sync"
              subtitle="Pro feature — sync your card data across devices."
            />
            {isOffline ? (
              <View style={[styles.cloudOffline, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.cloudOfflineText, { color: t.textMuted }]}>
                  Cloud sync unavailable — you are offline. Your data is saved locally and all core features work normally.
                </Text>
              </View>
            ) : (
              <Text style={[styles.cloudOnlineText, { color: t.safe }]}>Connected — sync available</Text>
            )}
          </View>
        )}
        {/* Component Showcase */}
        <View style={[styles.section, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}>
          <SectionHeader
            title="Component Showcase"
            subtitle="Preview all UI components with the falcon premium palette."
          />
          <Button
            label="Open Showcase"
            onPress={() => router.push('/component-showcase')}
            variant="secondary"
          />
        </View>

        {/* Analytics Opt-Out */}
        <View style={[styles.section, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}>
          <SectionHeader
            title="Analytics"
            subtitle="Anonymous behavioral analytics help us improve Falcly. No personal or financial data is ever tracked."
          />
          <View style={styles.valueRow}>
            <Text style={[styles.optOutLabel, { color: t.textPrimary }]}>Opt out of analytics</Text>
            <Switch
              value={analyticsOptOut}
              onValueChange={setAnalyticsOptOutStore}
              trackColor={{ true: t.risky }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  proSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  proBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proStatusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  trialEndText: {
    fontSize: 13,
    marginTop: 8,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  buttonFlex: {
    flex: 1,
  },
  stalenessWarning: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  stalenessWarningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stalenessStale: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
  },
  stalenessStaleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paydayLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  cloudOffline: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  cloudOfflineText: {
    fontSize: 13,
  },
  cloudOnlineText: {
    fontSize: 13,
    fontWeight: '600',
  },
  optOutLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
