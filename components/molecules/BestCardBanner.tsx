import { StyleSheet, Text, View as RNView } from 'react-native';
import { View } from '@/components/Themed';
import { useAppTheme } from '@/theme';
import type { BestCardResult, CardStatus } from '@/types/card';

interface BestCardBannerProps {
  bestCard: BestCardResult | null;
}

export function BestCardBanner({ bestCard }: BestCardBannerProps) {
  const t = useAppTheme();

  const statusColorMap: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  if (!bestCard) {
    return (
      <View style={[styles.card, { backgroundColor: t.riskyBg, borderColor: t.riskyBorder }]}>
        <Text style={[styles.label, { color: t.risky }]}>All cards are risky right now</Text>
        <Text style={[styles.reason, { color: t.textSecondary }]}>
          Consider holding off on swiping until balances or timing improve.
        </Text>
      </View>
    );
  }

  const { card, status, warning } = bestCard;
  const accentColor = statusColorMap[status.status];

  return (
    <View style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
      <Text style={[styles.label, { color: t.textMuted }]}>Best card to use</Text>
      <View style={styles.nameRow}>
        <RNView style={[styles.dot, { backgroundColor: accentColor, shadowColor: accentColor }]} />
        <Text style={[styles.bankName, { color: t.textPrimary }]}>{card.bankName}</Text>
      </View>
      <Text style={[styles.reason, { color: t.textSecondary }]}>{status.reason}</Text>
      {warning && (
        <Text style={[styles.warning, { color: t.caution }]}>⚠ {warning}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '800',
  },
  reason: {
    fontSize: 13,
    lineHeight: 18,
  },
  warning: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});
