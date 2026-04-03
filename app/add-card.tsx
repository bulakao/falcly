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
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { DEFAULT_DUE_DAY_OFFSET } from '@/types/card';
import { trackCardAdded } from '@/utils/analytics';
import { Button } from '@/components/atoms';
import { DayInput, FormFieldGroup, MoneyInput, parseMoney } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

export default function AddCardScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const addCard = useCardStore((s) => s.addCard);
  const defaultInterestRate = useUserStore((s) => s.defaultInterestRate);
  const defaultMinPaymentPct = useUserStore((s) => s.defaultMinPaymentPct);
  const defaultMinPaymentFloor = useUserStore((s) => s.defaultMinPaymentFloor);

  const [bankName, setBankName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDayOffset, setDueDayOffset] = useState(String(DEFAULT_DUE_DAY_OFFSET));

  function handleSave() {
    const limit = parseMoney(creditLimit);
    const balance = parseMoney(outstandingBalance);
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
        'Due date must be at least 20 days after your statement date.',
      );
      return;
    }

    addCard({
      bankName: bankName.trim(),
      creditLimit: limit,
      outstandingBalance: balance,
      statementDay: stmtDay,
      dueDayOffset: isNaN(offset) ? DEFAULT_DUE_DAY_OFFSET : offset,
      interestRate: defaultInterestRate,
      minPaymentPct: defaultMinPaymentPct,
      minPaymentFloor: defaultMinPaymentFloor,
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
          label="Card Name"
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
          placeholder={String(DEFAULT_DUE_DAY_OFFSET)}
          keyboardType="numeric"
          hint="Minimum 20 days (BSP regulation). Most PH banks use 20–25 days."
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
