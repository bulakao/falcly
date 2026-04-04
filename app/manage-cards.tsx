import { StyleSheet, Pressable, View as RNView, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import { Text } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionStore, FREE_CARD_LIMIT } from '@/store/subscriptionStore';
import { calculateCardStatus } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { Card, CardStatus } from '@/types/card';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ROW_HEIGHT = 68;

export default function ManageCardsScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const cards = useCardStore((s) => s.cards);
  const toggleCardActive = useCardStore((s) => s.toggleCardActive);
  const deleteCard = useCardStore((s) => s.deleteCard);
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
      Alert.alert(
        'Free Plan Limit',
        `You can only have ${FREE_CARD_LIMIT} active cards on the free plan. Disable another card first, or upgrade to Pro.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/pro-paywall') },
        ],
      );
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
          accessibilityRole="button"
          accessibilityLabel={`${card.bankName} card, long press to reorder`}
          style={[
            styles.row,
            { height: ROW_HEIGHT },
            isActive && [styles.rowDragging, { backgroundColor: t.surface, shadowColor: t.textPrimary }],
          ]}
        >
          <RNView style={styles.dragHandle}>
            <FontAwesome name="bars" size={14} color={isActive ? t.primary : t.textMuted} />
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

          <RNView style={styles.rowActions}>
            <Pressable onPress={() => handleToggle(card.id, card.isActive)} hitSlop={8} accessibilityRole="button" accessibilityLabel={card.isActive ? `Hide ${card.bankName}` : `Show ${card.bankName}`} accessibilityState={{ selected: card.isActive }}>
              <FontAwesome
                name={card.isActive ? 'eye' : 'eye-slash'}
                size={18}
                color={card.isActive ? t.textMuted : t.border}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Delete Card', `Remove ${card.bankName}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteCard(card.id) },
                ])
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${card.bankName}`}
            >
              <FontAwesome name="trash-o" size={18} color={t.risky} />
            </Pressable>
          </RNView>
        </Pressable>
      </ScaleDecorator>
    );
  }

  const header = (
    <Stack.Screen
      options={{
        headerRight: () => (
          <Pressable onPress={handleAddCard} hitSlop={8} style={{ paddingLeft: 12, marginRight: 12 }} accessibilityRole="button" accessibilityLabel="Add card">
            <Text style={{ color: t.primary, fontSize: 16, fontFamily: fonts.interSemiBold }}>Add Card</Text>
          </Pressable>
        ),
      }}
    />
  );

  if (cards.length === 0) {
    return (
      <RNView style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top + 56 }]}>
        {header}
        <Text style={[styles.title, { color: t.textPrimary }]}>Manage Cards</Text>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>No cards yet</Text>
        <RNView style={styles.emptyState}>
          <FontAwesome name="credit-card-alt" size={48} color={t.border} />
          <Text style={[styles.emptyText, { color: t.textMuted }]}>Tap &quot;Add Card&quot; to get started</Text>
        </RNView>
      </RNView>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top + 56 }]}>
      {header}
      <Text style={[styles.title, { color: t.textPrimary }]}>Manage Cards</Text>
      <Text style={[styles.subtitle, { color: t.textMuted }]}>
        {tier === 'free'
          ? `${activeCount}/${FREE_CARD_LIMIT} active · Free plan`
          : `${activeCount} active · ${tier === 'trial' ? 'Free Trial' : 'Pro'}`}
      </Text>

      <DraggableFlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <RNView style={[styles.separator, { backgroundColor: t.border }]} />
        )}
      />

    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.nunitoBold,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    marginLeft: -8,
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
    fontFamily: fonts.interBold,
  },
  balance: {
    fontSize: 12,
    marginTop: 1,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headerAction: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
  separator: {
    height: 1,
    marginHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fonts.interMedium,
  },
});
