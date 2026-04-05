import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEFAULT_DUE_DAY_OFFSET } from '@/types/card';
import { trackOnboardingCardEntryCompleted } from '@/utils/analytics';
import { useAppTheme } from '@/theme';
import { Button, Heading, Label } from '@/components/atoms';
import { DayInput, MoneyInput, parseMoney } from '@/components/molecules';
import { fonts } from '@/theme/fonts';


export default function OnboardingScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const [accountName, setAccountName] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');


  function handleSave() {
    if (!accountName.trim()) {
      Alert.alert('Required', 'Enter an account name.');
      return;
    }
    const stmtDay = parseInt(statementDay, 10);
    if (isNaN(stmtDay) || stmtDay < 1 || stmtDay > 31) {
      Alert.alert('Required', 'Enter a valid statement day (1–31).');
      return;
    }
    const dueDayNum = parseInt(dueDate, 10);
    let offset: number = DEFAULT_DUE_DAY_OFFSET;
    if (!isNaN(dueDayNum) && dueDayNum >= 1 && dueDayNum <= 31) {
      offset = (dueDayNum - stmtDay + 30) % 30 || 30;
      if (offset < 20) {
        Alert.alert(
          'Due Date Too Soon',
          'Due date must be at least 20 days after your statement date.',
        );
        return;
      }
    }

    const limit = parseMoney(creditLimit);

    if (limit <= 0) {
      Alert.alert('Required', 'Enter a valid credit limit.');
      return;
    }

    const balance = parseMoney(outstandingBalance);

    trackOnboardingCardEntryCompleted(accountName.trim(), balance > 0);
    useOnboardingStore.getState().setStep('first_status');
    router.push({
      pathname: '/onboarding-result',
      params: {
        bankName: accountName.trim(),
        creditLimit: String(limit),
        outstandingBalance: String(balance),
        statementDay: String(stmtDay),
        dueDayOffset: String(offset),
      },
    });
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
        <View style={styles.fieldGroup}>
          <Label>Card Name</Label>
          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: t.inputBg,
                borderColor: t.inputBorder,
                color: t.inputText,
              },
            ]}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="e.g. BDO Rewards, Citi PremierMiles"
            placeholderTextColor={t.placeholder}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            accessibilityLabel="Card name"
          />
        </View>

        {/* Credit Limit */}
        <MoneyInput
          label="Credit Limit"
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="50,000"
        />

        {/* Outstanding Balance */}
        <MoneyInput
          label="Outstanding Balance"
          value={outstandingBalance}
          onChangeText={setOutstandingBalance}
          placeholder="1,000"
        />
        <Text style={[styles.hint, { color: t.textMuted }]}>
          Approximate is fine — you can update anytime.
        </Text>

        {/* Statement Day & Due Date */}
        <View style={styles.row}>
          <View style={styles.rowHalf}>
            <DayInput value={statementDay} onChangeText={setStatementDay} />
          </View>
          <View style={styles.rowHalf}>
            <DayInput label="Due Date (1–31)" value={dueDate} onChangeText={setDueDate} placeholder="21" />
          </View>
        </View>

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
  fieldGroup: {
    marginTop: 16,
  },
  nameInput: {
    borderRadius: 8,
    borderWidth: 2,
    padding: 14,
    fontSize: 20,
    fontFamily: fonts.interBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    marginTop: -16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  rowHalf: {
    flex: 1,
    marginTop: -16,
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
