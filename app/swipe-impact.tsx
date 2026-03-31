import { useState, useMemo } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { BillingTimeline } from '@/components/BillingTimeline';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { calculateSwipeImpact, computeNetAvailableCash } from '@/utils/decisionEngine';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import type { CardStatus } from '@/types/card';

const STATUS_COLORS: Record<CardStatus, string> = {
  SAFE: '#10b981',
  CAUTION: '#f59e0b',
  RISKY: '#ef4444',
};

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '✓',
  CAUTION: '⚠',
  RISKY: '✕',
};

const QUICK_AMOUNTS = [
  { label: '₱500', value: 500 },
  { label: '₱1K', value: 1000 },
  { label: '₱2K', value: 2000 },
  { label: '₱5K', value: 5000 },
];

function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

export default function SwipeImpactScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const [amountText, setAmountText] = useState('');

  const proposedAmount = useMemo(() => {
    const n = parseFloat(amountText);
    return isNaN(n) || n < 0 ? 0 : n;
  }, [amountText]);

  const netAvailableCash = useMemo(() => {
    if (!card) return null;
    return computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses);
  }, [card, cashOnHand, monthlyIncome, payday, committedExpenses]);

  const impact = useMemo(() => {
    if (!card) return null;
    return calculateSwipeImpact(card, proposedAmount, netAvailableCash);
  }, [card, proposedAmount, netAvailableCash]);

  if (!card || !impact) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Card not found</Text>
      </View>
    );
  }

  function handleQuickAmount(value: number) {
    setAmountText(String(value));
  }

  const showCarriedBalance = impact.carriedBalance > 0 && impact.monthlyInterest > 0;
  const staleness = getStalenessLevel(card.balanceUpdatedAt);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Staleness banner at 5+ days — tappable to update balance */}
        {staleness !== 'fresh' && (
          <Link href={{ pathname: '/update-balance', params: { cardId: card.id } }} asChild>
            <Pressable style={staleness === 'stale' ? styles.staleBanner : styles.warningBanner}>
              <Text style={staleness === 'stale' ? styles.staleBannerText : styles.warningBannerText}>
                {staleness === 'stale'
                  ? '⚠ Data stale — update before trusting this status'
                  : '⚠️ Balance may be outdated · Tap to update'}
              </Text>
            </Pressable>
          </Link>
        )}

        {/* Card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.bankName}>{card.bankName}</Text>
          {staleness === 'stale' ? (
            <View style={[styles.badge, { backgroundColor: '#6b7280' }]}>
              <Text style={styles.badgeText}>⚠ STALE</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[impact.status] }]}>
              <Text style={styles.badgeText}>
                {STATUS_ICONS[impact.status]} {impact.status}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.reason}>{staleness !== 'stale' ? impact.reason : ''}</Text>

        {/* Balance timestamp + update action */}
        <View style={styles.balanceRow}>
          <Text style={[
            styles.balanceTimestamp,
            staleness === 'warning' && { color: '#f59e0b' },
            staleness === 'stale' && { color: '#6b7280', fontWeight: '600' },
          ]}>
            Balance updated {formatUpdatedAgo(card.balanceUpdatedAt)}
          </Text>
          <Link href={{ pathname: '/update-balance', params: { cardId: card.id } }} asChild>
            <Pressable style={styles.updateButton}>
              <Text style={styles.updateButtonText}>Update Balance</Text>
            </Pressable>
          </Link>
        </View>

        {/* Billing cycle timeline */}
        <BillingTimeline card={card} />

        {/* Amount input */}
        <Text style={styles.label}>How much will you swipe?</Text>
        <TextInput
          style={styles.amountInput}
          value={amountText}
          onChangeText={setAmountText}
          placeholder="0"
          placeholderTextColor="#999"
          keyboardType="numeric"
          autoFocus
        />

        {/* Quick amount chips */}
        <View style={styles.chipRow}>
          {QUICK_AMOUNTS.map((qa) => (
            <Pressable
              key={qa.value}
              style={[
                styles.chip,
                proposedAmount === qa.value && styles.chipActive,
              ]}
              onPress={() => handleQuickAmount(qa.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  proposedAmount === qa.value && styles.chipTextActive,
                ]}
              >
                {qa.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Impact breakdown */}
        <View style={styles.breakdown}>
          <Text style={styles.sectionTitle}>
            {proposedAmount > 0 ? 'If you swipe today:' : 'Current status:'}
          </Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Projected statement balance</Text>
            <Text style={styles.rowValue}>{formatPeso(impact.projectedBalance)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Available to pay</Text>
            <Text style={styles.rowValueMuted}>
              {impact.netAvailableCash !== null
                ? formatPeso(impact.netAvailableCash)
                : 'Not set'}
            </Text>
          </View>

          {committedExpenses !== null && committedExpenses > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Committed expenses</Text>
              <Text style={styles.rowValueMuted}>
                −{formatPeso(committedExpenses)}
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Minimum payment</Text>
            <Text style={styles.rowValue}>{formatPeso(impact.minimumPayment)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Credit available after swipe</Text>
            <Text style={styles.rowValue}>
              {formatPeso(Math.max(0, card.creditLimit - impact.projectedBalance))}
            </Text>
          </View>

          {showCarriedBalance && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, styles.warningText]}>Carried balance</Text>
                <Text style={[styles.rowValue, styles.warningText]}>
                  {formatPeso(impact.carriedBalance)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, styles.warningText]}>
                  Est. monthly interest ({card.interestRate * 100}%)
                </Text>
                <Text style={[styles.rowValue, styles.warningText]}>
                  {formatPeso(impact.monthlyInterest)}
                </Text>
              </View>
            </>
          )}
        </View>

        {impact.netAvailableCash === null && (
          <Text style={styles.hint}>
            Set your cash on hand in Settings to see payoff projections.
          </Text>
        )}
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
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  reason: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  updateButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 24,
    fontWeight: '700',
    backgroundColor: '#fafafa',
    color: '#000',
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 24,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  chipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
  },
  breakdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  rowValueMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  warningText: {
    color: '#ef4444',
  },
  hint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  warningBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  staleBanner: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  staleBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
});
