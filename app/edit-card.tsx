import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { Button, Heading } from '@/components/atoms';
import { FormFieldGroup } from '@/components/molecules';
import { fonts } from '@/theme/fonts';

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
        <Text style={styles.notFound}>Card not found</Text>
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
        <Heading>Edit Card</Heading>

        <FormFieldGroup
          label="Bank Name"
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. BDO, BPI, Metrobank"
        />

        <FormFieldGroup
          label="Credit Limit"
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="e.g. 50000"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Statement Day (1-31)"
          value={statementDay}
          onChangeText={setStatementDay}
          placeholder="e.g. 15"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Due Day Offset (days after statement)"
          value={dueDayOffset}
          onChangeText={setDueDayOffset}
          placeholder={String(cardDefaults.dueDayOffset)}
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Interest Rate (% per month)"
          value={interestRate}
          onChangeText={setInterestRate}
          placeholder="2"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Min Payment (%)"
          value={minPaymentPct}
          onChangeText={setMinPaymentPct}
          placeholder="5"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Min Payment Floor (PHP)"
          value={minPaymentFloor}
          onChangeText={setMinPaymentFloor}
          placeholder="500"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Annual Fee (PHP)"
          value={annualFee}
          onChangeText={setAnnualFee}
          placeholder="0"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Annual Fee Month (1-12, 0 = none)"
          value={annualFeeMonth}
          onChangeText={setAnnualFeeMonth}
          placeholder="0"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Pending Transactions (PHP)"
          value={pendingTransactions}
          onChangeText={setPendingTransactions}
          placeholder="0"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Monthly Installments (PHP)"
          value={installmentsMonthlyAmount}
          onChangeText={setInstallmentsMonthlyAmount}
          placeholder="0"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Subscriptions This Cycle (PHP)"
          value={subscriptionsThisCycle}
          onChangeText={setSubscriptionsThisCycle}
          placeholder="0"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <View style={styles.buttonWrapper}>
          <Button label="Save Changes" onPress={handleSave} />
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
  notFound: {
    fontSize: 24,
    fontFamily: fonts.interBold,
    marginBottom: 24,
  },
  buttonWrapper: {
    marginTop: 32,
  },
});
