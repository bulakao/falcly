import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { CreditCardFace } from '@/components/atoms';
import { SwipeImpactPanel } from '@/components/organisms';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { computeNetAvailableCash } from '@/utils/decisionEngine';

export default function SwipeImpactScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const cards = useCardStore((s) => s.cards);
  const card = cards.find((c) => c.id === cardId);
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  const router = useRouter();
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const isCardReadOnly = useSubscriptionStore((s) => s.isCardReadOnly);

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Card not found</Text>
      </View>
    );
  }

  const readOnly = isCardReadOnly(cardIndex);
  const netAvailableCash = computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <CreditCardFace card={card} netAvailableCash={netAvailableCash} />
        <SwipeImpactPanel
          card={card}
          readOnly={readOnly}
          autoFocusInput
          onDeleteComplete={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
});
