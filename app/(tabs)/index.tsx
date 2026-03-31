import { StyleSheet, Pressable, FlatList } from 'react-native';
import { Link } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { calculateCardStatus } from '@/utils/decisionEngine';
import type { Card, CardStatus } from '@/types/card';

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

function CardItem({ card }: { card: Card }) {
  const { status, reason } = calculateCardStatus(card);

  return (
    <Link href={{ pathname: '/swipe-impact', params: { cardId: card.id } }} asChild>
      <Pressable>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.bankName}>{card.bankName}</Text>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
              <Text style={styles.badgeText}>
                {STATUS_ICONS[status]} {status}
              </Text>
            </View>
          </View>
          <Text style={styles.reason}>{reason}</Text>
          <Text style={styles.detail}>
            ₱{card.outstandingBalance.toLocaleString()} / ₱{card.creditLimit.toLocaleString()}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const cards = useCardStore((s) => s.cards);

  return (
    <View style={styles.container}>
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first credit card to see if it's safe to swipe.
          </Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <CardItem card={item} />}
          contentContainerStyle={styles.list}
        />
      )}

      <Link href="/add-card" asChild>
        <Pressable style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Card</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  reason: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#888',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
