import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { calculateCardStatus } from '@/utils/decisionEngine';
import type { CardStatus } from '@/types/card';

const STATUS_COLORS: Record<CardStatus, string> = {
  SAFE: '#10b981',
  CAUTION: '#f59e0b',
  RISKY: '#ef4444',
};

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '✓',
  CAUTION: '⚠',
  RISKY: '✕',
};

const STATUS_EXPLANATIONS: Record<CardStatus, string> = {
  SAFE: 'Good news — swiping now is unlikely to cause payment stress this cycle.',
  CAUTION: 'Be careful — your statement is closing soon or utilization is getting high.',
  RISKY: 'Hold off — swiping now could make it hard to pay your bill on time.',
};

export default function OnboardingResultScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const updateCard = useCardStore((s) => s.updateCard);
  const setCashOnHand = useUserStore((s) => s.setCashOnHand);

  const [showEnrichment, setShowEnrichment] = useState(false);
  const [cashOnHand, setCashInput] = useState('');
  const [dueDayOffset, setDueDayOffset] = useState(String(cardDefaults.dueDayOffset));
  const [interestRate, setInterestRate] = useState(
    String(cardDefaults.interestRate * 100),
  );

  if (!card) {
    return (
      <View style={styles.container}>
        <Text>Card not found.</Text>
      </View>
    );
  }

  const { status, reason } = calculateCardStatus(card, new Date());
  const color = STATUS_COLORS[status];

  function handleEnrichmentSave() {
    if (!card) return;

    const offset = parseInt(dueDayOffset, 10);
    const rate = parseFloat(interestRate);
    const cash = parseFloat(cashOnHand);

    const updates: Record<string, number> = {};
    if (!isNaN(offset) && offset > 0) {
      updates.dueDayOffset = offset;
    }
    if (!isNaN(rate) && rate > 0) {
      updates.interestRate = rate / 100;
    }
    if (Object.keys(updates).length > 0) {
      updateCard(card.id, updates);
    }

    if (!isNaN(cash) && cash >= 0) {
      setCashOnHand(cash);
    }

    router.replace('/');
  }

  function handleSkip() {
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Status result */}
        <View style={[styles.statusCard, { borderColor: color }]}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>
              {STATUS_ICONS[status]} {status}
            </Text>
          </View>
          <Text style={styles.reason}>{reason}</Text>
          <Text style={styles.explanation}>{STATUS_EXPLANATIONS[status]}</Text>
        </View>

        <Text style={styles.cardName}>{card.bankName}</Text>
        <Text style={styles.balanceDetail}>
          ₱{card.outstandingBalance.toLocaleString()} / ₱{card.creditLimit.toLocaleString()}
        </Text>

        {/* Enrichment section */}
        {!showEnrichment ? (
          <Pressable
            style={styles.enrichButton}
            onPress={() => setShowEnrichment(true)}
          >
            <Text style={styles.enrichButtonText}>
              Improve accuracy (optional)
            </Text>
            <Text style={styles.enrichHint}>
              Add cash on hand, due day offset, or interest rate
            </Text>
          </Pressable>
        ) : (
          <View style={styles.enrichSection}>
            <Text style={styles.enrichHeading}>Fine-tune your result</Text>

            <Text style={styles.label}>Cash on Hand (₱)</Text>
            <TextInput
              style={styles.input}
              value={cashOnHand}
              onChangeText={setCashInput}
              placeholder="e.g. 25000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Due Day Offset (days after statement)</Text>
            <TextInput
              style={styles.input}
              value={dueDayOffset}
              onChangeText={setDueDayOffset}
              placeholder={String(cardDefaults.dueDayOffset)}
              placeholderTextColor="#999"
              keyboardType="numeric"
              selectTextOnFocus
            />

            <Text style={styles.label}>Monthly Interest Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={interestRate}
              onChangeText={setInterestRate}
              placeholder={String(cardDefaults.interestRate * 100)}
              placeholderTextColor="#999"
              keyboardType="numeric"
              selectTextOnFocus
            />

            <Pressable style={styles.saveButton} onPress={handleEnrichmentSave}>
              <Text style={styles.saveButtonText}>Save &amp; Continue</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>
            {showEnrichment ? 'Skip for now' : 'Go to Dashboard'}
          </Text>
        </Pressable>
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
  statusCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  reason: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  explanation: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  balanceDetail: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  enrichButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  enrichButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  enrichHint: {
    fontSize: 12,
    color: '#999',
  },
  enrichSection: {
    marginBottom: 12,
  },
  enrichHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 6,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#000',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
});
