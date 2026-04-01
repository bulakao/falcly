import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { trackCardAdded, trackOnboardingCardEntryCompleted } from '@/utils/analytics';
import { useAppTheme } from '@/theme';
import { Button, Heading } from '@/components/atoms';
import { FormFieldGroup } from '@/components/molecules';

const BANKS = [
  { slug: 'bdo', name: 'BDO', color: '#003087' },
  { slug: 'bpi', name: 'BPI', color: '#D42027' },
  { slug: 'metrobank', name: 'Metrobank', color: '#003366' },
  { slug: 'rcbc', name: 'RCBC', color: '#008744' },
  { slug: 'unionbank', name: 'UnionBank', color: '#F7941D' },
  { slug: 'security_bank', name: 'Security Bank', color: '#E31837' },
  { slug: 'chinabank', name: 'Chinabank', color: '#CC0000' },
  { slug: 'eastwest', name: 'EastWest', color: '#002855' },
  { slug: 'other', name: 'Other', color: '#888888' },
];

export default function OnboardingScreen() {
  const t = useAppTheme();
  const addCard = useCardStore((s) => s.addCard);

  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [statementDay, setStatementDay] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');

  function handleSave() {
    if (!selectedBank) {
      Alert.alert('Required', 'Select your bank.');
      return;
    }
    if (statementDay === null) {
      Alert.alert('Required', 'Select your statement day.');
      return;
    }
    const limit = parseFloat(creditLimit);
    const balance = parseFloat(outstandingBalance) || 0;

    if (isNaN(limit) || limit <= 0) {
      Alert.alert('Required', 'Enter a valid credit limit.');
      return;
    }

    const bank = BANKS.find((b) => b.slug === selectedBank);

    addCard({
      bankName: bank?.name ?? 'My Card',
      creditLimit: limit,
      outstandingBalance: balance,
      statementDay,
      dueDayOffset: cardDefaults.dueDayOffset,
      interestRate: cardDefaults.interestRate,
      minPaymentPct: cardDefaults.minPaymentPct,
      minPaymentFloor: cardDefaults.minPaymentFloor,
    });
    trackCardAdded('onboarding');
    trackOnboardingCardEntryCompleted(bank?.name ?? 'Other', balance > 0);

    useOnboardingStore.getState().setStep('first_status');

    const cards = useCardStore.getState().cards;
    const newCard = cards[cards.length - 1];
    router.replace({ pathname: '/onboarding-result', params: { cardId: newCard.id } });
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Heading>Add your first card</Heading>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          We just need 3 things to see if it&apos;s safe to swipe.
        </Text>

        {/* Bank Picker */}
        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Bank</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankRow} contentContainerStyle={styles.bankRowContent}>
          {BANKS.map((bank) => {
            const isSelected = selectedBank === bank.slug;
            return (
              <Pressable key={bank.slug} onPress={() => setSelectedBank(bank.slug)} style={styles.bankItem}>
                <View
                  style={[
                    styles.bankBadge,
                    { backgroundColor: bank.color },
                    isSelected && { borderColor: t.primary, borderWidth: 3 },
                  ]}
                >
                  <Text style={styles.bankInitial}>
                    {isSelected ? '✓' : bank.name.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.bankName, { color: isSelected ? t.textPrimary : t.textMuted }]} numberOfLines={1}>
                  {bank.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Statement Day Picker */}
        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Statement Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow} contentContainerStyle={styles.dayRowContent}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const isSelected = statementDay === day;
            return (
              <Pressable
                key={day}
                onPress={() => setStatementDay(day)}
                style={[
                  styles.dayButton,
                  { backgroundColor: isSelected ? t.primary : t.surface, borderColor: isSelected ? t.primary : t.border },
                ]}
              >
                <Text style={[styles.dayText, { color: isSelected ? t.primaryText : t.textPrimary }]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Credit Limit */}
        <FormFieldGroup
          label="Credit Limit (₱)"
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="e.g. 50000"
          keyboardType="numeric"
        />

        {/* Outstanding Balance */}
        <FormFieldGroup
          label="Outstanding Balance (₱)"
          value={outstandingBalance}
          onChangeText={setOutstandingBalance}
          placeholder="0"
          keyboardType="numeric"
        />
        <Text style={[styles.hint, { color: t.textMuted }]}>
          Approximate is fine — you can update anytime.
        </Text>

        <View style={styles.buttonWrapper}>
          <Button label="See My Status →" onPress={handleSave} />
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  bankRow: {
    marginBottom: 8,
  },
  bankRowContent: {
    gap: 12,
    paddingRight: 12,
  },
  bankItem: {
    alignItems: 'center',
    width: 64,
  },
  bankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bankInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  bankName: {
    fontSize: 11,
    textAlign: 'center',
  },
  dayRow: {
    marginBottom: 8,
  },
  dayRowContent: {
    gap: 8,
    paddingRight: 12,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonWrapper: {
    marginTop: 32,
  },
});
