import { StyleSheet, Modal, Pressable, Switch, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionStore, FREE_CARD_LIMIT } from '@/store/subscriptionStore';
import { calculateCardStatus } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import type { CardStatus } from '@/types/card';
import { router } from 'expo-router';

interface CardManagerSheetProps {
  visible: boolean;
  onClose: () => void;
  onCardPress: (cardId: string) => void;
}

export function CardManagerSheet({ visible, onClose, onCardPress }: CardManagerSheetProps) {
  const t = useAppTheme();
  const cards = useCardStore((s) => s.cards);
  const toggleCardActive = useCardStore((s) => s.toggleCardActive);
  const reorderCards = useCardStore((s) => s.reorderCards);
  const tier = useSubscriptionStore((s) => s.tier);

  const statusColorMap: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  const activeCount = cards.filter((c) => c.isActive).length;

  function handleToggle(cardId: string, currentlyActive: boolean) {
    if (!currentlyActive && tier === 'free' && activeCount >= FREE_CARD_LIMIT) {
      router.push('/pro-paywall');
      onClose();
      return;
    }
    toggleCardActive(cardId);
  }

  function handleMove(cardId: string, direction: 'up' | 'down') {
    const idx = cards.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cards.length) return;
    const ids = cards.map((c) => c.id);
    [ids[idx], ids[targetIdx]] = [ids[targetIdx], ids[idx]];
    reorderCards(ids);
  }

  function handleCardTap(cardId: string) {
    onCardPress(cardId);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: t.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.surfaceElevated, borderColor: t.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle}>
            <RNView style={[styles.handleBar, { backgroundColor: t.border }]} />
          </View>

          <Text style={[styles.title, { color: t.textPrimary }]}>Manage Cards</Text>
          {tier === 'free' && (
            <Text style={[styles.limitHint, { color: t.textMuted }]}>
              Free plan — {activeCount}/{FREE_CARD_LIMIT} active cards
            </Text>
          )}

          {cards.map((card, idx) => {
            const { status } = calculateCardStatus(card, new Date());
            const accentColor = statusColorMap[status];

            return (
              <View key={card.id} style={[styles.row, { borderBottomColor: t.border }]}>
                {/* Reorder arrows */}
                <View style={styles.arrows}>
                  <Pressable
                    onPress={() => handleMove(card.id, 'up')}
                    disabled={idx === 0}
                    hitSlop={4}
                  >
                    <FontAwesome name="chevron-up" size={10} color={idx === 0 ? t.border : t.textMuted} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleMove(card.id, 'down')}
                    disabled={idx === cards.length - 1}
                    hitSlop={4}
                  >
                    <FontAwesome name="chevron-down" size={10} color={idx === cards.length - 1 ? t.border : t.textMuted} />
                  </Pressable>
                </View>

                {/* Card info — tappable */}
                <Pressable style={styles.cardInfo} onPress={() => handleCardTap(card.id)}>
                  <RNView style={[styles.dot, { backgroundColor: accentColor, shadowColor: accentColor }]} />
                  <View style={styles.cardText}>
                    <Text style={[styles.bankName, { color: card.isActive ? t.textPrimary : t.textMuted }]} numberOfLines={1}>
                      {card.bankName}
                    </Text>
                    <Text style={[styles.balance, { color: t.textMuted }]}>
                      ₱{card.outstandingBalance.toLocaleString()}
                    </Text>
                  </View>
                </Pressable>

                {/* Active toggle */}
                <Switch
                  value={card.isActive}
                  onValueChange={() => handleToggle(card.id, card.isActive)}
                  trackColor={{ true: t.safe, false: t.border }}
                />
              </View>
            );
          })}

          <Pressable style={[styles.closeButton, { borderColor: t.primary }]} onPress={onClose}>
            <Text style={[styles.closeText, { color: t.primary }]}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    alignItems: 'center',
    marginBottom: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  limitHint: {
    fontSize: 13,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  arrows: {
    width: 24,
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
  },
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  cardText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
  },
  balance: {
    fontSize: 12,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
