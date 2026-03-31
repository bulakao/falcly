import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
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
import { AllCardsOverview } from '@/components/organisms/AllCardsOverview';
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
  onBannerPress?: () => void;
}

export interface CardPagerRef {
  scrollToCard: (cardId: string) => void;
}

type PageItem =
  | { type: 'overview' }
  | { type: 'card'; card: Card; index: number }
  | { type: 'empty' };

export const CardPager = forwardRef<CardPagerRef, CardPagerProps>(
  function CardPager({ cards, onAddCard, getNetAvailableCash, initialIndex = 0, onBannerPress }, ref) {
    const isCardReadOnly = useSubscriptionStore((s) => s.isCardReadOnly);
    const flatListRef = useRef<FlatList<PageItem>>(null);

    const hasOverview = cards.length > 0;

    const pages: PageItem[] = [
      ...(hasOverview ? [{ type: 'overview' as const }] : []),
      ...cards.map((card, index) => ({ type: 'card' as const, card, index })),
      { type: 'empty' as const },
    ];

    const scrollToCard = useCallback(
      (cardId: string) => {
        const cardIdx = cards.findIndex((c) => c.id === cardId);
        if (cardIdx === -1) return;
        const pageIdx = cardIdx + (hasOverview ? 1 : 0);
        flatListRef.current?.scrollToIndex({ index: pageIdx, animated: true });
      },
      [cards, hasOverview],
    );

    useImperativeHandle(ref, () => ({ scrollToCard }), [scrollToCard]);

    const handleGanttCardPress = useCallback(
      (cardId: string) => scrollToCard(cardId),
      [scrollToCard],
    );

    const renderItem = useCallback(
      ({ item }: { item: PageItem }) => {
        if (item.type === 'overview') {
          return (
            <ScrollView
              style={{ width: PAGE_WIDTH }}
              contentContainerStyle={styles.pageContent}
              showsVerticalScrollIndicator={false}
            >
              <AllCardsOverview
                cards={cards}
                getNetAvailableCash={getNetAvailableCash}
                onGanttCardPress={handleGanttCardPress}
                onBannerPress={onBannerPress}
              />
            </ScrollView>
          );
        }

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
      [cards, getNetAvailableCash, handleGanttCardPress, isCardReadOnly, onAddCard, onBannerPress],
    );

    const keyExtractor = useCallback(
      (item: PageItem) => {
        if (item.type === 'overview') return 'all-cards';
        if (item.type === 'card') return item.card.id;
        return 'add-card';
      },
      [],
    );

    return (
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
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
  },
);

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
