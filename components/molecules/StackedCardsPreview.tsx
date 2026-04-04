import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { calculateCardStatus } from '@/utils/decisionEngine';
import type { Card, CardStatus } from '@/types/card';

interface StackedCardsPreviewProps {
  cards: Card[];
  getNetAvailableCash: (card: Card) => number | null;
}

const MAX_VISIBLE = 5;

export function StackedCardsPreview({ cards, getNetAvailableCash }: StackedCardsPreviewProps) {
  const t = useAppTheme();

  const statusColorMap: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  const visible = cards.slice(0, MAX_VISIBLE);
  const total = cards.length;
  const extra = total - MAX_VISIBLE;

  return (
    <View style={styles.container}>
      <View style={styles.stack}>
        {visible.map((card, i) => {
          const { status } = calculateCardStatus(card, new Date(), getNetAvailableCash(card));
          const accentColor = statusColorMap[status];
          const offset = (visible.length - 1 - i);
          const rotation = (i - Math.floor(visible.length / 2)) * 3;

          return (
            <View
              key={card.id}
              style={[
                styles.miniCard,
                {
                  backgroundColor: t.surfaceElevated,
                  borderColor: t.border,
                  zIndex: i,
                  transform: [
                    { rotate: `${rotation}deg` },
                    { translateY: offset * -3 },
                  ],
                },
              ]}
              accessible
              accessibilityLabel={`${card.bankName}, status ${status}`}
            >
              <View style={styles.miniTop}>
                <Text style={[styles.miniBankName, { color: t.textPrimary }]} numberOfLines={1}>
                  {card.bankName}
                </Text>
                <View style={[styles.miniDot, { backgroundColor: accentColor, shadowColor: accentColor }]} />
              </View>
              <View style={[styles.miniUtilTrack, { backgroundColor: t.border }]}>
                <View
                  style={[
                    styles.miniUtilFill,
                    {
                      backgroundColor: accentColor,
                      width: `${Math.max(Math.min(card.outstandingBalance / card.creditLimit, 1) * 100, 3)}%` as `${number}%`,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
      {extra > 0 && (
        <Text style={[styles.extraLabel, { color: t.textMuted }]}>
          +{extra} more
        </Text>
      )}
      <Text style={[styles.allCardsLabel, { color: t.textPrimary }]}>
        {total} {total === 1 ? 'card' : 'cards'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  stack: {
    width: '65%',
    aspectRatio: 85.6 / 53.98,
    position: 'relative',
  },
  miniCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  miniTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniBankName: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    flex: 1,
    marginRight: 6,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  miniUtilTrack: {
    height: 3,
    borderRadius: 1.5,
    width: '100%',
  },
  miniUtilFill: {
    height: 3,
    borderRadius: 1.5,
  },
  extraLabel: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    marginTop: 8,
  },
  allCardsLabel: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    marginTop: 4,
  },
});
