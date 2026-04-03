import { StyleSheet, Text, Pressable, View as RNView } from 'react-native';
import { View } from '@/components/Themed';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import StatusTooltip from '@/components/molecules/StatusTooltip';
import type { BestCardResult, CardStatus } from '@/types/card';

interface BestCardBannerProps {
  bestCard: BestCardResult | null;
  hasCards: boolean;
  hasActiveCards: boolean;
  onPress?: () => void;
  onAddPress?: () => void;
}

export function BestCardBanner({ bestCard, hasCards, hasActiveCards, onPress, onAddPress }: BestCardBannerProps) {
  const t = useAppTheme();

  const statusColorMap: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  // No active cards — prompt to manage or add
  if (!bestCard) {
    return (
      <RNView style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
        <RNView style={styles.cardRow}>
          <View style={styles.cardContent}>
            <View style={styles.topLine}>
              <Text style={[styles.label, { color: t.textMuted }]}>Best card to use</Text>
            </View>
            <Text style={[styles.bankName, { color: hasActiveCards ? t.risky : t.textMuted }]}>
              {!hasCards ? 'No cards yet' : !hasActiveCards ? 'No active cards' : 'All cards are risky'}
            </Text>
            <Text style={[styles.reason, { color: t.textMuted }]}>
              {!hasCards ? 'Add a card to get started' : !hasActiveCards ? 'Tap to manage your cards' : 'Hold off on swiping if you can'}
            </Text>
          </View>
        </RNView>
        {(!hasCards ? onAddPress : onPress) && (
          <>
            <RNView style={[styles.divider, { backgroundColor: t.border }]} />
            <RNView style={styles.manageRow}>
              {hasActiveCards ? (
                <StatusTooltip>
                  <Text style={[styles.manageText, { color: t.textMuted }]}>WHY?</Text>
                </StatusTooltip>
              ) : (
                <RNView />
              )}
              {!hasCards ? (
                <Pressable style={styles.manageButton} onPress={onAddPress}>
                  <Text style={[styles.manageText, { color: t.primary }]}>ADD</Text>
                  <Plus size={14} color={t.primary} />
                </Pressable>
              ) : (
                <Pressable style={styles.manageButton} onPress={onPress}>
                  <Text style={[styles.manageText, { color: t.primary }]}>MANAGE</Text>
                  <ChevronRight size={14} color={t.primary} />
                </Pressable>
              )}
            </RNView>
          </>
        )}
      </RNView>
    );
  }

  const { card, status, warning } = bestCard;
  const accentColor = statusColorMap[status.status];

  return (
    <RNView style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
      <View style={styles.cardContent}>
        <View style={styles.topLine}>
          <Text style={[styles.label, { color: t.textMuted }]}>Best card to use</Text>
        </View>
        <View style={styles.nameRow}>
          <RNView style={[styles.dot, { backgroundColor: accentColor, shadowColor: accentColor }]} />
          <Text style={[styles.bankName, { color: t.textPrimary }]}>{card.bankName}</Text>
        </View>
        <RNView style={styles.utilizationRow}>
          <RNView style={[styles.utilizationTrack, { backgroundColor: t.border }]}>
            <RNView
              style={[
                styles.utilizationFill,
                {
                  backgroundColor: accentColor,
                  width: `${Math.max(Math.min(card.outstandingBalance / card.creditLimit, 1) * 100, 2)}%` as `${number}%`,
                },
              ]}
            />
          </RNView>
          <Text style={[styles.utilizationLabel, { color: t.textMuted }]}>
            ₱{card.outstandingBalance.toLocaleString()} / ₱{card.creditLimit.toLocaleString()}
          </Text>
        </RNView>
        <Text style={[styles.reason, { color: t.textSecondary }]}>{status.reason}</Text>
        {warning && (
          <Text style={[styles.warning, { color: t.caution }]}>⚠ {warning}</Text>
        )}
      </View>
      {onPress && (
        <>
          <RNView style={[styles.divider, { backgroundColor: t.border }]} />
          <RNView style={styles.manageRow}>
            <StatusTooltip>
              <Text style={[styles.manageText, { color: t.textMuted }]}>WHY?</Text>
            </StatusTooltip>
            <Pressable style={styles.manageButton} onPress={onPress}>
              <Text style={[styles.manageText, { color: t.primary }]}>MANAGE</Text>
              <ChevronRight size={14} color={t.primary} />
            </Pressable>
          </RNView>
        </>
      )}
    </RNView>
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
    fontFamily: fonts.interSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    fontFamily: fonts.interBold,
  },
  reason: {
    fontSize: 13,
    lineHeight: 20,
  },
  utilizationRow: {
    marginBottom: 16,
  },
  utilizationTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    marginBottom: 4,
  },
  utilizationFill: {
    height: 4,
    borderRadius: 2,
  },
  utilizationLabel: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    textAlign: 'right',
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  warning: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    marginTop: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  divider: {
    height: 1,
    marginTop: 14,
  },
  manageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 2,
  },
  manageText: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
  },
});
