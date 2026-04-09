import { useState, useMemo } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useInstallmentStore } from '@/store/installmentStore';
import { useSubscriptionItemStore } from '@/store/subscriptionItemStore';
import { useAppTheme } from '@/theme';
import { DEFAULT_DUE_DAY_OFFSET, MIN_DUE_DAY_OFFSET } from '@/types/card';
import { Button, Heading, Label } from '@/components/atoms';
import { FormFieldGroup } from '@/components/molecules';
import { fonts, typeScale } from '@/theme/fonts';
import { useCurrency } from '@/hooks/useCurrency';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/utils/currency';

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
  const { format } = useCurrency(card);

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
  const [cardCurrency, setCardCurrency] = useState<string | undefined>(card?.currency);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return SUPPORTED_CURRENCIES;
    const q = currencySearch.trim().toLowerCase();
    return SUPPORTED_CURRENCIES.filter(
      (code) => code.toLowerCase().includes(q) || getCurrencySymbol(code).toLowerCase().includes(q),
    );
  }, [currencySearch]);

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
    if (!isNaN(offset) && offset < MIN_DUE_DAY_OFFSET) {
      Alert.alert(
        'Due Date Too Soon',
        'Due date must be at least 15 days after your statement date.',
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
      currency: cardCurrency,
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
          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: t.inputBg,
                borderColor: t.inputBorder,
                color: t.inputText,
              },
            ]}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g. BDO Rewards, Citi PremierMiles"
            placeholderTextColor={t.placeholder}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            accessibilityLabel="Card name"
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
          hint="Most banks use 21–25 days."
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
          <Pressable onPress={() => router.push({ pathname: '/manage-installments', params: { cardId } })} style={styles.managedField} accessibilityRole="button" accessibilityLabel="Manage installments">
            <Text style={[styles.managedLabel, { color: t.textSecondary }]}>Monthly Installments</Text>
            <Text style={[styles.managedValue, { color: t.textPrimary }]}>{format(card!.installmentsMonthlyAmount)}</Text>
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
          <Pressable onPress={() => router.push({ pathname: '/manage-subscriptions', params: { cardId } })} style={styles.managedField} accessibilityRole="button" accessibilityLabel="Manage subscriptions">
            <Text style={[styles.managedLabel, { color: t.textSecondary }]}>Subscriptions This Cycle</Text>
            <Text style={[styles.managedValue, { color: t.textPrimary }]}>{format(card!.subscriptionsThisCycle)}</Text>
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

        <View style={styles.fieldGroup}>
          <Label>Card Currency (optional)</Label>
          <Pressable
            onPress={() => setCurrencyModalVisible(true)}
            style={[styles.currencyPicker, { borderColor: t.inputBorder, backgroundColor: t.inputBg }]}
            accessibilityRole="button"
            accessibilityLabel="Select card currency"
          >
            <Text style={[styles.currencyPickerText, { color: cardCurrency ? t.textPrimary : t.textMuted }]}>
              {cardCurrency ? `${getCurrencySymbol(cardCurrency)} ${cardCurrency}` : 'Use global currency'}
            </Text>
          </Pressable>
          <Text style={[styles.currencyHint, { color: t.textMuted }]}>Overrides your global currency for this card</Text>
        </View>

        <View style={styles.buttonWrapper}>
          <Button label="Save Changes" onPress={handleSave} />
        </View>
      </ScrollView>

      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
        accessibilityViewIsModal
      >
        <View style={[styles.modalContainer, { backgroundColor: t.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Card Currency</Text>
            <Pressable onPress={() => setCurrencyModalVisible(false)} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={[styles.modalClose, { color: t.primary }]}>Done</Text>
            </Pressable>
          </View>
          <TextInput
            style={[styles.searchInput, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.inputBg }]}
            placeholder="Search currency..."
            placeholderTextColor={t.textMuted}
            value={currencySearch}
            onChangeText={setCurrencySearch}
            autoCorrect={false}
          />
          <Pressable
            style={[styles.currencyRow, !cardCurrency && { backgroundColor: t.accentBg }]}
            onPress={() => { setCardCurrency(undefined); setCurrencyModalVisible(false); setCurrencySearch(''); }}
            accessibilityRole="button"
            accessibilityLabel="Use global currency"
          >
            <Text style={[styles.currencyLabel, { color: !cardCurrency ? t.primary : t.textPrimary }]}>Use global currency</Text>
            {!cardCurrency && <Text style={{ color: t.primary }}>✓</Text>}
          </Pressable>
          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item}
            renderItem={({ item: code }) => (
              <Pressable
                style={[styles.currencyRow, code === cardCurrency && { backgroundColor: t.accentBg }]}
                onPress={() => { setCardCurrency(code); setCurrencyModalVisible(false); setCurrencySearch(''); }}
                accessibilityRole="button"
                accessibilityLabel={`${getCurrencySymbol(code)} ${code}`}
                accessibilityState={{ selected: code === cardCurrency }}
              >
                <Text style={[styles.currencySymbolText, { color: t.textPrimary }]}>{getCurrencySymbol(code)}</Text>
                <Text style={[styles.currencyLabel, { color: code === cardCurrency ? t.primary : t.textPrimary, flex: 1 }]}>{code}</Text>
                {code === cardCurrency && <Text style={{ color: t.primary }}>✓</Text>}
              </Pressable>
            )}
          />
        </View>
      </Modal>
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
  nameInput: {
    borderRadius: 8,
    borderWidth: 2,
    padding: 14,
    fontSize: typeScale.title2a,
    fontFamily: fonts.interBold,
    textAlign: 'center',
  },
  managedField: {
    marginTop: 16,
    paddingVertical: 12,
  },
  managedLabel: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  managedValue: {
    fontSize: typeScale.title2a,
    fontFamily: fonts.interBold,
  },
  managedHint: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interSemiBold,
    marginTop: 4,
  },
  notFound: {
    fontSize: typeScale.title2b,
    fontFamily: fonts.interBold,
    marginBottom: 24,
  },
  buttonWrapper: {
    marginTop: 32,
  },
  currencyPicker: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  currencyPickerText: {
    fontSize: typeScale.callout,
    fontFamily: fonts.interMedium,
  },
  currencyHint: {
    fontSize: typeScale.footnote,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: {
    fontSize: typeScale.title3,
    fontFamily: fonts.interBold,
  },
  modalClose: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interSemiBold,
  },
  searchInput: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typeScale.callout,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  currencySymbolText: {
    fontSize: typeScale.title3,
    fontFamily: fonts.interBold,
    width: 40,
  },
  currencyLabel: {
    fontSize: typeScale.callout,
    fontFamily: fonts.interSemiBold,
  },
});
