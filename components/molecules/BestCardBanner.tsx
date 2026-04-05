import { StyleSheet, Text, Pressable, View as RNView } from 'react-native';
import { View } from '@/components/Themed';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { UtilizationBar } from '@/components/atoms';
import StatusTooltip from '@/components/molecules/StatusTooltip';
import type { BestCardResult, CardStatus } from '@/types/card';
import { useCurrency } from '@/hooks/useCurrency';

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

  const card = bestCard?.card ?? null;
  const { format } = useCurrency(card);
  const accentColor = card ? statusColorMap[bestCard!.status.status] : undefined;

  // Footer action
  const footerAction = !hasCards ? onAddPress : onPress;
  const showWhy = hasActiveCards;

  return (
    <RNView style={[styles.cardShadow, { shadowColor: t.shadow }]}>
      <RNView style={[styles.cardFace, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
        <RNView style={styles.cardFaceContent}>
          {/* Top */}
          <View style={styles.topLine}>
            <Text style={[styles.label, { color: t.textMuted }]}>Best card to use</Text>
          </View>

          {/* Middle */}
          {card ? (
            <RNView style={styles.middleSection}>
              <View style={styles.nameRow}>
                <RNView style={[styles.dot, { backgroundColor: accentColor, shadowColor: accentColor }]} accessible accessibilityLabel={`Status: ${bestCard!.status.status}`} />
                <Text style={[styles.bankName, { color: t.textPrimary }]}>{card.bankName}</Text>
              </View>
              <RNView style={styles.utilizationRow}>
                <UtilizationBar balance={card.outstandingBalance} limit={card.creditLimit} color={accentColor!} />
                <Text style={[styles.utilizationLabel, { color: t.textMuted }]}>
                  {format(card.outstandingBalance)} / {format(card.creditLimit)}
                </Text>
              </RNView>
              <Text style={[styles.reason, { color: t.textSecondary }]}>{bestCard!.status.reason}</Text>
              {bestCard!.warning && (
                <Text style={[styles.warning, { color: accentColor }]}>⚠ {bestCard!.warning}</Text>
              )}
            </RNView>
          ) : (
            <RNView style={styles.middleSection}>
              <Text style={[styles.bankName, { color: hasActiveCards ? t.risky : t.textMuted }]}>
                {!hasCards ? 'No cards yet' : !hasActiveCards ? 'No active cards' : 'All cards are risky'}
              </Text>
              <Text style={[styles.reason, { color: t.textMuted }]}>
                {!hasCards ? 'Add a card to get started' : !hasActiveCards ? 'Tap to manage your cards' : 'Hold off on swiping if you can'}
              </Text>
            </RNView>
          )}

          {/* Bottom */}
          {footerAction && (
            <RNView>
              <RNView style={[styles.divider, { backgroundColor: t.border }]} />
              <RNView style={styles.manageRow}>
                {showWhy ? (
                  <StatusTooltip>
                    <Text style={[styles.manageText, { color: t.textMuted }]}>WHY?</Text>
                  </StatusTooltip>
                ) : (
                  <RNView />
                )}
                {!hasCards ? (
                  <Pressable style={styles.manageButton} onPress={onAddPress} accessibilityRole="button" accessibilityLabel="Add a new card">
                    <Text style={[styles.manageText, { color: t.primary }]}>ADD</Text>
                    <Plus size={14} color={t.primary} />
                  </Pressable>
                ) : (
                  <Pressable style={styles.manageButton} onPress={onPress} accessibilityRole="button" accessibilityLabel="Manage all cards">
                    <Text style={[styles.manageText, { color: t.primary }]}>MANAGE</Text>
                    <ChevronRight size={14} color={t.primary} />
                  </Pressable>
                )}
              </RNView>
            </RNView>
          )}
        </RNView>
      </RNView>
    </RNView>
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
    marginBottom: 24,
  },
  cardFace: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  cardFaceContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
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
