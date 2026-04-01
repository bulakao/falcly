import { StyleSheet, Pressable, View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import { Text } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionStore, FREE_CARD_LIMIT } from '@/store/subscriptionStore';
import { calculateCardStatus } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import type { Card, CardStatus } from '@/types/card';
import { router } from 'expo-router';

const ROW_HEIGHT = 56;

export default function ManageCardsScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const cards = useCardStore((s) => s.cards);
  const toggleCardActive = useCardStore((s) => s.toggleCardActive);
  const reorderCards = useCardStore((s) => s.reorderCards);
  const tier = useSubscriptionStore((s) => s.tier);
  const canAddCard = useSubscriptionStore((s) => s.canAddCard);

  const statusColorMap: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  const activeCount = cards.filter((c) => c.isActive).length;

  function handleToggle(cardId: string, currentlyActive: boolean) {
    if (!currentlyActive && tier === 'free' && activeCount >= FREE_CARD_LIMIT) {
      router.push('/pro-paywall');
      return;
    }
    toggleCardActive(cardId);
  }

  function handleDragEnd({ data }: { data: Card[] }) {
    reorderCards(data.map((c) => c.id));
  }

  function handleAddCard() {
    if (canAddCard(cards.length)) {
      router.push('/add-card');
    } else {
      router.push('/pro-paywall');
    }
  }

  function renderItem({ item: card, drag, isActive }: RenderItemParams<Card>) {
    const { status } = calculateCardStatus(card, new Date());
    const accentColor = statusColorMap[status];

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={150}
          style={[
            styles.row,
            { borderBottomColor: t.border, height: ROW_HEIGHT },
            isActive && [styles.rowDragging, { backgroundColor: t.surface, shadowColor: t.textPrimary }],
          ]}
        >
          <RNView style={styles.dragHandle}>
            <FontAwesome name="bars" size={14} color={isActive ? t.primary : t.border} />
          </RNView>

          <RNView style={styles.cardInfo}>
            <RNView
              style={[
                styles.dot,
                { backgroundColor: accentColor, shadowColor: accentColor },
                !card.isActive && styles.dotInactive,
              ]}
            />
            <RNView style={styles.cardText}>
              <Text style={[styles.bankName, { color: card.isActive ? t.textPrimary : t.textMuted }]} numberOfLines={1}>
                {card.bankName}
              </Text>
              <Text style={[styles.balance, { color: t.textMuted }]}>
                ₱{card.outstandingBalance.toLocaleString()} / ₱{card.creditLimit.toLocaleString()}
              </Text>
            </RNView>
          </RNView>

          <Pressable onPress={() => handleToggle(card.id, card.isActive)} hitSlop={8}>
            <FontAwesome
              name={card.isActive ? 'eye' : 'eye-slash'}
              size={18}
              color={card.isActive ? t.textMuted : t.border}
            />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top }]}>
      {/* Header: Cancel | Title | Add */}
      <RNView style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.headerAction, { color: t.primary }]}>Cancel</Text>
        </Pressable>
        <RNView style={styles.headerCenter}>
          <Text style={[styles.title, { color: t.textPrimary }]}>Manage Cards</Text>
          <Text style={[styles.subtitle, { color: t.textMuted }]}>
            {tier === 'free'
              ? `${activeCount}/${FREE_CARD_LIMIT} active · Free plan`
              : `${activeCount} active · Pro`}
          </Text>
        </RNView>
        <Pressable onPress={handleAddCard} hitSlop={8}>
          <Text style={[styles.headerAction, { color: t.primary }]}>Add</Text>
        </Pressable>
      </RNView>

      {/* Draggable list */}
      <DraggableFlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.listContent}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
  },
  balance: {
    fontSize: 12,
    marginTop: 1,
  },
});
