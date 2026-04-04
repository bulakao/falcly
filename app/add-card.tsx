import { useState, useMemo } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
  View,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { DEFAULT_DUE_DAY_OFFSET } from '@/types/card';
import { trackCardAdded } from '@/utils/analytics';
import { Button, Label } from '@/components/atoms';
import { BankPicker, DayInput, FormFieldGroup, MoneyInput, parseMoney } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/utils/currency';

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
  const [currency, setCurrency] = useState<string | undefined>(undefined);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return SUPPORTED_CURRENCIES;
    const q = currencySearch.trim().toLowerCase();
    return SUPPORTED_CURRENCIES.filter(
      (code) => code.toLowerCase().includes(q) || getCurrencySymbol(code).toLowerCase().includes(q),
    );
  }, [currencySearch]);

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
      currency,
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
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={[styles.headerAction, { color: t.primary }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Add Card</Text>
        <Pressable onPress={handleSave} hitSlop={8} accessibilityRole="button" accessibilityLabel="Save card">
          <Text style={[styles.headerAction, { color: t.primary }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.fieldGroup}>
          <Label>Card Name</Label>
          <BankPicker
            value={bankName}
            onSelect={setBankName}
            placeholder="BDO, BPI, Metrobank"
          />
        </View>

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

        <View style={styles.fieldGroup}>
          <Label>Card Currency (optional)</Label>
          <Pressable
            onPress={() => setCurrencyModalVisible(true)}
            style={[styles.currencyPicker, { borderColor: t.inputBorder, backgroundColor: t.inputBg }]}
            accessibilityRole="button"
            accessibilityLabel="Select card currency"
          >
            <Text style={[styles.currencyPickerText, { color: currency ? t.textPrimary : t.textMuted }]}>
              {currency ? `${getCurrencySymbol(currency)} ${currency}` : 'Use global currency'}
            </Text>
          </Pressable>
          <Text style={[styles.currencyHint, { color: t.textMuted }]}>Overrides your global currency for this card</Text>
        </View>

        <View style={styles.buttonWrapper}>
          <Button label="Add Card" onPress={handleSave} />
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
            style={[styles.currencyRow, !currency && { backgroundColor: t.accentBg }]}
            onPress={() => { setCurrency(undefined); setCurrencyModalVisible(false); setCurrencySearch(''); }}
            accessibilityRole="button"
            accessibilityLabel="Use global currency"
          >
            <Text style={[styles.currencyLabel, { color: !currency ? t.primary : t.textPrimary }]}>Use global currency</Text>
            {!currency && <Text style={{ color: t.primary }}>✓</Text>}
          </Pressable>
          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item}
            renderItem={({ item: code }) => (
              <Pressable
                style={[styles.currencyRow, code === currency && { backgroundColor: t.accentBg }]}
                onPress={() => { setCurrency(code); setCurrencyModalVisible(false); setCurrencySearch(''); }}
                accessibilityRole="button"
                accessibilityLabel={`${getCurrencySymbol(code)} ${code}`}
                accessibilityState={{ selected: code === currency }}
              >
                <Text style={[styles.currencySymbolText, { color: t.textPrimary }]}>{getCurrencySymbol(code)}</Text>
                <Text style={[styles.currencyLabel, { color: code === currency ? t.primary : t.textPrimary, flex: 1 }]}>{code}</Text>
                {code === currency && <Text style={{ color: t.primary }}>✓</Text>}
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
  fieldGroup: {
    marginTop: 16,
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
    fontSize: 15,
    fontFamily: fonts.interMedium,
  },
  currencyHint: {
    fontSize: 12,
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
    fontSize: 18,
    fontFamily: fonts.interBold,
  },
  modalClose: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
  searchInput: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  currencySymbolText: {
    fontSize: 18,
    fontFamily: fonts.interBold,
    width: 40,
  },
  currencyLabel: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
  },
});
