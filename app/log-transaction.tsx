import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { Button, FormInput, Label } from '@/components/atoms';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { useCardStore } from '@/store/cardStore';
import { useTransactionStore } from '@/store/transactionStore';
import type { TransactionType } from '@/store/transactionStore';
import {
  classifyTransactionCycle,
  getStatementMonth,
  getLandsOnLabel,
  daysUntilClose,
} from '@/utils/cycleUtils';
import { useCurrency } from '@/hooks/useCurrency';

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

const TEACHABLE_MOMENT_KEY = 'falcly-first-tx-teachable-dismissed';

export default function LogTransactionScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const { cardId: paramCardId } = useLocalSearchParams<{ cardId?: string }>();
  const cards = useCardStore((s) => s.cards).filter((c) => c.isActive);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const transactionCount = useTransactionStore((s) => s.transactions.length);
  const [showTeachable, setShowTeachable] = useState(false);
  const [teachableDismissed, setTeachableDismissed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(TEACHABLE_MOMENT_KEY).then((val) => {
      setTeachableDismissed(val === 'true');
    });
  }, []);

  const dismissTeachable = useCallback(() => {
    AsyncStorage.setItem(TEACHABLE_MOMENT_KEY, 'true');
    setShowTeachable(false);
    router.back();
  }, [router]);

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
  const { symbol } = useCurrency(selectedCard);

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

    const isFirstTx = transactionCount === 0 && !teachableDismissed;

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

    if (isFirstTx) {
      setShowTeachable(true);
    } else {
      router.back();
    }
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
          <Text style={[styles.currencyPrefix, { color: t.textSecondary }]}>{symbol}</Text>
          <FormInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0"
            keyboardType="numeric"
            autoFocus
            accessibilityLabel="Amount"
          />
        </View>

        {/* Merchant */}
        <Label>Merchant</Label>
        <FormInput
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Grab Food, Watsons"
          keyboardType="default"
          accessibilityLabel="Merchant"
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
                accessibilityRole="button"
                accessibilityLabel={chip.label}
                accessibilityState={{ selected: isActive }}
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
                    accessibilityRole="button"
                    accessibilityLabel={card.bankName}
                    accessibilityState={{ selected: isActive }}
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
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                accessibilityState={{ selected: isActive }}
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

      {/* First-transaction teachable moment (UX-05) */}
      <Modal
        visible={showTeachable}
        transparent
        animationType="fade"
        onRequestClose={dismissTeachable}
        accessibilityViewIsModal
      >
        <Pressable style={styles.modalOverlay} onPress={dismissTeachable} accessibilityRole="button" accessibilityLabel="Close">
          <Pressable style={[styles.modalContent, { backgroundColor: t.surfaceElevated }]} accessibilityRole="none">
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>
              How Falcly organizes your transactions
            </Text>
            <Text style={[styles.modalBody, { color: t.textSecondary }]}>
              {"Every transaction you log is automatically sorted into a billing cycle based on your card's statement day:"}
            </Text>
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: t.safe }]}>Current cycle</Text>
              <Text style={[styles.modalDesc, { color: t.textSecondary }]}>
                Purchases that will appear on your upcoming statement.
              </Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: t.caution }]}>Previous cycle</Text>
              <Text style={[styles.modalDesc, { color: t.textSecondary }]}>
                Already on your last statement — these are what you owe now.
              </Text>
            </View>
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: t.accent }]}>Next cycle</Text>
              <Text style={[styles.modalDesc, { color: t.textSecondary }]}>
                {"Won't hit a statement for a while \u2014 the furthest out."}
              </Text>
            </View>
            <View style={styles.modalButtonWrapper}>
              <Button label="Got it" onPress={dismissTeachable} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    fontSize: typeScale.headline,
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
    fontSize: typeScale.headline,
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
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  landsOnBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  landsOnText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interMedium,
  },
  warningBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: typeScale.body,
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
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  buttonWrapper: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: typeScale.body,
    fontFamily: fonts.interRegular,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalSection: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
    marginBottom: 2,
  },
  modalDesc: {
    fontSize: typeScale.body,
    fontFamily: fonts.interRegular,
    lineHeight: 18,
  },
  modalButtonWrapper: {
    marginTop: 8,
  },
});
