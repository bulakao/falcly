import { useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  Dimensions,
  Keyboard,
  View as RNView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LayoutGrid } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { CreditCardFace, EmptyCardFace } from '@/components/atoms';
import { ImpactSkeleton, CardOverlay } from '@/components/molecules';
import { SwipeImpactPanel } from '@/components/organisms/SwipeImpactPanel';
import { AllCardsOverview } from '@/components/organisms/AllCardsOverview';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useOverlayStore } from '@/store/overlayStore';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { getCycleDates } from '@/utils/decisionEngine';
import { getContextualWikiOverlay } from '@/utils/overlayTriggers';
import type { Card } from '@/types/card';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const PAGE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;

interface CardPagerProps {
  cards: Card[];
  onAddCard: () => void;
  getNetAvailableCash: (card: Card) => number | null;
  getCurrentCycleTxSum?: (card: Card) => number;
  initialIndex?: number;
  onBannerPress?: () => void;
  hasHiddenCards?: boolean;
}

export interface CardPagerRef {
  scrollToCard: (cardId: string) => void;
}

type PageItem =
  | { type: 'overview' }
  | { type: 'card'; card: Card; index: number }
  | { type: 'empty' };

function CardOverlayLayer({ cardId, card }: { cardId?: string; card?: Card }) {
  const getNextOverlay = useOverlayStore((s) => s.getNextOverlay);
  const dismiss = useOverlayStore((s) => s.dismiss);
  const shouldShow = useOverlayStore((s) => s.shouldShowOverlay);
  const enqueue = useOverlayStore((s) => s.enqueue);

  // Trigger contextual wiki overlays when card is viewed
  useEffect(() => {
    if (!card) return;
    const cycle = getCycleDates(card);
    const utilization = card.creditLimit > 0 ? card.outstandingBalance / card.creditLimit : 0;
    const overlay = getContextualWikiOverlay({
      card,
      today: new Date(),
      daysToStatement: cycle.daysToStatement,
      utilization,
    });
    if (overlay) enqueue(overlay);
  }, [card, enqueue]);

  const overlay = shouldShow() ? getNextOverlay(cardId) : null;
  if (!overlay) return null;

  return (
    <CardOverlay
      item={overlay}
      onDismiss={() => dismiss(overlay.id)}
      onAction={() => {
        dismiss(overlay.id);
        if (overlay.actionRoute) router.push(overlay.actionRoute as never);
      }}
    />
  );
}

export const CardPager = forwardRef<CardPagerRef, CardPagerProps>(
  function CardPager({ cards, onAddCard, getNetAvailableCash, getCurrentCycleTxSum, initialIndex = 0, onBannerPress, hasHiddenCards = false }, ref) {
    const t = useAppTheme();
    const insets = useSafeAreaInsets();
    const isCardReadOnly = useSubscriptionStore((s) => s.isCardReadOnly);
    const flatListRef = useRef<FlatList<PageItem>>(null);
    const buttonTranslateX = useSharedValue(initialIndex > 0 ? 0 : -56);
    const isAnimatingOut = useRef(false);

    const BUTTON_WIDTH = 56;
    // Slide in when 60% into the next page (0.6 * PAGE_WIDTH)
    const SLIDE_IN_THRESHOLD = PAGE_WIDTH * 0.6;

    const scrollToOverview = useCallback(() => {
      // Immediately slide out
      isAnimatingOut.current = true;
      buttonTranslateX.value = withTiming(-BUTTON_WIDTH, { duration: 200 });
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    }, [buttonTranslateX]);

    const buttonStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: buttonTranslateX.value }],
    }));

    const pages: PageItem[] = [
      { type: 'overview' as const },
      ...cards.map((card, index) => ({ type: 'card' as const, card, index })),
      { type: 'empty' as const },
    ];

    const scrollToCard = useCallback(
      (cardId: string) => {
        const cardIdx = cards.findIndex((c) => c.id === cardId);
        if (cardIdx === -1) return;
        const pageIdx = cardIdx + 1;
        flatListRef.current?.scrollToIndex({ index: pageIdx, animated: true });
      },
      [cards],
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
              contentContainerStyle={[styles.pageContent, { paddingTop: insets.top }]}
              showsVerticalScrollIndicator={false}
            >
              <AllCardsOverview
                cards={cards}
                getNetAvailableCash={getNetAvailableCash}
                getCurrentCycleTxSum={getCurrentCycleTxSum}
                onGanttCardPress={handleGanttCardPress}
                onBannerPress={onBannerPress}
                onAddPress={onAddCard}
              />
            </ScrollView>
          );
        }

        if (item.type === 'empty') {
          return (
            <ScrollView
              style={{ width: PAGE_WIDTH }}
              contentContainerStyle={[styles.pageContent, { paddingTop: insets.top }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.cardWrapper}>
                <EmptyCardFace onPress={onAddCard} />
              </View>
              {hasHiddenCards && (
                <Pressable style={styles.manageLink} onPress={() => router.push('/manage-cards')} accessibilityRole="button" accessibilityLabel="Manage hidden cards">
                  <Text style={[styles.manageLinkText, { color: t.accent }]}>You have hidden cards · Manage Cards</Text>
                </Pressable>
              )}
              <ImpactSkeleton />
            </ScrollView>
          );
        }

        const { card, index } = item;
        const readOnly = isCardReadOnly(index);

        return (
          <ScrollView
            style={{ width: PAGE_WIDTH }}
            contentContainerStyle={[styles.pageContent, { paddingTop: insets.top }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.cardWrapper}>
              <CreditCardFace card={card} netAvailableCash={getNetAvailableCash(card)} currentCycleTxSum={getCurrentCycleTxSum ? getCurrentCycleTxSum(card) : 0} />
              <CardOverlayLayer cardId={card.id} card={card} />
            </View>
            <SwipeImpactPanel card={card} readOnly={readOnly} />
          </ScrollView>
        );
      },
      [cards, getNetAvailableCash, getCurrentCycleTxSum, handleGanttCardPress, hasHiddenCards, insets.top, isCardReadOnly, onAddCard, onBannerPress, t.accent],
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
          onScroll={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            if (isAnimatingOut.current) {
              // Reset once we've scrolled back to overview
              if (offsetX <= 0) isAnimatingOut.current = false;
              return;
            }
            if (offsetX >= SLIDE_IN_THRESHOLD) {
              if (buttonTranslateX.value < 0) {
                buttonTranslateX.value = withTiming(0, { duration: 250 });
              }
            } else {
              if (buttonTranslateX.value > -BUTTON_WIDTH) {
                buttonTranslateX.value = withTiming(-BUTTON_WIDTH, { duration: 200 });
              }
            }
          }}
          scrollEventThrottle={16}
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
        <Animated.View style={[styles.overviewButton, { top: insets.top + 4, backgroundColor: t.surface, shadowColor: t.shadow }, buttonStyle]}>
          <Pressable
            style={styles.overviewButtonInner}
            onPress={scrollToOverview}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="View all cards overview"
          >
            <RNView style={[styles.overviewIconWrap, { backgroundColor: t.surfaceElevated }]}>
              <LayoutGrid size={20} color={t.textMuted} />
            </RNView>
          </Pressable>
        </Animated.View>
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
    marginTop: 68,
    marginBottom: 8,
    paddingBottom: 16,
  },
  manageLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  manageLinkText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  overviewButton: {
    position: 'absolute',
    left: 0,
    width: 56,
    height: 48,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  overviewButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
