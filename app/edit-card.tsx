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

export default function EditCardScreen() {
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Edit Card</Text>

        <Text style={styles.label}>Bank Name</Text>
        <TextInput
          style={styles.input}
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. BDO, BPI, Metrobank"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Credit Limit</Text>
        <TextInput
          style={styles.input}
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="e.g. 50000"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Statement Day (1–31)</Text>
        <TextInput
          style={styles.input}
          value={statementDay}
          onChangeText={setStatementDay}
          placeholder="e.g. 15"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Due Day Offset (days after statement)</Text>
        <TextInput
          style={styles.input}
          value={dueDayOffset}
          onChangeText={setDueDayOffset}
          placeholder={String(cardDefaults.dueDayOffset)}
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Interest Rate (% per month)</Text>
        <TextInput
          style={styles.input}
          value={interestRate}
          onChangeText={setInterestRate}
          placeholder="2"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Min Payment (%)</Text>
        <TextInput
          style={styles.input}
          value={minPaymentPct}
          onChangeText={setMinPaymentPct}
          placeholder="5"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Min Payment Floor (₱)</Text>
        <TextInput
          style={styles.input}
          value={minPaymentFloor}
          onChangeText={setMinPaymentFloor}
          placeholder="500"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Annual Fee (₱)</Text>
        <TextInput
          style={styles.input}
          value={annualFee}
          onChangeText={setAnnualFee}
          placeholder="0"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Annual Fee Month (1–12, 0 = none)</Text>
        <TextInput
          style={styles.input}
          value={annualFeeMonth}
          onChangeText={setAnnualFeeMonth}
          placeholder="0"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Pending Transactions (₱)</Text>
        <TextInput
          style={styles.input}
          value={pendingTransactions}
          onChangeText={setPendingTransactions}
          placeholder="0"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Monthly Installments (₱)</Text>
        <TextInput
          style={styles.input}
          value={installmentsMonthlyAmount}
          onChangeText={setInstallmentsMonthlyAmount}
          placeholder="0"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Text style={styles.label}>Subscriptions This Cycle (₱)</Text>
        <TextInput
          style={styles.input}
          value={subscriptionsThisCycle}
          onChangeText={setSubscriptionsThisCycle}
          placeholder="0"
          placeholderTextColor="#999"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
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
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#000',
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
