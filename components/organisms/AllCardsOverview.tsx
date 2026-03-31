import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SectionHeader, OfflineChip } from '@/components/atoms';
import { BestCardBanner, FinanceCard } from '@/components/molecules';
import { GanttTimeline } from '@/components/organisms/GanttTimeline';
import { FutureTimeline } from '@/components/organisms/FutureTimeline';
import { calculateBestCard, getCycleDates } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import type { Card } from '@/types/card';

interface AllCardsOverviewProps {
  cards: Card[];
  getNetAvailableCash: (card: Card) => number | null;
  onGanttCardPress?: (cardId: string) => void;
  onBannerPress?: () => void;
}

export function AllCardsOverview({ cards, getNetAvailableCash, onGanttCardPress, onBannerPress }: AllCardsOverviewProps) {
  const t = useAppTheme();
  const router = useRouter();
  const bestCard = calculateBestCard(cards, new Date(), getNetAvailableCash);

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
      {/* Top row: offline chip + settings gear */}
      <View style={styles.topRow}>
        <OfflineChip />
        <View style={styles.spacer} />
        <Pressable onPress={() => router.push('/two')} hitSlop={8}>
          <FontAwesome name="cog" size={20} color={t.textMuted} />
        </Pressable>
      </View>

      <BestCardBanner bestCard={bestCard} onPress={onBannerPress} />

      <View style={styles.section}>
        <SectionHeader
          title="Billing Cycles"
          subtitle="Sorted by urgency — closest statement close first"
        />
        <GanttTimeline cards={cards} onCardPress={onGanttCardPress} />
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
    marginBottom: 12,
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
});
