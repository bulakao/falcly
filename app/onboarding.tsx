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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { trackCardAdded, trackOnboardingCardEntryCompleted } from '@/utils/analytics';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Button, Heading } from '@/components/atoms';
import { DayInput, FormFieldGroup, MoneyInput, parseMoney } from '@/components/molecules';


export default function OnboardingScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const addCard = useCardStore((s) => s.addCard);
  const updateCard = useCardStore((s) => s.updateCard);

  const [onboardingCardId, setOnboardingCardId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');


  function handleSave() {
    if (!accountName.trim()) {
      Alert.alert('Required', 'Enter an account name.');
      return;
    }
    const stmtDay = parseInt(statementDay, 10);
    if (isNaN(stmtDay) || stmtDay < 1 || stmtDay > 31) {
      Alert.alert('Required', 'Enter a valid statement day (1–31).');
      return;
    }
    const limit = parseMoney(creditLimit);

    if (limit <= 0) {
      Alert.alert('Required', 'Enter a valid credit limit.');
      return;
    }

    const balance = parseMoney(outstandingBalance);

    let cardId = onboardingCardId;

    if (cardId) {
      // Update existing onboarding card instead of creating a duplicate
      updateCard(cardId, {
        bankName: accountName.trim(),
        creditLimit: limit,
        outstandingBalance: balance,
        statementDay: stmtDay,
      });
    } else {
      addCard({
        bankName: accountName.trim(),
        creditLimit: limit,
        outstandingBalance: balance,
        statementDay: stmtDay,
        dueDayOffset: cardDefaults.dueDayOffset,
        interestRate: cardDefaults.interestRate,
        minPaymentPct: cardDefaults.minPaymentPct,
        minPaymentFloor: cardDefaults.minPaymentFloor,
      });
      const cards = useCardStore.getState().cards;
      cardId = cards[cards.length - 1].id;
      setOnboardingCardId(cardId);
      trackCardAdded('onboarding');
    }

    trackOnboardingCardEntryCompleted(accountName.trim(), balance > 0);
    useOnboardingStore.getState().setStep('first_status');
    router.push({ pathname: '/onboarding-result', params: { cardId } });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: t.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 56 }]} keyboardShouldPersistTaps="handled">
        <Heading>Add your first card</Heading>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          We just need a few details to see if it&apos;s safe to swipe.
        </Text>

        {/* Account Name */}
        <FormFieldGroup
          label="Account Name"
          value={accountName}
          onChangeText={setAccountName}
          placeholder="My Credit Card"
          autoCapitalize="words"
        />

        {/* Statement Day */}
        <DayInput value={statementDay} onChangeText={setStatementDay} />

        {/* Credit Limit */}
        <MoneyInput
          label="Credit Limit"
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="50,000"
        />

        {/* Outstanding Balance */}
        <MoneyInput
          label="Outstanding Balance"
          value={outstandingBalance}
          onChangeText={setOutstandingBalance}
          placeholder="1,000"
        />
        <Text style={[styles.hint, { color: t.textMuted }]}>
          Approximate is fine — you can update anytime.
        </Text>

      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="See My Status" onPress={handleSave} />
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    marginTop: -16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
