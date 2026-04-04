import { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { CardPayoffSchedule } from '@/types/payoff';

interface CardPayoffBreakdownProps {
  schedule: CardPayoffSchedule;
  format: (amount: number) => string;
}

export function CardPayoffBreakdown({ schedule, format }: CardPayoffBreakdownProps) {
  const t = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.container, { borderColor: t.border }]}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((p) => !p)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.bankName, { color: t.textPrimary }]}>{schedule.bankName}</Text>
          <Text style={[styles.subtext, { color: t.textSecondary }]}>
            Month {schedule.payoffMonth} {expanded ? '\u25B4' : '\u25BE'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.balanceLabel, { color: t.textSecondary }]}>{format(schedule.startingBalance)}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Total interest</Text>
            <Text style={[styles.detailValue, { color: t.risky }]}>{format(schedule.totalInterest)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Total paid</Text>
            <Text style={[styles.detailValue, { color: t.textPrimary }]}>{format(schedule.totalPaid)}</Text>
          </View>

          <Text style={[styles.paymentsTitle, { color: t.textPrimary }]}>Monthly payments</Text>
          {schedule.monthlyPayments.map((amount, i) => (
            <View key={i} style={styles.paymentRow}>
              <Text style={[styles.paymentMonth, { color: t.textMuted }]}>Mo {i + 1}</Text>
              <Text style={[styles.paymentAmount, { color: t.textPrimary }]}>{format(amount)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  bankName: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
  },
  subtext: {
    fontSize: 12,
    marginTop: 2,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
  },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
  },
  paymentsTitle: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginTop: 8,
    marginBottom: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  paymentMonth: {
    fontSize: 12,
  },
  paymentAmount: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
  },
});
