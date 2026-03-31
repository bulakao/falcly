import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useAppTheme } from '@/theme';

export default function UpdateBalanceScreen() {
  const t = useAppTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const updateBalance = useCardStore((s) => s.updateBalance);
  const [balanceText, setBalanceText] = useState(
    card ? String(card.outstandingBalance) : '',
  );

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Card not found</Text>
      </View>
    );
  }

  function handleConfirm() {
    const value = parseFloat(balanceText);
    if (isNaN(value) || value < 0) return;
    updateBalance(card!.id, value);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>{card.bankName}</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>Enter your current outstanding balance</Text>

        <TextInput
          style={[styles.input, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }]}
          value={balanceText}
          onChangeText={setBalanceText}
          placeholder="0"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          autoFocus
          selectTextOnFocus
        />

        <Text style={[styles.hint, { color: t.textMuted }]}>
          Current: ₱{card.outstandingBalance.toLocaleString()}
        </Text>

        <Pressable
          style={[
            styles.confirmButton,
            { backgroundColor: t.primary },
            (!balanceText || isNaN(parseFloat(balanceText))) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!balanceText || isNaN(parseFloat(balanceText))}
        >
          <Text style={[styles.confirmButtonText, { color: t.textInverse }]}>Update Balance</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingTop: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
