import { StyleSheet, Text, Pressable, View as RNView } from 'react-native';
import { View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAppTheme } from '@/theme';
import type { BestCardResult, CardStatus } from '@/types/card';

interface BestCardBannerProps {
  bestCard: BestCardResult | null;
  hasCards: boolean;
  onPress?: () => void;
}

export function BestCardBanner({ bestCard, hasCards, onPress }: BestCardBannerProps) {
  const t = useAppTheme();

  const statusColorMap: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  // No active cards — prompt to manage or add
  if (!bestCard) {
    return (
      <Pressable style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]} onPress={onPress} disabled={!onPress}>
        <View style={styles.topLine}>
          <Text style={[styles.label, { color: t.textMuted }]}>Best card to use</Text>
          {onPress && <FontAwesome name="chevron-up" size={10} color={t.textMuted} />}
        </View>
        <Text style={[styles.bankName, { color: t.textMuted }]}>
          {hasCards ? 'No active cards' : 'No cards yet'}
        </Text>
        <Text style={[styles.reason, { color: t.textMuted }]}>
          {hasCards ? 'Tap to manage your cards' : 'Add a card to get started'}
        </Text>
      </Pressable>
    );
  }

  const { card, status, warning } = bestCard;
  const accentColor = statusColorMap[status.status];

  return (
    <Pressable style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]} onPress={onPress} disabled={!onPress}>
      <View style={styles.topLine}>
        <Text style={[styles.label, { color: t.textMuted }]}>Best card to use</Text>
        {onPress && <FontAwesome name="chevron-up" size={10} color={t.textMuted} />}
      </View>
      <View style={styles.nameRow}>
        <RNView style={[styles.dot, { backgroundColor: accentColor, shadowColor: accentColor }]} />
        <Text style={[styles.bankName, { color: t.textPrimary }]}>{card.bankName}</Text>
      </View>
      <Text style={[styles.reason, { color: t.textSecondary }]}>{status.reason}</Text>
      {warning && (
        <Text style={[styles.warning, { color: t.caution }]}>⚠ {warning}</Text>
      )}
    </Pressable>
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
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  warning: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});
