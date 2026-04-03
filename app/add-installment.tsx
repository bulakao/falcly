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
import { router, useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useInstallmentStore } from '@/store/installmentStore';
import { Button } from '@/components/atoms';
import { FormFieldGroup, MoneyInput, parseMoney } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

export default function AddInstallmentScreen() {
  const t = useAppTheme();
  const { cardId: preselectedCardId } = useLocalSearchParams<{ cardId?: string }>();
  const cards = useCardStore((s) => s.cards);
  const addInstallment = useInstallmentStore((s) => s.addInstallment);

  const [cardId, setCardId] = useState(preselectedCardId ?? cards[0]?.id ?? '');
  const [name, setName] = useState('');
  const [merchant, setMerchant] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [totalMonths, setTotalMonths] = useState('');

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Enter the installment name.');
      return;
    }
    if (!cardId) {
      Alert.alert('Required', 'Select a card.');
      return;
    }
    const total = parseMoney(totalAmount);
    const monthly = parseMoney(monthlyAmount);
    const months = parseInt(totalMonths, 10);

    if (isNaN(total) || total <= 0) {
      Alert.alert('Required', 'Enter the total amount.');
      return;
    }
    if (isNaN(months) || months <= 0) {
      Alert.alert('Required', 'Enter the number of months.');
      return;
    }

    const finalMonthly = monthly > 0 ? monthly : Math.ceil(total / months);

    addInstallment({
      cardId,
      name: name.trim(),
      merchant: merchant.trim(),
      totalAmount: total,
      monthlyAmount: finalMonthly,
      totalMonths: months,
      startDate: Date.now(),
    });

    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <FormFieldGroup
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="iPhone 16 Pro, Laptop, etc."
          autoFocus
        />

        <FormFieldGroup
          label="Merchant"
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Apple Store, Home Credit, etc."
        />

        {cards.length > 1 && (
          <>
            <Text style={[styles.label, { color: t.textSecondary }]}>Card</Text>
            <View style={styles.cardPicker}>
              {cards.filter((c) => c.isActive).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCardId(c.id)}
                  style={[
                    styles.cardChip,
                    { borderColor: cardId === c.id ? t.primary : t.border, backgroundColor: cardId === c.id ? t.accentBg : 'transparent' },
                  ]}
                >
                  <Text style={[styles.cardChipText, { color: cardId === c.id ? t.primary : t.textPrimary }]}>
                    {c.bankName}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <MoneyInput
          label="Total Amount"
          value={totalAmount}
          onChangeText={setTotalAmount}
          placeholder="48,000"
        />

        <FormFieldGroup
          label="Number of Months"
          value={totalMonths}
          onChangeText={setTotalMonths}
          placeholder="12"
          keyboardType="numeric"
        />

        <MoneyInput
          label="Monthly Amount (auto-calculated if blank)"
          value={monthlyAmount}
          onChangeText={setMonthlyAmount}
          placeholder={totalAmount && totalMonths ? String(Math.ceil(parseMoney(totalAmount) / (parseInt(totalMonths, 10) || 1))) : '4,000'}
        />

        <View style={styles.buttonWrapper}>
          <Button label="Add Installment" onPress={handleSave} />
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
  label: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  cardPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardChipText: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
  },
  buttonWrapper: {
    marginTop: 32,
  },
});
