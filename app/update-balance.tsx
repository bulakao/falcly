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

export default function UpdateBalanceScreen() {
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
        <Text style={styles.subtitle}>Enter your current outstanding balance</Text>

        <TextInput
          style={styles.input}
          value={balanceText}
          onChangeText={setBalanceText}
          placeholder="0"
          placeholderTextColor="#999"
          keyboardType="numeric"
          autoFocus
          selectTextOnFocus
        />

        <Text style={styles.hint}>
          Current: ₱{card.outstandingBalance.toLocaleString()}
        </Text>

        <Pressable
          style={[
            styles.confirmButton,
            (!balanceText || isNaN(parseFloat(balanceText))) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!balanceText || isNaN(parseFloat(balanceText))}
        >
          <Text style={styles.confirmButtonText}>Update Balance</Text>
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
    color: '#666',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 28,
    fontWeight: '700',
    backgroundColor: '#fafafa',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
