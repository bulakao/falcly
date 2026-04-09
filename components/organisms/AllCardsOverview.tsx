import { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Pressable, Image, View as RNView, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SectionHeader, OfflineChip, TierBadge } from '@/components/atoms';
import { BestCardBanner, FinanceCard, SurfaceCard, CardOverlay } from '@/components/molecules';
import { useAuthStore } from '@/store/authStore';
import { GanttTimeline } from '@/components/organisms/GanttTimeline';
import { FutureTimeline } from '@/components/organisms/FutureTimeline';
import { calculateBestCard, calculateCardStatus, getCycleDates } from '@/utils/decisionEngine';
import { computeAvalanchePlan } from '@/utils/payoffPlanner';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useOverlayStore } from '@/store/overlayStore';
import { useCurrency } from '@/hooks/useCurrency';
import type { Card } from '@/types/card';

type SortMode = 'urgency' | 'utilization' | 'dueDate';
const SORT_KEY = '@falcly/card_sort';
const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: 'Urgency', value: 'urgency' },
  { label: 'Utilization', value: 'utilization' },
  { label: 'Due Date', value: 'dueDate' },
];
const STATUS_ORDER: Record<string, number> = { RISKY: 0, CAUTION: 1, SAFE: 2 };

interface AllCardsOverviewProps {
  cards: Card[];
  getNetAvailableCash: (card: Card) => number | null;
  getCurrentCycleTxSum?: (card: Card) => number;
  onGanttCardPress?: (cardId: string) => void;
  onBannerPress?: () => void;
  onAddPress?: () => void;
}

function GanttSkeleton() {
  const t = useAppTheme();
  return (
    <RNView style={styles.ganttSkeleton}>
      {[1, 2, 3].map((i) => (
        <RNView key={i} style={styles.ganttSkeletonRow}>
          <RNView style={[styles.ganttSkeletonLabel, { backgroundColor: t.border }]} />
          <RNView style={styles.ganttSkeletonBarArea}>
            <RNView style={[styles.ganttSkeletonBar, { backgroundColor: t.border, width: `${40 + i * 15}%` }]} />
          </RNView>
        </RNView>
      ))}
    </RNView>
  );
}

interface DebtSummaryProps {
  cards: Card[];
  monthlyIncome: number | null;
  committedExpenses: number | null;
  isPro: boolean;
  format: (n: number) => string;
  onUpgrade: () => void;
  onViewPlanner: () => void;
}

