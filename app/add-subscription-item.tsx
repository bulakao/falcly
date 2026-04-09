import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionItemStore } from '@/store/subscriptionItemStore';
import { Button } from '@/components/atoms';
import { FormFieldGroup, MoneyInput, parseMoney } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import type { SubscriptionFrequency } from '@/types/subscription-item';

const FREQUENCIES: { label: string; value: SubscriptionFrequency }[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Annual', value: 'annual' },
];

export default function AddSubscriptionItemScreen() {
  const t = useAppTheme();
  const { cardId: preselectedCardId } = useLocalSearchParams<{ cardId?: string }>();
  const cards = useCardStore((s) => s.cards);
  const addSubscription = useSubscriptionItemStore((s) => s.addSubscription);

  const [cardId, setCardId] = useState(preselectedCardId ?? cards[0]?.id ?? '');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly');

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Enter the subscription name.');
      return;
    }
    if (!cardId) {
      Alert.alert('Required', 'Select a card.');
      return;
    }
    const amt = parseMoney(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Required', 'Enter a valid amount.');
      return;
    }
    const day = parseInt(billingDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Required', 'Enter a valid billing day (1–31).');
      return;
    }

    addSubscription({
      cardId,
      name: name.trim(),
      amount: amt,
      billingDay: day,
      frequency,
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <FormFieldGroup
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Netflix, Spotify, Gym, etc."
          autoFocus
        />

        {cards.length > 1 && (
          <>
            <Text style={[styles.label, { color: t.textSecondary }]}>Card</Text>
            <View style={styles.cardPicker}>
              {cards.filter((c) => c.isActive).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCardId(c.id)}
                  style={[
                    styles.cardChip,
                    { borderColor: cardId === c.id ? t.primary : t.border, backgroundColor: cardId === c.id ? t.accentBg : 'transparent' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={c.bankName}
                  accessibilityState={{ selected: cardId === c.id }}
                >
                  <Text style={[styles.cardChipText, { color: cardId === c.id ? t.primary : t.textPrimary }]}>
                    {c.bankName}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <MoneyInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="549"
        />

        <FormFieldGroup
          label="Billing Day (1–31)"
          value={billingDay}
          onChangeText={setBillingDay}
          placeholder="15"
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Frequency</Text>
        <View style={styles.freqRow}>
          {FREQUENCIES.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setFrequency(f.value)}
              style={[
                styles.freqChip,
                { borderColor: frequency === f.value ? t.primary : t.border, backgroundColor: frequency === f.value ? t.accentBg : 'transparent' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={f.label}
              accessibilityState={{ selected: frequency === f.value }}
            >
              <Text style={[styles.freqChipText, { color: frequency === f.value ? t.primary : t.textPrimary }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.buttonWrapper}>
          <Button label="Add Subscription" onPress={handleSave} />
        </View>
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
  label: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interSemiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  cardPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardChipText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  freqChipText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  buttonWrapper: {
    marginTop: 32,
  },
});
