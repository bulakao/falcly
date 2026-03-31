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
import { router, useLocalSearchParams } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { useAppTheme } from '@/theme';

export default function EditCardScreen() {
  const t = useAppTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const updateCard = useCardStore((s) => s.updateCard);

  const [bankName, setBankName] = useState(card?.bankName ?? '');
  const [creditLimit, setCreditLimit] = useState(String(card?.creditLimit ?? ''));
  const [statementDay, setStatementDay] = useState(String(card?.statementDay ?? ''));
  const [dueDayOffset, setDueDayOffset] = useState(String(card?.dueDayOffset ?? cardDefaults.dueDayOffset));
  const [interestRate, setInterestRate] = useState(String((card?.interestRate ?? cardDefaults.interestRate) * 100));
  const [minPaymentPct, setMinPaymentPct] = useState(String((card?.minPaymentPct ?? cardDefaults.minPaymentPct) * 100));
  const [minPaymentFloor, setMinPaymentFloor] = useState(String(card?.minPaymentFloor ?? cardDefaults.minPaymentFloor));
  const [annualFee, setAnnualFee] = useState(String(card?.annualFee ?? 0));
  const [annualFeeMonth, setAnnualFeeMonth] = useState(String(card?.annualFeeMonth ?? 0));
  const [pendingTransactions, setPendingTransactions] = useState(String(card?.pendingTransactions ?? 0));
  const [installmentsMonthlyAmount, setInstallmentsMonthlyAmount] = useState(String(card?.installmentsMonthlyAmount ?? 0));
  const [subscriptionsThisCycle, setSubscriptionsThisCycle] = useState(String(card?.subscriptionsThisCycle ?? 0));

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Card not found</Text>
      </View>
    );
  }

  function handleSave() {
    const limit = parseFloat(creditLimit);
    const stmtDay = parseInt(statementDay, 10);

    if (!bankName.trim()) {
      Alert.alert('Required', 'Enter the bank name.');
      return;
    }
    if (isNaN(limit) || limit <= 0) {
      Alert.alert('Required', 'Enter a valid credit limit.');
      return;
    }
    if (isNaN(stmtDay) || stmtDay < 1 || stmtDay > 31) {
      Alert.alert('Required', 'Enter a valid statement day (1–31).');
      return;
    }

    const offset = parseInt(dueDayOffset, 10);
    const rate = parseFloat(interestRate);
    const pct = parseFloat(minPaymentPct);
    const floor = parseFloat(minPaymentFloor);
    const aFee = parseFloat(annualFee) || 0;
    const aFeeMonth = parseInt(annualFeeMonth, 10) || 0;
    const pending = parseFloat(pendingTransactions) || 0;
    const installments = parseFloat(installmentsMonthlyAmount) || 0;
    const subs = parseFloat(subscriptionsThisCycle) || 0;

    updateCard(card!.id, {
      bankName: bankName.trim(),
      creditLimit: limit,
      statementDay: stmtDay,
      dueDayOffset: isNaN(offset) ? cardDefaults.dueDayOffset : offset,
      interestRate: isNaN(rate) ? cardDefaults.interestRate : rate / 100,
      minPaymentPct: isNaN(pct) ? cardDefaults.minPaymentPct : pct / 100,
      minPaymentFloor: isNaN(floor) ? cardDefaults.minPaymentFloor : floor,
      annualFee: aFee,
      annualFeeMonth: aFeeMonth,
      pendingTransactions: pending,
      installmentsMonthlyAmount: installments,
      subscriptionsThisCycle: subs,
    });

    router.back();
  }

  const inputStyle = [styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Edit Card</Text>

        <Text style={[styles.label, { color: t.textSecondary }]}>Bank Name</Text>
        <TextInput
          style={inputStyle}
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. BDO, BPI, Metrobank"
          placeholderTextColor={t.placeholder}
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Credit Limit</Text>
        <TextInput
          style={inputStyle}
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="e.g. 50000"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Statement Day (1–31)</Text>
        <TextInput
          style={inputStyle}
          value={statementDay}
          onChangeText={setStatementDay}
          placeholder="e.g. 15"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Due Day Offset (days after statement)</Text>
        <TextInput
          style={inputStyle}
          value={dueDayOffset}
          onChangeText={setDueDayOffset}
          placeholder={String(cardDefaults.dueDayOffset)}
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Interest Rate (% per month)</Text>
        <TextInput
          style={inputStyle}
          value={interestRate}
          onChangeText={setInterestRate}
          placeholder="2"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Min Payment (%)</Text>
        <TextInput
          style={inputStyle}
          value={minPaymentPct}
          onChangeText={setMinPaymentPct}
          placeholder="5"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Min Payment Floor (₱)</Text>
        <TextInput
          style={inputStyle}
          value={minPaymentFloor}
          onChangeText={setMinPaymentFloor}
          placeholder="500"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Annual Fee (₱)</Text>
        <TextInput
          style={inputStyle}
          value={annualFee}
          onChangeText={setAnnualFee}
          placeholder="0"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Annual Fee Month (1–12, 0 = none)</Text>
        <TextInput
          style={inputStyle}
          value={annualFeeMonth}
          onChangeText={setAnnualFeeMonth}
          placeholder="0"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Pending Transactions (₱)</Text>
        <TextInput
          style={inputStyle}
          value={pendingTransactions}
          onChangeText={setPendingTransactions}
          placeholder="0"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Monthly Installments (₱)</Text>
        <TextInput
          style={inputStyle}
          value={installmentsMonthlyAmount}
          onChangeText={setInstallmentsMonthlyAmount}
          placeholder="0"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Subscriptions This Cycle (₱)</Text>
        <TextInput
          style={inputStyle}
          value={subscriptionsThisCycle}
          onChangeText={setSubscriptionsThisCycle}
          placeholder="0"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Pressable style={[styles.saveButton, { backgroundColor: t.primary }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: t.textInverse }]}>Save Changes</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
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