function DebtSummaryCard({ cards, monthlyIncome, committedExpenses, isPro, format, onUpgrade, onViewPlanner }: DebtSummaryProps) {
  const t = useAppTheme();

  const summary = useMemo(() => {
    const debtCards = cards.filter((c) => c.isActive && c.outstandingBalance > 0);
    if (debtCards.length === 0) return null;

    const totalDebt = debtCards.reduce((sum, c) => sum + c.outstandingBalance, 0);

    // Compute payoff estimate if we have income data
    let budget: number | null = null;
    if (monthlyIncome !== null && committedExpenses !== null && monthlyIncome > committedExpenses) {
      budget = Math.round(monthlyIncome - committedExpenses);
    }

    const plan = budget ? computeAvalanchePlan(debtCards, budget) : null;

    return { totalDebt, cardCount: debtCards.length, plan, budget };
  }, [cards, monthlyIncome, committedExpenses]);

  if (!summary) return null;

  if (!isPro) {
    return (
      <Pressable
        style={[styles.debtCard, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={onUpgrade}
        accessibilityRole="button"
        accessibilityLabel="Upgrade to see payoff timeline"
      >
        <Text style={[styles.debtTitle, { color: t.textPrimary }]}>Total Debt</Text>
        <Text style={[styles.debtAmount, { color: t.risky }]}>{format(summary.totalDebt)}</Text>
        <Text style={[styles.debtSubtext, { color: t.textMuted }]}>
          Across {summary.cardCount} card{summary.cardCount !== 1 ? 's' : ''}
        </Text>
        <RNView style={[styles.debtDivider, { backgroundColor: t.border }]} />
        <Text style={[styles.debtCta, { color: t.accent }]}>
          Upgrade to Pro to see your payoff timeline →
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.debtCard, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={onViewPlanner}
      accessibilityRole="button"
      accessibilityLabel="View Payoff Planner"
    >
      <Text style={[styles.debtTitle, { color: t.textPrimary }]}>Total Debt</Text>
      <Text style={[styles.debtAmount, { color: t.risky }]}>{format(summary.totalDebt)}</Text>
      <Text style={[styles.debtSubtext, { color: t.textMuted }]}>
        Across {summary.cardCount} card{summary.cardCount !== 1 ? 's' : ''}
      </Text>
      {summary.plan && (
        <>
          <RNView style={[styles.debtDivider, { backgroundColor: t.border }]} />
          <RNView style={styles.debtStats}>
            <RNView style={styles.debtStat}>
              <Text style={[styles.debtStatValue, { color: t.textPrimary }]}>
                {summary.plan.totalMonths >= 360 ? '360+' : summary.plan.totalMonths}
              </Text>
              <Text style={[styles.debtStatLabel, { color: t.textMuted }]}>
                month{summary.plan.totalMonths !== 1 ? 's' : ''}
              </Text>
            </RNView>
            <RNView style={[styles.debtStatSep, { backgroundColor: t.border }]} />
            <RNView style={styles.debtStat}>
              <Text style={[styles.debtStatValue, { color: t.risky }]}>
                {format(summary.plan.totalInterest)}
              </Text>
              <Text style={[styles.debtStatLabel, { color: t.textMuted }]}>in interest</Text>
            </RNView>
          </RNView>
          <Text style={[styles.debtHint, { color: t.textMuted }]}>
            Avalanche · {format(summary.budget!)} /mo budget
          </Text>
        </>
      )}
      {!summary.plan && (
        <>
          <RNView style={[styles.debtDivider, { backgroundColor: t.border }]} />
          <Text style={[styles.debtHint, { color: t.textMuted }]}>
            Set your income & expenses to see payoff estimate
          </Text>
        </>
      )}
      <Text style={[styles.debtCta, { color: t.primary }]}>View Payoff Planner →</Text>
    </Pressable>
  );
}

export function AllCardsOverview({ cards, getNetAvailableCash, getCurrentCycleTxSum, onGanttCardPress, onBannerPress, onAddPress }: AllCardsOverviewProps) {
  const t = useAppTheme();
  const router = useRouter();
  const allCards = useCardStore((s) => s.cards);
  const { format } = useCurrency();

  const user = useAuthStore((s) => s.user);
  const avatarEmoji = useUserStore((s) => s.avatarEmoji);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const bestCard = cards.length > 0 ? calculateBestCard(cards, new Date(), getNetAvailableCash, getCurrentCycleTxSum) : null;

  const [sortMode, setSortMode] = useState<SortMode>('urgency');
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SORT_KEY).then((v) => {
      if (v === 'urgency' || v === 'utilization' || v === 'dueDate') setSortMode(v);
    });
    const TOOLTIP_KEY = '@falcly/avatar_tooltip_count';
    const SETTINGS_OPENED_KEY = '@falcly/settings_opened';
    const MAX_SHOWS = 5;
    let cancelled = false;
    Promise.all([
      AsyncStorage.getItem(SETTINGS_OPENED_KEY),
      AsyncStorage.getItem(TOOLTIP_KEY),
    ]).then(([opened, raw]) => {
      if (cancelled || opened) return;
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= MAX_SHOWS) return;
      AsyncStorage.setItem(TOOLTIP_KEY, String(count + 1));
      setShowTooltip(true);
      Animated.sequence([
        Animated.timing(tooltipOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(5000),
        Animated.timing(tooltipOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => setShowTooltip(false));
    });
    return () => { cancelled = true; };
  }, [tooltipOpacity]);

  function handleSortChange(mode: SortMode) {
    setSortMode(mode);
    AsyncStorage.setItem(SORT_KEY, mode);
  }

  const displayCards = useMemo(() => {
    const sorted = [...cards];
    const now = new Date();
    if (sortMode === 'urgency') {
      sorted.sort((a, b) => {
        const aStatus = calculateCardStatus(a, now, getNetAvailableCash(a), getCurrentCycleTxSum ? getCurrentCycleTxSum(a) : 0);
        const bStatus = calculateCardStatus(b, now, getNetAvailableCash(b), getCurrentCycleTxSum ? getCurrentCycleTxSum(b) : 0);
        const diff = (STATUS_ORDER[aStatus.status] ?? 2) - (STATUS_ORDER[bStatus.status] ?? 2);
        if (diff !== 0) return diff;
        return getCycleDates(a, now).daysToStatement - getCycleDates(b, now).daysToStatement;
      });
    } else if (sortMode === 'utilization') {
      sorted.sort((a, b) => {
        const aUtil = a.creditLimit > 0 ? a.outstandingBalance / a.creditLimit : 0;
        const bUtil = b.creditLimit > 0 ? b.outstandingBalance / b.creditLimit : 0;
        return bUtil - aUtil;
      });
    } else {
      sorted.sort((a, b) => {
        return getCycleDates(a, now).daysToStatement - getCycleDates(b, now).daysToStatement;
      });
    }
    return sorted;
  }, [cards, sortMode, getNetAvailableCash, getCurrentCycleTxSum]);

  const sortedCards = displayCards.filter(
    (c) => c.installmentsMonthlyAmount > 0 || c.subscriptionsThisCycle > 0 || (c.annualFee > 0 && c.annualFeeMonth > 0),
  );

  const getNextOverlay = useOverlayStore((s) => s.getNextOverlay);
  const dismissOverlay = useOverlayStore((s) => s.dismiss);
  const shouldShowOverlay = useOverlayStore((s) => s.shouldShowOverlay);
  const portfolioOverlay = shouldShowOverlay() ? getNextOverlay() : null;

  return (
    <View style={styles.container}>
      {/* Portfolio-level overlay */}
      {portfolioOverlay && (
        <RNView style={styles.portfolioOverlay}>
          <CardOverlay
            item={portfolioOverlay}
            onDismiss={() => dismissOverlay(portfolioOverlay.id)}
            onAction={() => dismissOverlay(portfolioOverlay.id)}
          />
        </RNView>
      )}

      {/* Top row: avatar + tier badge + offline chip */}
      <View style={styles.topRow}>
        <Pressable
          style={[styles.avatar, { backgroundColor: avatarEmoji ? t.inputBg : user?.user_metadata?.avatar_url ? undefined : t.surface }]}
          onPress={() => {
            AsyncStorage.setItem('@falcly/settings_opened', '1');
            router.push('/settings');
          }}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          {avatarEmoji ? (
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          ) : user?.user_metadata?.avatar_url ? (
            <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatarImage} />
          ) : (
            <FontAwesome name="plus" size={16} color={t.textMuted} />
          )}
          {!user && <RNView style={[styles.nudgeDot, { backgroundColor: t.accent }]} />}
        </Pressable>
        {showTooltip && (
          <Animated.View style={[styles.tooltip, { backgroundColor: t.surface, borderColor: t.border, opacity: tooltipOpacity }]}>
            <RNView style={[styles.tooltipArrow, { borderRightColor: t.border }]} />
            <RNView style={[styles.tooltipArrowInner, { borderRightColor: t.surface }]} />
            <Text style={[styles.tooltipText, { color: t.textSecondary }]}>Settings</Text>
          </Animated.View>
        )}
        <View style={styles.spacer} />
        <OfflineChip />
        <TierBadge />
      </View>

      <BestCardBanner bestCard={bestCard} hasCards={allCards.length > 0} hasActiveCards={cards.length > 0} onPress={onBannerPress} onAddPress={onAddPress} />

      {/* Sort chips */}
      {cards.length > 1 && (
        <RNView style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => {
            const active = sortMode === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.sortChip,
                  { borderColor: t.inputBorder, backgroundColor: t.inputBg },
                  active && { backgroundColor: t.primary, borderColor: t.primary },
                ]}
                onPress={() => handleSortChange(opt.value)}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${opt.label}`}
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    { color: t.inputText },
                    active && { color: t.textInverse },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </RNView>
      )}

      <SurfaceCard style={styles.billingCard}>
        <SectionHeader
          title="Billing Cycles"
          subtitle="Tap a card to see its details"
        />
        {displayCards.length > 0 ? (
          <GanttTimeline cards={displayCards} onCardPress={onGanttCardPress} />
        ) : (
          <GanttSkeleton />
        )}
      </SurfaceCard>

      <FinanceCard />

      <DebtSummaryCard
        cards={allCards}
        monthlyIncome={monthlyIncome}
        committedExpenses={committedExpenses}
        isPro={isPro()}
        format={format}
        onUpgrade={() => router.push('/paywall-manual' as any)}
        onViewPlanner={() => router.push(isPro() ? '/payoff-planner' : ('/paywall-manual' as any))}
      />

      {sortedCards.length > 0 && (
        <View style={styles.futureSection}>
          <SectionHeader
            title="Future Projections"
            subtitle="Based on installments, subscriptions, and annual fees"
          />
          {sortedCards.map((card) => (
            <View key={card.id} style={styles.cardSection}>
              <Text style={[styles.cardName, { color: t.textPrimary }]}>{card.bankName}</Text>
              <FutureTimeline card={card} netAvailableCash={getNetAvailableCash(card)} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  portfolioOverlay: {
    position: 'relative',
    height: 120,
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sortChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  sortChipText: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  nudgeDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  tooltip: {
    position: 'absolute',
    top: 6,
    left: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
    flexDirection: 'row',
  },
  tooltipArrow: {
    position: 'absolute',
    left: -8,
    top: 8,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  tooltipArrowInner: {
    position: 'absolute',
    left: -6,
    top: 8,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  tooltipText: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
  },
  spacer: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  billingCard: {
    marginBottom: 24,
  },
  futureSection: {
    marginTop: 8,
  },
  cardSection: {
    marginBottom: 20,
  },
  cardName: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    marginBottom: 8,
  },
  debtCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  debtTitle: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 28,
    fontFamily: fonts.interBold,
    marginBottom: 2,
  },
  debtSubtext: {
    fontSize: 13,
    marginBottom: 4,
  },
  debtDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  debtStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  debtStat: {
    flex: 1,
    alignItems: 'center',
  },
  debtStatValue: {
    fontSize: 18,
    fontFamily: fonts.interBold,
    marginBottom: 2,
  },
  debtStatLabel: {
    fontSize: 12,
  },
  debtStatSep: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  debtHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  debtCta: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    textAlign: 'center',
    marginTop: 4,
  },
  ganttSkeleton: {
    opacity: 0.35,
    paddingTop: 8,
  },
  ganttSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    height: 24,
  },
  ganttSkeletonLabel: {
    width: 60,
    height: 12,
    borderRadius: 4,
    marginRight: 12,
  },
  ganttSkeletonBarArea: {
    flex: 1,
    height: 16,
    justifyContent: 'center',
  },
  ganttSkeletonBar: {
    height: 12,
    borderRadius: 4,
  },
});
