import { StyleSheet, Modal, Pressable, Switch, View as RNView, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionStore, FREE_CARD_LIMIT } from '@/store/subscriptionStore';
import { calculateCardStatus } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import type { Card, CardStatus } from '@/types/card';
import { router } from 'expo-router';

const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 80; // handle + header
const BUTTON_HEIGHT = 70; // add card button + margin
const SHEET_PADDING = 60; // top + bottom padding

interface CardManagerSheetProps {
  visible: boolean;
  onClose: () => void;
  onCardPress: (cardId: string) => void;
  onAddCard: () => void;
}

export function CardManagerSheet({ visible, onClose, onCardPress, onAddCard }: CardManagerSheetProps) {
  const t = useAppTheme();
  const { height: screenHeight } = useWindowDimensions();
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

  // Calculate list height: fit content or cap at available space
  const maxSheetHeight = screenHeight * 0.75;
  const listContentHeight = cards.length * ROW_HEIGHT;
  const availableForList = maxSheetHeight - HEADER_HEIGHT - BUTTON_HEIGHT - SHEET_PADDING;
  const listHeight = Math.min(listContentHeight, availableForList);

  function handleToggle(cardId: string, currentlyActive: boolean) {
    if (!currentlyActive && tier === 'free' && activeCount >= FREE_CARD_LIMIT) {
      router.push('/pro-paywall');
      onClose();
      return;
    }
    toggleCardActive(cardId);
  }

  function handleCardTap(cardId: string) {
    onCardPress(cardId);
    onClose();
  }

  function handleDragEnd({ data }: { data: Card[] }) {
    reorderCards(data.map((c) => c.id));
  }

  function handleAddCard() {
    onClose();
    onAddCard();
  }

  function renderItem({ item: card, drag, isActive }: RenderItemParams<Card>) {
    const { status } = calculateCardStatus(card, new Date());
    const accentColor = statusColorMap[status];

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          onPress={() => handleCardTap(card.id)}
          delayLongPress={150}
          style={[
            styles.row,
            { borderBottomColor: t.border, height: ROW_HEIGHT },
            isActive && [styles.rowDragging, { backgroundColor: t.surface, shadowColor: t.textPrimary }],
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle}>
            <FontAwesome name="bars" size={14} color={isActive ? t.primary : t.border} />
          </View>

          {/* Card info */}
          <View style={styles.cardInfo}>
            <RNView
              style={[
                styles.dot,
                { backgroundColor: accentColor, shadowColor: accentColor },
                !card.isActive && styles.dotInactive,
              ]}
            />
            <View style={styles.cardText}>
              <Text style={[styles.bankName, { color: card.isActive ? t.textPrimary : t.textMuted }]} numberOfLines={1}>
                {card.bankName}
              </Text>
              <Text style={[styles.balance, { color: t.textMuted }]}>
                ₱{card.outstandingBalance.toLocaleString()} / ₱{card.creditLimit.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Toggle */}
          <Switch
            value={card.isActive}
            onValueChange={() => handleToggle(card.id, card.isActive)}
            trackColor={{ true: t.safe, false: t.border }}
          />
        </Pressable>
      </ScaleDecorator>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: t.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.background }]} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle}>
            <RNView style={[styles.handleBar, { backgroundColor: t.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Manage Cards</Text>
            <Text style={[styles.subtitle, { color: t.textMuted }]}>
              {tier === 'free'
                ? `${activeCount}/${FREE_CARD_LIMIT} active · Free plan`
                : `${activeCount} active · Pro`}
            </Text>
          </View>

          {/* Draggable list with explicit height */}
          <GestureHandlerRootView style={{ height: listHeight }}>
            <DraggableFlatList
              data={cards}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              onDragEnd={handleDragEnd}
            />
          </GestureHandlerRootView>

          {/* Add Card */}
          <Pressable style={[styles.addButton, { backgroundColor: t.primary }]} onPress={handleAddCard}>
            <FontAwesome name="plus" size={14} color={t.primaryText} style={styles.addIcon} />
            <Text style={[styles.addText, { color: t.primaryText }]}>Add Card</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowDragging: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderBottomWidth: 0,
  },
  dragHandle: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
  dotInactive: {
    opacity: 0.35,
    shadowOpacity: 0,
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
    marginTop: 1,
  },
  addButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    marginRight: 8,
  },
  addText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
