import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { trackCardAdded } from '@/utils/analytics';
import { useAppTheme } from '@/theme';
import { Button, Heading } from '@/components/atoms';
import { FormFieldGroup } from '@/components/molecules';

export default function OnboardingScreen() {
  const t = useAppTheme();
  const addCard = useCardStore((s) => s.addCard);

  const [statementDay, setStatementDay] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');

  function handleSave() {
    const stmtDay = parseInt(statementDay, 10);
    const limit = parseFloat(creditLimit);
    const balance = parseFloat(outstandingBalance) || 0;

    if (isNaN(stmtDay) || stmtDay < 1 || stmtDay > 31) {
      Alert.alert('Required', 'Enter a valid statement day (1–31).');
      return;
    }
    if (isNaN(limit) || limit <= 0) {
      Alert.alert('Required', 'Enter a valid credit limit.');
      return;
    }

    addCard({
      bankName: 'My Card',
      creditLimit: limit,
      outstandingBalance: balance,
      statementDay: stmtDay,
      dueDayOffset: cardDefaults.dueDayOffset,
      interestRate: cardDefaults.interestRate,
      minPaymentPct: cardDefaults.minPaymentPct,
      minPaymentFloor: cardDefaults.minPaymentFloor,
    });
    trackCardAdded('onboarding');

    // Navigate to result screen showing first status
    const cards = useCardStore.getState().cards;
    const newCard = cards[cards.length - 1];
    router.replace({ pathname: '/onboarding-result', params: { cardId: newCard.id } });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Heading>Add your first card</Heading>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          Just 3 fields to see if it&apos;s safe to swipe right now.
        </Text>

        <FormFieldGroup
          label="Statement Day (1-31)"
          value={statementDay}
          onChangeText={setStatementDay}
          placeholder="e.g. 15"
          keyboardType="numeric"
          autoFocus
        />

        <FormFieldGroup
          label="Credit Limit"
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="e.g. 50000"
          keyboardType="numeric"
        />

        <FormFieldGroup
          label="Outstanding Balance"
          value={outstandingBalance}
          onChangeText={setOutstandingBalance}
          placeholder="0"
          keyboardType="numeric"
        />

        <View style={styles.buttonWrapper}>
          <Button label="See My Status" onPress={handleSave} />
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
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    marginTop: -16,
  },
  buttonWrapper: {
    marginTop: 32,
  },
});
