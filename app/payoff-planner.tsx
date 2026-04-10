import { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Pressable, View as RNView } from 'react-native';
import { Stack, router } from 'expo-router';
import { X } from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { FormInput, Label } from '@/components/atoms';
import { PayoffComparisonCard, PayoffTimeline, CardPayoffBreakdown } from '@/components/molecules';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useUserStore } from '@/store/userStore';
import { useCurrency } from '@/hooks/useCurrency';
import { comparePayoffStrategies } from '@/utils/payoffPlanner';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';

export default function PayoffPlannerScreen() {
  const t = useAppTheme();
  const cards = useCardStore((s) => s.cards);
  const tier = useSubscriptionStore((s) => s.tier);
  const isPro = tier === 'pro';
  const { format } = useCurrency();

  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const payoffStrategy = useUserStore((s) => s.payoffStrategy);

  const suggestedBudget = useMemo(() => {
    if (monthlyIncome !== null && committedExpenses !== null && monthlyIncome > committedExpenses) {
      return Math.round(monthlyIncome - committedExpenses);
    }
    return null;
  }, [monthlyIncome, committedExpenses]);

  const [budget, setBudget] = useState(() => suggestedBudget?.toString() ?? '');
  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  const activeCards = useMemo(
    () => cards.filter((c) => c.isActive && c.outstandingBalance > 0),
    [cards],
  );

  const comparison = useMemo(() => {
    const b = parseFloat(budget);
    if (isNaN(b) || b <= 0 || activeCards.length === 0) return null;
    return comparePayoffStrategies(activeCards, b);
  }, [activeCards, budget]);

  const selectedPlan = comparison
    ? selectedStrategy === 'avalanche' ? comparison.avalanche : comparison.snowball
    : null;

  if (!isPro) {
    return (
      <>
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <X size={22} color={t.textPrimary} />
              </Pressable>
            ),
          }}
        />
        <ScrollView style={[styles.screen, { backgroundColor: t.background }]} contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: t.textPrimary }]}>Payoff Planner</Text>
          <Text style={[styles.teaser, { color: t.textSecondary }]}>
            See how fast you can be debt-free with avalanche or snowball strategies.
          </Text>
          <Text style={[styles.teaser, { color: t.textSecondary }]}>
            Compare which saves more money vs which gives you quick wins.
          </Text>
          <Pressable
            style={[styles.upgradeButton, { backgroundColor: t.primary }]}
            onPress={() => router.push('/paywall-manual' as any)}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
          >
            <Text style={[styles.upgradeText, { color: t.textInverse }]}>Upgrade to Pro</Text>
          </Pressable>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <X size={22} color={t.textPrimary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={[styles.screen, { backgroundColor: t.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: t.textPrimary }]}>Payoff Planner</Text>

        {activeCards.length === 0 ? (
          <RNView style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
              {payoffStrategy === 'full' ? 'You pay in full every month' : 'No outstanding balances'}
            </Text>
            <Text style={[styles.empty, { color: t.textSecondary }]}>
              {payoffStrategy === 'full'
                ? 'No carried debt to plan for. Keep it up!'
                : 'All your cards are clear. Nothing to pay off!'}
            </Text>
          </RNView>
        ) : (
          <>
            <Label>Monthly payment budget</Label>
            <FormInput
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              placeholder="e.g., 15000"
              accessibilityLabel="Monthly payment budget"
            />
            {suggestedBudget !== null && budget === suggestedBudget.toString() && (
              <Text style={[styles.budgetHint, { color: t.textMuted }]}>
                Based on your income and expenses
              </Text>
            )}

            {comparison && (
              <>
                <PayoffComparisonCard
                  avalanche={comparison.avalanche}
                  snowball={comparison.snowball}
                  format={format}
                />

                {/* Strategy toggle */}
                <View style={styles.toggleRow}>
                  <Pressable
                    style={[
                      styles.toggleChip,
                      { borderColor: t.border },
                      selectedStrategy === 'avalanche' && { backgroundColor: t.primary, borderColor: t.primary },
                    ]}
                    onPress={() => setSelectedStrategy('avalanche')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedStrategy === 'avalanche' }}
                  >
                    <Text style={[
                      styles.toggleText,
                      { color: t.textPrimary },
                      selectedStrategy === 'avalanche' && { color: t.textInverse },
                    ]}>Avalanche</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleChip,
                      { borderColor: t.border },
                      selectedStrategy === 'snowball' && { backgroundColor: t.primary, borderColor: t.primary },
                    ]}
                    onPress={() => setSelectedStrategy('snowball')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedStrategy === 'snowball' }}
                  >
                    <Text style={[
                      styles.toggleText,
                      { color: t.textPrimary },
                      selectedStrategy === 'snowball' && { color: t.textInverse },
                    ]}>Snowball</Text>
                  </Pressable>
                </View>

                {selectedPlan && (
                  <>
                    <PayoffTimeline plan={selectedPlan} format={format} />

                    <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Per-Card Breakdown</Text>
                    {selectedPlan.cards.map((schedule) => (
                      <CardPayoffBreakdown key={schedule.cardId} schedule={schedule} format={format} />
                    ))}
                  </>
                )}
              </>
            )}

            {budget.length > 0 && !comparison && parseFloat(budget) > 0 && (
              <Text style={[styles.hint, { color: t.caution }]}>
                Budget doesn&apos;t cover minimum payments. Try a higher amount.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
    marginBottom: 12,
  },
  teaser: {
    fontSize: typeScale.body,
    lineHeight: 22,
    marginBottom: 8,
  },
  upgradeButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  upgradeText: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: typeScale.headline,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
    textAlign: 'center',
  },
  empty: {
    fontSize: typeScale.body,
    textAlign: 'center',
  },
  budgetHint: {
    fontSize: typeScale.caption,
    marginTop: 4,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  sectionTitle: {
    fontSize: typeScale.body,
    fontFamily: fonts.interBold,
    marginBottom: 10,
  },
  hint: {
    fontSize: typeScale.body,
    textAlign: 'center',
    marginTop: 16,
  },
});
