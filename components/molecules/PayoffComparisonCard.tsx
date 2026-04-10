import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import type { PayoffPlan } from '@/types/payoff';

interface PayoffComparisonCardProps {
  avalanche: PayoffPlan | null;
  snowball: PayoffPlan | null;
  format: (amount: number) => string;
}

export function PayoffComparisonCard({ avalanche, snowball, format }: PayoffComparisonCardProps) {
  const t = useAppTheme();

  if (!avalanche || !snowball) return null;

  const interestSaved = snowball.totalInterest - avalanche.totalInterest;
  const snowballFirstPayoff = Math.min(...snowball.cards.map((c) => c.payoffMonth));
  const avalancheFirstPayoff = Math.min(...avalanche.cards.map((c) => c.payoffMonth));
  const firstCardFaster = avalancheFirstPayoff - snowballFirstPayoff;

  return (
    <View style={[styles.container, { borderColor: t.border }]}>
      <Text style={[styles.title, { color: t.textPrimary }]}>Comparison</Text>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={[styles.strategyLabel, { color: t.primary }]}>Avalanche</Text>
          <Text style={[styles.value, { color: t.textPrimary }]}>{avalanche.totalMonths} months</Text>
          <Text style={[styles.subvalue, { color: t.textSecondary }]}>{format(avalanche.totalInterest)} interest</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: t.border }]} />
        <View style={styles.column}>
          <Text style={[styles.strategyLabel, { color: t.primary }]}>Snowball</Text>
          <Text style={[styles.value, { color: t.textPrimary }]}>{snowball.totalMonths} months</Text>
          <Text style={[styles.subvalue, { color: t.textSecondary }]}>{format(snowball.totalInterest)} interest</Text>
        </View>
      </View>

      {interestSaved > 0 && (
        <Text style={[styles.insight, { color: t.safe }]}>
          Avalanche saves you {format(interestSaved)} in interest
        </Text>
      )}
      {firstCardFaster > 0 && (
        <Text style={[styles.insight, { color: t.caution }]}>
          Snowball pays off your first card {firstCardFaster} month{firstCardFaster !== 1 ? 's' : ''} faster
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: typeScale.body,
    fontFamily: fonts.interBold,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: 12,
  },
  strategyLabel: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  value: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
  },
  subvalue: {
    fontSize: typeScale.body,
    marginTop: 2,
  },
  insight: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
    marginTop: 10,
    textAlign: 'center',
  },
});
