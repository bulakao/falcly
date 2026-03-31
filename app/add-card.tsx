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

import { useCardStore, cardDefaults } from '@/store/cardStore';
import { trackCardAdded } from '@/utils/analytics';
import { Button, Heading } from '@/components/atoms';
import { FormFieldGroup } from '@/components/molecules';

export default function AddCardScreen() {
  const addCard = useCardStore((s) => s.addCard);

  const [bankName, setBankName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDayOffset, setDueDayOffset] = useState(String(cardDefaults.dueDayOffset));

  function handleSave() {
    const limit = parseFloat(creditLimit);
    const balance = parseFloat(outstandingBalance) || 0;
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

    addCard({
      bankName: bankName.trim(),
      creditLimit: limit,
      outstandingBalance: balance,
      statementDay: stmtDay,
      dueDayOffset: isNaN(offset) ? cardDefaults.dueDayOffset : offset,
      interestRate: cardDefaults.interestRate,
      minPaymentPct: cardDefaults.minPaymentPct,
      minPaymentFloor: cardDefaults.minPaymentFloor,
    });
    trackCardAdded('manual_add');

    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Heading>Add Card</Heading>

        <FormFieldGroup
          label="Bank Name"
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. BDO, BPI, Metrobank"
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

        <FormFieldGroup
          label="Statement Day (1-31)"
          value={statementDay}
          onChangeText={setStatementDay}
          placeholder="e.g. 15"
          keyboardType="numeric"
        />

        <FormFieldGroup
          label="Due Day Offset (days after statement)"
          value={dueDayOffset}
          onChangeText={setDueDayOffset}
          placeholder={String(cardDefaults.dueDayOffset)}
          keyboardType="numeric"
        />

        <View style={styles.buttonWrapper}>
          <Button label="Add Card" onPress={handleSave} />
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
  buttonWrapper: {
    marginTop: 32,
  },
});
