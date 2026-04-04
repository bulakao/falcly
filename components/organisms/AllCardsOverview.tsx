import { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Pressable, Image, View as RNView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SectionHeader, OfflineChip, Badge } from '@/components/atoms';
import { BestCardBanner, FinanceCard, SurfaceCard } from '@/components/molecules';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/authStore';
import { GanttTimeline } from '@/components/organisms/GanttTimeline';
import { FutureTimeline } from '@/components/organisms/FutureTimeline';
import { calculateBestCard, calculateCardStatus, getCycleDates } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { useCardStore } from '@/store/cardStore';
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

export function AllCardsOverview({ cards, getNetAvailableCash, getCurrentCycleTxSum, onGanttCardPress, onBannerPress, onAddPress }: AllCardsOverviewProps) {
  const t = useAppTheme();
  const router = useRouter();
  const allCards = useCardStore((s) => s.cards);
  const tier = useSubscriptionStore((s) => s.tier);
  const user = useAuthStore((s) => s.user);
  const isTrialActive = useSubscriptionStore((s) => s.isTrialActive);
  const getTrialEndDate = useSubscriptionStore((s) => s.getTrialEndDate);
  const bestCard = cards.length > 0 ? calculateBestCard(cards, new Date(), getNetAvailableCash, getCurrentCycleTxSum) : null;

  const [sortMode, setSortMode] = useState<SortMode>('urgency');

  useEffect(() => {
    AsyncStorage.getItem(SORT_KEY).then((v) => {
      if (v === 'urgency' || v === 'utilization' || v === 'dueDate') setSortMode(v);
    });
  }, []);

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

  function getBadgeLabel() {
    if (tier === 'pro') return 'PRO';
    if (isTrialActive()) {
      const endDate = getTrialEndDate();
      if (endDate) {
        const days = Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        if (days > 0) return `${days}d trial left`;
      }
    }
    return 'FREE';
  }

  const sortedCards = displayCards.filter(
    (c) => c.installmentsMonthlyAmount > 0 || c.subscriptionsThisCycle > 0 || (c.annualFee > 0 && c.annualFeeMonth > 0),
  );

  function getGreeting(): string {
    const hour = new Date().getHours();
    let greeting: string;
    if (hour >= 5 && hour < 12) greeting = 'Good morning';
    else if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
    else if (hour >= 18) greeting = 'Good evening';
    else greeting = 'Hey';

    const raw = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;
    if (raw) {
      const firstName = String(raw).split(/[\s@]/)[0];
      if (firstName) return `${greeting}, ${firstName}`;
    }
    return greeting;
  }

  return (
    <View style={styles.container}>
      {/* Personalized greeting */}
      <Text style={[styles.greeting, { color: t.textPrimary }]}>{getGreeting()}</Text>

      {/* Top row: avatar + tier badge + offline chip */}
      <View style={styles.topRow}>
        <Pressable
          style={[styles.avatar, { backgroundColor: user?.user_metadata?.avatar_url ? undefined : user ? t.primary : t.surface }]}
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          {user?.user_metadata?.avatar_url ? (
            <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatarImage} />
          ) : (
            <FontAwesome name={user ? 'user' : 'user-plus'} size={16} color={user ? t.primaryText : t.textMuted} />
          )}
          {!user && <RNView style={[styles.nudgeDot, { backgroundColor: t.accent }]} />}
        </Pressable>
        <View style={styles.spacer} />
        <OfflineChip />
        <Pressable onPress={() => router.push('/pro-paywall')} accessibilityRole="button" accessibilityLabel={`${getBadgeLabel()} membership`}>
          <Badge label={getBadgeLabel()} variant={tier === 'pro' ? 'pro' : 'outline'} />
        </Pressable>
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
  greeting: {
    fontSize: 18,
    fontFamily: fonts.interSemiBold,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
