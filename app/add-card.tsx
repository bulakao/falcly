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

export default function AddCardScreen() {
  const t = useAppTheme();
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
        <Text style={styles.heading}>Add Card</Text>

        <Text style={[styles.label, { color: t.textSecondary }]}>Bank Name</Text>
        <TextInput
          style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }]}
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. BDO, BPI, Metrobank"
          placeholderTextColor={t.placeholder}
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

        <Text style={[styles.label, { color: t.textSecondary }]}>Statement Day (1–31)</Text>
        <TextInput
          style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }]}
          value={statementDay}
          onChangeText={setStatementDay}
          placeholder="e.g. 15"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: t.textSecondary }]}>Due Day Offset (days after statement)</Text>
        <TextInput
          style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }]}
          value={dueDayOffset}
          onChangeText={setDueDayOffset}
          placeholder={String(cardDefaults.dueDayOffset)}
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
        />

        <Pressable style={[styles.saveButton, { backgroundColor: t.primary }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: t.textInverse }]}>Save Card</Text>
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
