import { useCallback } from 'react';
import { StyleSheet, Pressable, FlatList } from 'react-native';
import { Link } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { calculateCardStatus, calculateBestCard, computeNetAvailableCash } from '@/utils/decisionEngine';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import type { Card, CardStatus } from '@/types/card';

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

function BestCardHero({ cards, getNetAvailableCash }: { cards: Card[]; getNetAvailableCash: (card: Card) => number | null }) {
  const best = calculateBestCard(cards, new Date(), getNetAvailableCash);
  if (!best) return null;

  const { card, status, warning } = best;
  const color = STATUS_COLORS[status.status];

  return (
    <Link href={{ pathname: '/swipe-impact', params: { cardId: card.id } }} asChild>
      <Pressable>
        <View style={[styles.hero, { borderColor: color }]}>
          {warning && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠ {warning}</Text>
            </View>
          )}
          <Text style={styles.heroLabel}>Best card to use today</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroBankName}>{card.bankName}</Text>
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>
                {STATUS_ICONS[status.status]} {status.status}
              </Text>
            </View>
          </View>
          <Text style={styles.heroReason}>{status.reason}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

function CardItem({ card, netAvailableCash }: { card: Card; netAvailableCash: number | null }) {
  const { status, reason } = calculateCardStatus(card, new Date(), netAvailableCash);
  const staleness = getStalenessLevel(card.balanceUpdatedAt);

  return (
    <Link href={{ pathname: '/swipe-impact', params: { cardId: card.id } }} asChild>
      <Pressable>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.bankName}>{card.bankName}</Text>
            {staleness === 'stale' ? (
              <View style={[styles.badge, { backgroundColor: '#6b7280' }]}>
                <Text style={styles.badgeText}>⚠ STALE</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
                <Text style={styles.badgeText}>
                  {STATUS_ICONS[status]} {status}
                </Text>
              </View>
            )}
          </View>
          {staleness === 'stale' && (
            <Text style={styles.staleWarning}>
              Data stale — update before trusting this status
            </Text>
          )}
          {staleness === 'warning' && (
            <View style={styles.stalenessWarningRow}>
              <Text style={styles.stalenessWarningText}>
                ⚠️ Balance may be outdated · Tap to update
              </Text>
            </View>
          )}
          <Text style={styles.reason}>{staleness !== 'stale' ? reason : ''}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.detail}>
              ₱{card.outstandingBalance.toLocaleString()} / ₱{card.creditLimit.toLocaleString()}
            </Text>
            <Text style={styles.updatedAgo}>
              Updated {formatUpdatedAgo(card.balanceUpdatedAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const cards = useCardStore((s) => s.cards);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);

  const getNetAvailableCash = useCallback(
    (card: Card) => computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses),
    [cashOnHand, monthlyIncome, payday, committedExpenses],
  );

  return (
    <View style={styles.container}>
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first credit card to see if it&apos;s safe to swipe.
          </Text>
          <Link href="/onboarding" asChild>
            <Pressable style={styles.onboardingButton}>
              <Text style={styles.onboardingButtonText}>Get Started</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <CardItem card={item} netAvailableCash={getNetAvailableCash(item)} />}
          ListHeaderComponent={<BestCardHero cards={cards} getNetAvailableCash={getNetAvailableCash} />}
          contentContainerStyle={styles.list}
        />
      )}

      <Link href="/add-card" asChild>
        <Pressable style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Card</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 18,
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
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#888',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updatedAgo: {
    fontSize: 12,
    color: '#999',
  },
  stalenessWarningRow: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  stalenessWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  staleWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  onboardingButton: {
    marginTop: 20,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  onboardingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  hero: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroBankName: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroReason: {
    fontSize: 14,
    color: '#666',
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
});
