import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { trackCardAdded } from '@/utils/analytics';
import { Button } from '@/components/atoms';
import { DayInput, FormFieldGroup, MoneyInput, parseMoney } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

export default function AddCardScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const addCard = useCardStore((s) => s.addCard);

  const [bankName, setBankName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDayOffset, setDueDayOffset] = useState(String(cardDefaults.dueDayOffset));

  function handleSave() {
    const limit = parseMoney(creditLimit);
    const balance = parseMoney(outstandingBalance);
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
      style={[styles.flex, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header: Cancel | Title | Save */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.headerAction, { color: t.primary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Add Card</Text>
        <Pressable onPress={handleSave} hitSlop={8}>
          <Text style={[styles.headerAction, { color: t.primary }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <FormFieldGroup
          label="Bank Name"
          value={bankName}
          onChangeText={setBankName}
          placeholder="BDO, BPI, Metrobank"
          autoFocus
        />

        <MoneyInput
          label="Credit Limit"
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="50,000"
        />

        <MoneyInput
          label="Outstanding Balance"
          value={outstandingBalance}
          onChangeText={setOutstandingBalance}
          placeholder="1,000"
        />

        <DayInput value={statementDay} onChangeText={setStatementDay} />

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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerAction: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.interBold,
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  buttonWrapper: {
    marginTop: 32,
  },
});
