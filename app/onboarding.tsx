import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { trackCardAdded } from '@/utils/analytics';
import { useAppTheme } from '@/theme';

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
        <Text style={styles.heading}>Add your first card</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          Just 3 fields to see if it&apos;s safe to swipe right now.
        </Text>

        <Text style={[styles.label, { color: t.textSecondary }]}>Statement Day (1–31)</Text>
        <TextInput
          style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }]}
          value={statementDay}
          onChangeText={setStatementDay}
          placeholder="e.g. 15"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          autoFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Credit Limit</Text>
        <TextInput
          style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }]}
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="e.g. 50000"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Outstanding Balance</Text>
        <TextInput
          style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }]}
          value={outstandingBalance}
          onChangeText={setOutstandingBalance}
          placeholder="0"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
        />

        <Pressable style={[styles.saveButton, { backgroundColor: t.primary }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: t.textInverse }]}>See My Status</Text>
        </Pressable>
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
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
