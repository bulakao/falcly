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
import { Picker } from '@react-native-picker/picker';

import { Text } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { trackCardAdded, trackOnboardingCardEntryCompleted } from '@/utils/analytics';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Button, Heading } from '@/components/atoms';
import { FormFieldGroup } from '@/components/molecules';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function formatMoney(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length === 2 ? formatted + '.' + parts[1] : formatted;
}

function parseMoney(formatted: string): number {
  return parseFloat(formatted.replace(/,/g, '')) || 0;
}

export default function OnboardingScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const addCard = useCardStore((s) => s.addCard);
  const updateCard = useCardStore((s) => s.updateCard);

  const [onboardingCardId, setOnboardingCardId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [statementDay, setStatementDay] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');

  function handleCreditLimitChange(text: string) {
    setCreditLimit(formatMoney(text));
  }

  function handleOutstandingBalanceChange(text: string) {
    setOutstandingBalance(formatMoney(text));
  }

  function handleSave() {
    if (!accountName.trim()) {
      Alert.alert('Required', 'Enter an account name.');
      return;
    }
    if (statementDay === null) {
      Alert.alert('Required', 'Select your statement day.');
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
        statementDay,
      });
    } else {
      addCard({
        bankName: accountName.trim(),
        creditLimit: limit,
        outstandingBalance: balance,
        statementDay,
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
          placeholder="My BDO Card"
          autoCapitalize="words"
        />

        {/* Statement Day Picker */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Statement Day</Text>
          <Picker
            selectedValue={statementDay}
            onValueChange={(value) => setStatementDay(value)}
            style={{ color: t.textPrimary }}
          >
            <Picker.Item label="Select day" value={null} color={t.placeholder} />
            {DAYS.map((day) => (
              <Picker.Item key={day} label={`Day ${day}`} value={day} color={t.textPrimary} />
            ))}
          </Picker>
        </View>

        {/* Credit Limit */}
        <FormFieldGroup
          label="Credit Limit"
          value={creditLimit}
          onChangeText={handleCreditLimitChange}
          placeholder="50,000"
          keyboardType="decimal-pad"
        />

        {/* Outstanding Balance */}
        <FormFieldGroup
          label="Outstanding Balance"
          value={outstandingBalance}
          onChangeText={handleOutstandingBalanceChange}
          placeholder="0"
          keyboardType="decimal-pad"
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
  fieldGroup: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginBottom: 8,
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
