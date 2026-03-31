import { useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  ScrollView,
  Dimensions,
  Keyboard,
} from 'react-native';
import { View } from '@/components/Themed';
import { CreditCardFace, EmptyCardFace } from '@/components/atoms';
import { ImpactSkeleton } from '@/components/molecules';
import { SwipeImpactPanel } from '@/components/organisms/SwipeImpactPanel';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { Card } from '@/types/card';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const PAGE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;

interface CardPagerProps {
  cards: Card[];
  onAddCard: () => void;
  getNetAvailableCash: (card: Card) => number | null;
  initialIndex?: number;
}

type PageItem = { type: 'card'; card: Card; index: number } | { type: 'empty' };

export function CardPager({ cards, onAddCard, getNetAvailableCash, initialIndex = 0 }: CardPagerProps) {
  const isCardReadOnly = useSubscriptionStore((s) => s.isCardReadOnly);

  const pages: PageItem[] = [
    ...cards.map((card, index) => ({ type: 'card' as const, card, index })),
    { type: 'empty' as const },
  ];

  const renderItem = useCallback(
    ({ item }: { item: PageItem }) => {
      if (item.type === 'empty') {
        return (
          <ScrollView
            style={{ width: PAGE_WIDTH }}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardWrapper}>
              <EmptyCardFace onPress={onAddCard} />
            </View>
            <ImpactSkeleton />
          </ScrollView>
        );
      }

      const { card, index } = item;
      const readOnly = isCardReadOnly(index);

      return (
        <ScrollView
          style={{ width: PAGE_WIDTH }}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.cardWrapper}>
            <CreditCardFace card={card} netAvailableCash={getNetAvailableCash(card)} />
          </View>
          <SwipeImpactPanel card={card} readOnly={readOnly} />
        </ScrollView>
      );
    },
    [getNetAvailableCash, isCardReadOnly, onAddCard],
  );

  const keyExtractor = useCallback(
    (item: PageItem) => (item.type === 'card' ? item.card.id : 'add-card'),
    [],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: PAGE_WIDTH,
          offset: PAGE_WIDTH * index,
          index,
        })}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
        snapToInterval={PAGE_WIDTH}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 8,
    paddingBottom: 48,
  },
  cardWrapper: {
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 16,
  },
});
