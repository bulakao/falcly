import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import type { PayoffPlan } from '@/types/payoff';

interface PayoffTimelineProps {
  plan: PayoffPlan;
  format: (amount: number) => string;
}

export function PayoffTimeline({ plan, format }: PayoffTimelineProps) {
  const t = useAppTheme();

  // Collect payoff milestones
  const milestones = plan.cards
    .map((c) => ({ cardId: c.cardId, bankName: c.bankName, payoffMonth: c.payoffMonth }))
    .sort((a, b) => a.payoffMonth - b.payoffMonth);

  return (
    <View style={[styles.container, { borderColor: t.border }]}>
      <Text style={[styles.title, { color: t.textPrimary }]}>Payoff Timeline</Text>

      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1;
        const schedule = plan.cards.find((c) => c.cardId === m.cardId);

        return (
          <View key={m.cardId} style={styles.milestoneRow}>
            {/* Track line + dot */}
            <View style={styles.track}>
              <View style={[styles.dot, { backgroundColor: isLast ? t.safe : t.primary }]} />
              {!isLast && <View style={[styles.line, { backgroundColor: t.border }]} />}
            </View>

            {/* Content */}
            <View style={styles.milestoneContent}>
              <Text style={[styles.bankName, { color: t.textPrimary }]}>{m.bankName}</Text>
              <Text style={[styles.detail, { color: t.textSecondary }]}>
                Paid off in month {m.payoffMonth}
                {schedule ? ` \u00B7 ${format(schedule.totalInterest)} interest` : ''}
              </Text>
            </View>
          </View>
        );
      })}

      <Text style={[styles.summary, { color: t.safe }]}>
        Debt-free in {plan.totalMonths} month{plan.totalMonths !== 1 ? 's' : ''} \u00B7 {format(plan.totalPaid)} total
      </Text>
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
  milestoneRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  track: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  milestoneContent: {
    flex: 1,
    paddingBottom: 12,
  },
  bankName: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interSemiBold,
  },
  detail: {
    fontSize: typeScale.body,
    marginTop: 2,
  },
  summary: {
    fontSize: typeScale.body,
    fontFamily: fonts.interBold,
    textAlign: 'center',
    marginTop: 8,
  },
});
