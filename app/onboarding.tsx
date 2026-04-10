import { useState } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEFAULT_DUE_DAY_OFFSET, MIN_DUE_DAY_OFFSET, MAX_DUE_DAY_OFFSET, MIN_CREDIT_LIMIT } from '@/types/card';
import { trackOnboardingCardEntryCompleted } from '@/utils/analytics';
import { useAppTheme } from '@/theme';
import { Button, Heading, Label } from '@/components/atoms';
import { DayInput, FormFieldGroup, formatMoney, MoneyInput, parseMoney } from '@/components/molecules';
import { fonts, typeScale } from '@/theme/fonts';


export default function OnboardingScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const [accountName, setAccountName] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDayOffset, setDueDayOffset] = useState(String(DEFAULT_DUE_DAY_OFFSET));
  const [creditLimit, setCreditLimit] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');


  const offset = parseInt(dueDayOffset, 10);
  const offsetTooLow = !isNaN(offset) && offset > 0 && offset < MIN_DUE_DAY_OFFSET;
  const offsetTooHigh = !isNaN(offset) && offset > MAX_DUE_DAY_OFFSET;
  const offsetError = offsetTooLow || offsetTooHigh;

  const limit = parseMoney(creditLimit);
  const limitTooLow = limit > 0 && limit < MIN_CREDIT_LIMIT;

  const stmtDay = parseInt(statementDay, 10);

  const isFormValid =
    accountName.trim().length > 0 &&
    limit >= MIN_CREDIT_LIMIT &&
    !isNaN(stmtDay) && stmtDay >= 1 && stmtDay <= 31 &&
    dueDayOffset.trim().length > 0 &&
    !offsetError;

  function handleSave() {
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
        dueDayOffset: String(isNaN(offset) ? DEFAULT_DUE_DAY_OFFSET : offset),
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
            placeholder="My Credit Card"
            placeholderTextColor={t.placeholder}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            maxLength={40}
            accessibilityLabel="Card name"
          />
        </View>

        {/* Credit Limit */}
        <FormFieldGroup
          label="Credit Limit"
          value={creditLimit}
          onChangeText={(text: string) => setCreditLimit(formatMoney(text))}
          placeholder="50,000"
          keyboardType="decimal-pad"
          maxLength={11}
          error={limitTooLow}
          hint={limitTooLow ? `Minimum ${MIN_CREDIT_LIMIT.toLocaleString()}` : ' '}
        />

        {/* Outstanding Balance */}
        <MoneyInput
          label="Outstanding Balance"
          value={outstandingBalance}
          onChangeText={setOutstandingBalance}
          placeholder="1,000"
          allowNegative
        />
        <Text style={[styles.hint, { color: t.textMuted }]}>
          Approximate is fine — you can update anytime.
        </Text>

        {/* Statement Day & Due Day Offset */}
        <View style={styles.row}>
          <View style={styles.rowHalf}>
            <DayInput value={statementDay} onChangeText={setStatementDay} />
          </View>
          <View style={styles.rowHalf}>
            <FormFieldGroup
              label="Due Day Offset"
              value={dueDayOffset}
              onChangeText={setDueDayOffset}
              placeholder={String(DEFAULT_DUE_DAY_OFFSET)}
              keyboardType="numeric"
              maxLength={2}
              error={offsetError}
              hint={offsetTooLow ? `Min ${MIN_DUE_DAY_OFFSET} days` : offsetTooHigh ? `Max ${MAX_DUE_DAY_OFFSET} days` : 'Days after statement'}
            />
          </View>
        </View>

      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="See My Status" onPress={handleSave} disabled={!isFormValid} />
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
    fontSize: typeScale.h6,
    fontFamily: fonts.interBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typeScale.callout,
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
    fontSize: typeScale.footnote,
    marginTop: 4,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
