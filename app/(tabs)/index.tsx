import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, FlatList } from 'react-native';
import { Link, router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import StatusTooltip from '@/components/StatusTooltip';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { calculateCardStatus, calculateBestCard, computeNetAvailableCash } from '@/utils/decisionEngine';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import type { Card, CardStatus } from '@/types/card';
import type { SemanticTokens } from '@/theme';
import { trackDataStalenessWarningShown } from '@/utils/analytics';

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '✓',
  CAUTION: '⚠',
  RISKY: '✕',
};

function getStatusColor(status: CardStatus, t: SemanticTokens): string {
  const map: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };
  return map[status];
}

function BestCardHero({ cards, getNetAvailableCash }: { cards: Card[]; getNetAvailableCash: (card: Card) => number | null }) {
  const t = useAppTheme();
  const best = calculateBestCard(cards, new Date(), getNetAvailableCash);
  if (!best) return null;

  const { card, status, warning } = best;
  const color = getStatusColor(status.status, t);

  return (
    <Link href={{ pathname: '/swipe-impact', params: { cardId: card.id } }} asChild>
      <Pressable>
        <View style={[styles.hero, { borderColor: color }]}>
          {warning && (
            <View style={[styles.warningBanner, { backgroundColor: t.cautionBg }]}>
              <Text style={[styles.warningText, { color: t.cautionText }]}>⚠ {warning}</Text>
            </View>
          )}
          <Text style={[styles.heroLabel, { color: t.textMuted }]}>Best card to use today</Text>
          <View style={styles.heroRow}>
            <Text style={[styles.heroBankName, { color: t.textPrimary }]}>{card.bankName}</Text>
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={[styles.badgeText, { color: t.textInverse }]}>
                {STATUS_ICONS[status.status]} {status.status}
              </Text>
            </View>
          </View>
          <Text style={[styles.heroReason, { color: t.textSecondary }]}>{status.reason}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

function CardItem({ card, netAvailableCash, readOnly }: { card: Card; netAvailableCash: number | null; readOnly: boolean }) {
  const t = useAppTheme();
  const { status, reason } = calculateCardStatus(card, new Date(), netAvailableCash);
  const staleness = getStalenessLevel(card.balanceUpdatedAt);

  return (
    <Link href={{ pathname: '/swipe-impact', params: { cardId: card.id } }} asChild>
      <Pressable>
        <View style={[styles.card, { borderColor: t.border }, readOnly && styles.readOnlyCard]}>
          {readOnly && (
            <Link href="/pro-paywall" asChild>
              <Pressable style={[styles.readOnlyBanner, { backgroundColor: t.accentBg }]}>
                <Text style={[styles.readOnlyBannerText, { color: t.accent }]}>
                  Reactivate Pro to manage all cards
                </Text>
              </Pressable>
            </Link>
          )}
          <View style={styles.cardHeader}>
            <Text style={[styles.bankName, { color: t.textPrimary }]}>{card.bankName}</Text>
            <View style={styles.badgeRow}>
              {staleness === 'stale' ? (
                <View style={[styles.badge, { backgroundColor: t.textMuted }]}>
                  <Text style={[styles.badgeText, { color: t.textInverse }]}>⚠ STALE</Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: getStatusColor(status, t) }]}>
                  <Text style={[styles.badgeText, { color: t.textInverse }]}>
                    {STATUS_ICONS[status]} {status}
                  </Text>
                </View>
              )}
              <StatusTooltip />
            </View>
          </View>
          {staleness === 'stale' && !readOnly && (
            <Text style={[styles.staleWarning, { color: t.textMuted }]}>
              Data stale — update before trusting this status
            </Text>
          )}
          {staleness === 'warning' && !readOnly && (
            <View style={[styles.stalenessWarningRow, { backgroundColor: t.cautionBg }]}>
              <Text style={[styles.stalenessWarningText, { color: t.cautionText }]}>
                ⚠️ Balance may be outdated · Tap to update
              </Text>
            </View>
          )}
          <Text style={[styles.reason, { color: t.textSecondary }]}>{staleness !== 'stale' ? reason : ''}</Text>
          <View style={styles.cardFooter}>
            <Text style={[styles.detail, { color: t.textMuted }]}>
              ₱{card.outstandingBalance.toLocaleString()} / ₱{card.creditLimit.toLocaleString()}
            </Text>
            <Text style={[styles.updatedAgo, { color: t.textMuted }]}>
              Updated {formatUpdatedAgo(card.balanceUpdatedAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const t = useAppTheme();
  const cards = useCardStore((s) => s.cards);
  const canAddCard = useSubscriptionStore((s) => s.canAddCard);
  const isCardReadOnly = useSubscriptionStore((s) => s.isCardReadOnly);
  const daysUntilDataDeletion = useSubscriptionStore((s) => s.daysUntilDataDeletion);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);

  const daysRemaining = daysUntilDataDeletion();

  const getNetAvailableCash = useCallback(
    (card: Card) => computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses),
    [cashOnHand, monthlyIncome, payday, committedExpenses],
  );

  // Track staleness warning shown once per screen mount
  const stalenessTrackedRef = useRef(false);
  useEffect(() => {
    if (stalenessTrackedRef.current) return;
    const hasStale = cards.some((c) => getStalenessLevel(c.balanceUpdatedAt) === 'stale');
    const hasWarning = cards.some((c) => getStalenessLevel(c.balanceUpdatedAt) === 'warning');
    if (hasStale) {
      trackDataStalenessWarningShown('stale');
      stalenessTrackedRef.current = true;
    } else if (hasWarning) {
      trackDataStalenessWarningShown('warning');
      stalenessTrackedRef.current = true;
    }
  }, [cards]);

  function handleAddCard() {
    if (canAddCard(cards.length)) {
      router.push('/add-card');
    } else {
      router.push('/pro-paywall');
    }
  }

  return (
    <View style={styles.container}>
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No cards yet</Text>
          <Text style={[styles.emptySubtitle, { color: t.textMuted }]}>
            Add your first credit card to see if it&apos;s safe to swipe.
          </Text>
          <Link href="/onboarding" asChild>
            <Pressable style={[styles.onboardingButton, { backgroundColor: t.primary }]}>
              <Text style={[styles.onboardingButtonText, { color: t.textInverse }]}>Get Started</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          renderItem={({ item, index }) => (
            <CardItem card={item} netAvailableCash={getNetAvailableCash(item)} readOnly={isCardReadOnly(index)} />
          )}
          ListHeaderComponent={
            <>
              <BestCardHero cards={cards} getNetAvailableCash={getNetAvailableCash} />
              {daysRemaining !== null && (
                <Link href="/pro-paywall" asChild>
                  <Pressable style={[styles.retentionWarning, { backgroundColor: t.riskyBg, borderColor: t.riskyBorder }]}>
                    <Text style={[styles.retentionWarningText, { color: t.risky }]}>
                      {daysRemaining > 0
                        ? `Your Pro card data will be deleted in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Reactivate Pro to keep it.`
                        : 'Your Pro card data is scheduled for deletion. Reactivate Pro to keep it.'}
                    </Text>
                  </Pressable>
                </Link>
              )}
            </>
          }
          contentContainerStyle={styles.list}
        />
      )}

      <Pressable style={[styles.addButton, { backgroundColor: t.primary }]} onPress={handleAddCard}>
        <Text style={[styles.addButtonText, { color: t.textInverse }]}>+ Add Card</Text>
      </Pressable>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reason: {
    fontSize: 13,
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updatedAgo: {
    fontSize: 12,
  },
  stalenessWarningRow: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  stalenessWarningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  staleWarning: {
    fontSize: 12,
    fontWeight: '600',
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
    textAlign: 'center',
  },
  onboardingButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  onboardingButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
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
  },
  warningBanner: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  readOnlyCard: {
    opacity: 0.75,
    borderStyle: 'dashed',
  },
  readOnlyBanner: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  readOnlyBannerText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  retentionWarning: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  retentionWarningText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
