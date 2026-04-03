import {
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  View as RNView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionItemStore } from '@/store/subscriptionItemStore';
import { Button } from '@/components/atoms';
import { SurfaceCard } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

function nextBillingDate(billingDay: number): string {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), billingDay);
  const target = thisMonth >= today ? thisMonth : new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
  return target.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

export default function ManageSubscriptionsScreen() {
  const t = useAppTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const subscriptions = useSubscriptionItemStore((s) => s.subscriptions.filter((s) => s.cardId === cardId));
  const deleteSubscription = useSubscriptionItemStore((s) => s.deleteSubscription);

  if (!card) {
    return (
      <RNView style={[styles.container, { backgroundColor: t.background }]}>
        <Text>Card not found</Text>
      </RNView>
    );
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Delete Subscription', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSubscription(id) },
    ]);
  }

  const active = subscriptions.filter((s) => s.isActive);

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.subtitle, { color: t.textMuted }]}>
        {card.bankName} · {active.length} active
      </Text>

      {active.length === 0 && (
        <SurfaceCard>
          <Text style={[styles.emptyText, { color: t.textMuted }]}>
            No subscriptions yet. Add one to track recurring charges.
          </Text>
        </SurfaceCard>
      )}

      {active.map((sub) => (
        <SurfaceCard key={sub.id}>
          <RNView style={styles.row}>
            <RNView style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: t.textPrimary }]}>{sub.name}</Text>
              <Text style={[styles.itemDetail, { color: t.textMuted }]}>
                {FREQ_LABELS[sub.frequency]} · Next: {nextBillingDate(sub.billingDay)}
              </Text>
            </RNView>
            <Text style={[styles.amount, { color: t.textPrimary }]}>
              ₱{sub.amount.toLocaleString()}
            </Text>
          </RNView>
          <RNView style={[styles.row, { marginTop: 8 }]}>
            <Text style={[styles.itemDetail, { color: t.textMuted }]}>
              Bills on day {sub.billingDay}
            </Text>
            <Pressable onPress={() => handleDelete(sub.id, sub.name)} hitSlop={8}>
              <Text style={[styles.deleteText, { color: t.risky }]}>Remove</Text>
            </Pressable>
          </RNView>
        </SurfaceCard>
      ))}

      <RNView style={styles.buttonWrapper}>
        <Button
          label="Add Subscription"
          onPress={() => router.push({ pathname: '/add-subscription-item', params: { cardId } })}
        />
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.interRegular,
    textAlign: 'center',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
  itemDetail: {
    fontSize: 13,
    fontFamily: fonts.interRegular,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontFamily: fonts.interBold,
  },
  deleteText: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
  },
  buttonWrapper: {
    marginTop: 24,
  },
});
