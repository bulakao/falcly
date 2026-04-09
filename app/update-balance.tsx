import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { Button, FormInput, Caption } from '@/components/atoms';
import { useCurrency } from '@/hooks/useCurrency';

export default function UpdateBalanceScreen() {
  const t = useAppTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const updateBalance = useCardStore((s) => s.updateBalance);
  const { format } = useCurrency(card);
  const [balanceText, setBalanceText] = useState(
    card ? String(card.outstandingBalance) : '',
  );

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Card not found</Text>
      </View>
    );
  }

  function handleConfirm() {
    const value = parseFloat(balanceText);
    if (isNaN(value) || value < 0) return;
    updateBalance(card!.id, value);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>{card.bankName}</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>Enter your current outstanding balance</Text>

        <FormInput
          value={balanceText}
          onChangeText={setBalanceText}
          placeholder="0"
          keyboardType="numeric"
          autoFocus
          selectTextOnFocus
          accessibilityLabel="Outstanding balance"
        />

        <View style={styles.hintWrapper}>
          <Caption>Current: {format(card.outstandingBalance)}</Caption>
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            label="Update Balance"
            onPress={handleConfirm}
            disabled={!balanceText || isNaN(parseFloat(balanceText))}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingTop: 32,
  },
  heading: {
    fontSize: typeScale.title2,
    fontFamily: fonts.interBold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typeScale.body,
    marginBottom: 24,
  },
  hintWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  buttonWrapper: {
    marginTop: 0,
  },
});
