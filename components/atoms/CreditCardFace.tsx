import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { Caption } from './Typography';
import { UtilizationBar } from './UtilizationBar';
import StatusTooltip from '@/components/molecules/StatusTooltip';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import { calculateCardStatus } from '@/utils/decisionEngine';
import type { Card, CardStatus } from '@/types/card';
import { useCurrency } from '@/hooks/useCurrency';

interface CreditCardFaceProps {
  card: Card;
  netAvailableCash: number | null;
  currentCycleTxSum?: number;
}

export function CreditCardFace({ card, netAvailableCash, currentCycleTxSum = 0 }: CreditCardFaceProps) {
  const t = useAppTheme();
  const { format } = useCurrency(card);
  const { status, reason } = calculateCardStatus(card, new Date(), netAvailableCash, currentCycleTxSum);
  const staleness = getStalenessLevel(card.balanceUpdatedAt);

  const statusColorMap: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };
  const accentColor = staleness === 'stale' ? t.textMuted : statusColorMap[status];

  return (
    <View style={[styles.cardShadow, { shadowColor: t.shadow }]}>
      <View style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
        <View style={styles.content}>
        {/* Top row: bank name + status dot */}
        <View style={styles.topRow}>
          <Text style={[styles.bankName, { color: t.textPrimary }]} numberOfLines={1}>
            {card.bankName}
          </Text>
          <View style={styles.statusGroup}>
            {staleness !== 'fresh' && (
              <Link href={{ pathname: '/update-balance', params: { cardId: card.id } }} asChild>
                <Pressable
                  accessibilityLabel="Update balance — data is stale"
                  accessibilityRole="button"
                  style={styles.stalenessHit}
                >
                  <Text style={styles.stalenessIcon}>⚠️</Text>
                </Pressable>
              </Link>
            )}
            <StatusTooltip>
              <View
                style={[styles.statusDot, { backgroundColor: accentColor, shadowColor: accentColor }]}
                accessible
                accessibilityLabel={`Card status: ${status}`}
              />
            </StatusTooltip>
          </View>
        </View>

        {/* Reason */}
        {staleness !== 'stale' ? (
          <Text style={[styles.reason, { color: t.textMuted }]} numberOfLines={1}>
            {reason}
          </Text>
        ) : (
          <Text style={[styles.reason, { color: t.textMuted, fontStyle: 'italic' }]} numberOfLines={1}>
            Data stale — update balance
          </Text>
        )}

        {/* Balance */}
        <View style={styles.balanceArea}>
          <Text style={[styles.balance, { color: t.textPrimary }]}>
            {format(card.outstandingBalance)}
          </Text>
          <Text style={[styles.limit, { color: t.textMuted }]}>
            of {format(card.creditLimit)}
          </Text>
        </View>

        {/* Utilization bar */}
        <UtilizationBar balance={card.outstandingBalance} limit={card.creditLimit} color={accentColor} />

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <Text style={[styles.statementDay, { color: t.textMuted }]}>
            Statement day {card.statementDay}
          </Text>
          <Caption>{formatUpdatedAgo(card.balanceUpdatedAt)}</Caption>
        </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    width: '100%',
    aspectRatio: 85.6 / 53.98,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stalenessHit: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stalenessIcon: {
    fontSize: typeScale.body,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  bankName: {
    fontSize: typeScale.headline,
    fontFamily: fonts.nunitoBold,
    flex: 1,
    marginRight: 8,
  },
  reason: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interRegular,
    marginTop: 2,
  },
  balanceArea: {
    marginTop: -2,
  },
  balance: {
    fontSize: typeScale.headline,
    fontFamily: fonts.nunitoBold,
    letterSpacing: -0.5,
  },
  limit: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statementDay: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interSemiBold,
  },
});
