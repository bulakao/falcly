import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useInstallmentStore } from '@/store/installmentStore';
import { useSubscriptionItemStore } from '@/store/subscriptionItemStore';
import { useAppTheme } from '@/theme';
import { DEFAULT_DUE_DAY_OFFSET } from '@/types/card';
import { Button, Heading, Label } from '@/components/atoms';
import { BankPicker, FormFieldGroup } from '@/components/molecules';
import { fonts } from '@/theme/fonts';

export default function EditCardScreen() {
  const t = useAppTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const hasDetailedInstallments = useInstallmentStore((s) => s.installments.some((i) => i.cardId === cardId));
  const hasDetailedSubscriptions = useSubscriptionItemStore((s) => s.subscriptions.some((s) => s.cardId === cardId));
  const updateCard = useCardStore((s) => s.updateCard);
  const defaultInterestRate = useUserStore((s) => s.defaultInterestRate);
  const defaultMinPaymentPct = useUserStore((s) => s.defaultMinPaymentPct);
  const defaultMinPaymentFloor = useUserStore((s) => s.defaultMinPaymentFloor);

  const [bankName, setBankName] = useState(card?.bankName ?? '');
  const [creditLimit, setCreditLimit] = useState(String(card?.creditLimit ?? ''));
  const [statementDay, setStatementDay] = useState(String(card?.statementDay ?? ''));
  const [dueDayOffset, setDueDayOffset] = useState(String(card?.dueDayOffset ?? DEFAULT_DUE_DAY_OFFSET));
  const [interestRate, setInterestRate] = useState(String((card?.interestRate ?? defaultInterestRate) * 100));
  const [minPaymentPct, setMinPaymentPct] = useState(String((card?.minPaymentPct ?? defaultMinPaymentPct) * 100));
  const [minPaymentFloor, setMinPaymentFloor] = useState(String(card?.minPaymentFloor ?? defaultMinPaymentFloor));
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
      Alert.alert('Required', 'Enter the card name.');
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
    if (!isNaN(offset) && offset < 20) {
      Alert.alert(
        'Due Date Too Soon',
        'BSP regulations require at least 20 days between your statement date and payment due date. Please enter 20 or more.',
      );
      return;
    }
    const rate = parseFloat(interestRate);
    const pct = parseFloat(minPaymentPct);
    const floor = parseFloat(minPaymentFloor);
    const aFee = parseFloat(annualFee) || 0;
    const aFeeMonth = parseInt(annualFeeMonth, 10) || 0;
    const pending = parseFloat(pendingTransactions) || 0;
    const installments = parseFloat(installmentsMonthlyAmount) || 0;
    const subs = parseFloat(subscriptionsThisCycle) || 0;

    const finalRate = isNaN(rate) ? defaultInterestRate : rate / 100;
    const finalPct = isNaN(pct) ? defaultMinPaymentPct : pct / 100;
    const finalFloor = isNaN(floor) ? defaultMinPaymentFloor : floor;
    const customFinancials =
      finalRate !== defaultInterestRate ||
      finalPct !== defaultMinPaymentPct ||
      finalFloor !== defaultMinPaymentFloor;

    updateCard(card!.id, {
      bankName: bankName.trim(),
      creditLimit: limit,
      statementDay: stmtDay,
      dueDayOffset: isNaN(offset) ? DEFAULT_DUE_DAY_OFFSET : offset,
      interestRate: finalRate,
      minPaymentPct: finalPct,
      minPaymentFloor: finalFloor,
      customFinancials,
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

        <View style={styles.fieldGroup}>
          <Label>Card Name</Label>
          <BankPicker
            value={bankName}
            onSelect={setBankName}
            placeholder="BDO, BPI, Metrobank"
          />
        </View>

        <FormFieldGroup
          label="Credit Limit"
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="50,000"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Statement Day (1-31)"
          value={statementDay}
          onChangeText={setStatementDay}
          placeholder="15"
          keyboardType="numeric"
          selectTextOnFocus
        />

        <FormFieldGroup
          label="Due Day Offset (days after statement)"
          value={dueDayOffset}
          onChangeText={setDueDayOffset}
          placeholder={String(DEFAULT_DUE_DAY_OFFSET)}
          keyboardType="numeric"
          selectTextOnFocus
          hint="Minimum 20 days (BSP regulation). Most PH banks use 20–25 days."
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

        {hasDetailedInstallments ? (
          <Pressable onPress={() => router.push({ pathname: '/manage-installments', params: { cardId } })} style={styles.managedField}>
            <Text style={[styles.managedLabel, { color: t.textSecondary }]}>Monthly Installments</Text>
            <Text style={[styles.managedValue, { color: t.textPrimary }]}>₱{card!.installmentsMonthlyAmount.toLocaleString()}</Text>
            <Text style={[styles.managedHint, { color: t.primary }]}>Manage items →</Text>
          </Pressable>
        ) : (
          <FormFieldGroup
            label="Monthly Installments (PHP)"
            value={installmentsMonthlyAmount}
            onChangeText={setInstallmentsMonthlyAmount}
            placeholder="0"
            keyboardType="numeric"
            selectTextOnFocus
          />
        )}

        {hasDetailedSubscriptions ? (
          <Pressable onPress={() => router.push({ pathname: '/manage-subscriptions', params: { cardId } })} style={styles.managedField}>
            <Text style={[styles.managedLabel, { color: t.textSecondary }]}>Subscriptions This Cycle</Text>
            <Text style={[styles.managedValue, { color: t.textPrimary }]}>₱{card!.subscriptionsThisCycle.toLocaleString()}</Text>
            <Text style={[styles.managedHint, { color: t.primary }]}>Manage items →</Text>
          </Pressable>
        ) : (
          <FormFieldGroup
            label="Subscriptions This Cycle (PHP)"
            value={subscriptionsThisCycle}
            onChangeText={setSubscriptionsThisCycle}
            placeholder="0"
            keyboardType="numeric"
            selectTextOnFocus
          />
        )}

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
  fieldGroup: {
    marginTop: 16,
  },
  managedField: {
    marginTop: 16,
    paddingVertical: 12,
  },
  managedLabel: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  managedValue: {
    fontSize: 20,
    fontFamily: fonts.interBold,
  },
  managedHint: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginTop: 4,
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
