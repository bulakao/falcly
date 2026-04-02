import { useState, useMemo } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { Button, FormInput, Label, Caption } from '@/components/atoms';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { useCardStore } from '@/store/cardStore';
import { useTransactionStore } from '@/store/transactionStore';
import type { TransactionType } from '@/store/transactionStore';
import {
  classifyTransactionCycle,
  getStatementMonth,
  getLandsOnLabel,
  daysUntilClose,
} from '@/utils/cycleUtils';

const TX_TYPES: { label: string; value: TransactionType }[] = [
  { label: 'Purchase', value: 'purchase' },
  { label: 'Payment', value: 'payment' },
  { label: 'Refund', value: 'refund' },
];

function getDateChips(): { label: string; date: Date }[] {
  const chips: { label: string; date: Date }[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${dayNames[d.getDay()]} ${monthNames[d.getMonth()]} ${d.getDate()}`;
    chips.push({ label, date: d });
  }
  return chips;
}

export default function LogTransactionScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const { cardId: paramCardId } = useLocalSearchParams<{ cardId?: string }>();
  const cards = useCardStore((s) => s.cards).filter((c) => c.isActive);
  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const [amountText, setAmountText] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectedCardId, setSelectedCardId] = useState(paramCardId ?? cards[0]?.id ?? '');
  const [txType, setTxType] = useState<TransactionType>('purchase');

  const dateChips = useMemo(() => getDateChips(), []);
  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const landsOnLabel = useMemo(() => {
    if (!selectedCard) return '';
    return getLandsOnLabel(selectedDate.getTime(), selectedCard);
  }, [selectedCard, selectedDate]);

  const nearCutoffWarning = useMemo(() => {
    if (!selectedCard) return null;
    const days = daysUntilClose(selectedDate.getTime(), selectedCard);
    if (days >= 0 && days <= 3) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + days + 1);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const waitDate = `${monthNames[nextDay.getMonth()]} ${nextDay.getDate()}`;
      return `Statement closes in ${days} day${days === 1 ? '' : 's'}. Consider waiting until ${waitDate} to keep it off this bill.`;
    }
    return null;
  }, [selectedCard, selectedDate]);

  function handleSave() {
    const amount = parseFloat(amountText);
    if (isNaN(amount) || amount <= 0 || !selectedCard) return;

    const dateTs = selectedDate.getTime();
    const cycleLabel = txType === 'payment'
      ? 'previous' as const
      : classifyTransactionCycle(dateTs, selectedCard);
    const stmtMonth = getStatementMonth(dateTs, selectedCard);

    addTransaction({
      cardId: selectedCard.id,
      amount,
      type: txType,
      merchant: merchant.trim(),
      date: dateTs,
      cycleLabel,
      statementMonth: stmtMonth,
      isManual: true,
      notes: undefined,
    });

    router.back();
  }

  const isValid = !isNaN(parseFloat(amountText)) && parseFloat(amountText) > 0 && selectedCard;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Log Transaction</Text>

        {/* Amount */}
        <Label>{txType === 'payment' ? 'Payment amount' : 'Amount'}</Label>
        <View style={styles.amountRow}>
          <Text style={[styles.currencyPrefix, { color: t.textSecondary }]}>₱</Text>
          <FormInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0"
            keyboardType="numeric"
            autoFocus
          />
        </View>

        {/* Merchant */}
        <Label>Merchant</Label>
        <FormInput
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Grab Food, Watsons"
          keyboardType="default"
        />

        {/* Date chips */}
        <Label>Date</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
          {dateChips.map((chip, i) => {
            const isActive = selectedDate.getTime() === chip.date.getTime();
            return (
              <Pressable
                key={i}
                style={[
                  styles.dateChip,
                  { borderColor: t.inputBorder, backgroundColor: t.inputBg },
                  isActive && { backgroundColor: t.primary, borderColor: t.primary },
                ]}
                onPress={() => setSelectedDate(chip.date)}
              >
                <Text
                  style={[
                    styles.dateChipText,
                    { color: t.inputText },
                    isActive && { color: t.textInverse },
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Lands on label */}
        {selectedCard && landsOnLabel ? (
          <View style={[styles.landsOnBox, { backgroundColor: t.accentBg }]}>
            <Text style={[styles.landsOnText, { color: t.accentText }]}>
              {landsOnLabel}
            </Text>
          </View>
        ) : null}

        {/* Near cutoff warning (TL-04) */}
        {nearCutoffWarning ? (
          <View style={[styles.warningBox, { backgroundColor: t.cautionBg }]}>
            <Text style={[styles.warningText, { color: t.cautionText }]}>
              {nearCutoffWarning}
            </Text>
          </View>
        ) : null}

        {/* Card selector */}
        {cards.length > 1 ? (
          <>
            <Label>Card</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
              {cards.map((card) => {
                const isActive = selectedCardId === card.id;
                return (
                  <Pressable
                    key={card.id}
                    style={[
                      styles.dateChip,
                      { borderColor: t.inputBorder, backgroundColor: t.inputBg },
                      isActive && { backgroundColor: t.primary, borderColor: t.primary },
                    ]}
                    onPress={() => setSelectedCardId(card.id)}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        { color: t.inputText },
                        isActive && { color: t.textInverse },
                      ]}
                    >
                      {card.bankName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        {/* Type selector */}
        <Label>Type</Label>
        <View style={styles.typeRow}>
          {TX_TYPES.map((opt) => {
            const isActive = txType === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.typeChip,
                  { borderColor: t.inputBorder, backgroundColor: t.inputBg },
                  isActive && { backgroundColor: t.primary, borderColor: t.primary },
                ]}
                onPress={() => setTxType(opt.value)}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    { color: t.inputText },
                    isActive && { color: t.textInverse },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Save button */}
        <View style={styles.buttonWrapper}>
          <Button
            label="Save Transaction"
            onPress={handleSave}
            disabled={!isValid}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 22,
    fontFamily: fonts.interBold,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currencyPrefix: {
    fontSize: 20,
    fontFamily: fonts.interBold,
  },
  dateRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
  },
  dateChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  dateChipText: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
  },
  landsOnBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  landsOnText: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
  },
  warningBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeChipText: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
  },
  buttonWrapper: {
    marginTop: 8,
  },
});
