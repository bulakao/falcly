import { StyleSheet, Pressable, Image, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SectionHeader, OfflineChip, Badge } from '@/components/atoms';
import { BestCardBanner, FinanceCard } from '@/components/molecules';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/authStore';
import { GanttTimeline } from '@/components/organisms/GanttTimeline';
import { FutureTimeline } from '@/components/organisms/FutureTimeline';
import { calculateBestCard, getCycleDates } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import { useCardStore } from '@/store/cardStore';
import type { Card } from '@/types/card';

interface AllCardsOverviewProps {
  cards: Card[];
  getNetAvailableCash: (card: Card) => number | null;
  onGanttCardPress?: (cardId: string) => void;
  onBannerPress?: () => void;
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

export function AllCardsOverview({ cards, getNetAvailableCash, onGanttCardPress, onBannerPress }: AllCardsOverviewProps) {
  const t = useAppTheme();
  const router = useRouter();
  const allCards = useCardStore((s) => s.cards);
  const tier = useSubscriptionStore((s) => s.tier);
  const user = useAuthStore((s) => s.user);
  const isTrialActive = useSubscriptionStore((s) => s.isTrialActive);
  const getTrialEndDate = useSubscriptionStore((s) => s.getTrialEndDate);
  const bestCard = cards.length > 0 ? calculateBestCard(cards, new Date(), getNetAvailableCash) : null;

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

  const cardsWithFixedEvents = cards.filter(
    (c) => c.installmentsMonthlyAmount > 0 || c.subscriptionsThisCycle > 0 || (c.annualFee > 0 && c.annualFeeMonth > 0),
  );

  const sortedCards = [...cardsWithFixedEvents].sort((a, b) => {
    const aCycle = getCycleDates(a);
    const bCycle = getCycleDates(b);
    return aCycle.daysToStatement - bCycle.daysToStatement;
  });

  return (
    <View style={styles.container}>
      {/* Top row: avatar + tier badge + offline chip */}
      <View style={styles.topRow}>
        <Pressable style={[styles.avatar, { backgroundColor: user?.user_metadata?.avatar_url ? undefined : t.primary }]} onPress={() => router.push('/settings')}>
          {user?.user_metadata?.avatar_url ? (
            <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatarImage} />
          ) : (
            <FontAwesome name="user" size={16} color={t.primaryText} />
          )}
        </Pressable>
        <View style={styles.spacer} />
        <OfflineChip />
        <Pressable onPress={() => router.push('/pro-paywall')}>
          <Badge label={getBadgeLabel()} variant={tier === 'pro' ? 'pro' : 'outline'} />
        </Pressable>
      </View>

      <BestCardBanner bestCard={bestCard} hasCards={allCards.length > 0} onPress={onBannerPress} />

      <View style={styles.section}>
        <SectionHeader
          title="Billing Cycles"
          subtitle="Tap a card to see its details"
        />
        {cards.length > 0 ? (
          <GanttTimeline cards={cards} onCardPress={onGanttCardPress} />
        ) : (
          <GanttSkeleton />
        )}
      </View>

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
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  futureSection: {
    marginTop: 8,
  },
  cardSection: {
    marginBottom: 20,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
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
