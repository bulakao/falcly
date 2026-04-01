import { useMemo } from 'react';
import {
  StyleSheet,
  SectionList,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { Button, Caption } from '@/components/atoms';
import { SectionCard } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { useCardStore } from '@/store/cardStore';
import { useTransactionStore, type Transaction } from '@/store/transactionStore';
import { getCycleDates } from '@/utils/decisionEngine';
import { formatCycleDateRange } from '@/utils/cycleUtils';

function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

function formatTxDate(ts: number): string {
  const d = new Date(ts);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

interface TxSection {
  title: string;
  subtitle?: string;
  data: Transaction[];
  subtotal: number;
}

export default function CardTransactionsScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const allTransactions = useTransactionStore((s) => s.transactions);

  const cardTxs = useMemo(
    () => allTransactions.filter((tx) => tx.cardId === cardId),
    [allTransactions, cardId],
  );

  const sections = useMemo((): TxSection[] => {
    if (!card) return [];

    const cycle = getCycleDates(card);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateRange = formatCycleDateRange(card);
    const dueStr = `${months[cycle.dueDate.getMonth()]} ${cycle.dueDate.getDate()}`;

    const current = cardTxs.filter((tx) => tx.cycleLabel === 'current');
    const next = cardTxs.filter((tx) => tx.cycleLabel === 'next');
    const previous = cardTxs.filter((tx) => tx.cycleLabel === 'previous');
    const excluded = cardTxs.filter((tx) => tx.cycleLabel === 'excluded');

    const sum = (txs: Transaction[]) =>
      txs.reduce((s, tx) => {
        if (tx.type === 'payment' || tx.type === 'refund') return s - tx.amount;
        return s + tx.amount;
      }, 0);

    const result: TxSection[] = [];

    result.push({
      title: `CURRENT CYCLE  (${dateRange})`,
      data: current.sort((a, b) => b.date - a.date),
      subtotal: sum(current),
    });

    if (next.length > 0) {
      const closeDate = cycle.statementClose;
      const nextStart = `${months[closeDate.getMonth()]} ${closeDate.getDate() + 1}+`;
      result.push({
        title: `NEXT CYCLE  (${nextStart})`,
        data: next.sort((a, b) => b.date - a.date),
        subtotal: sum(next),
      });
    }

    result.push({
      title: `PREVIOUS  (Due ${dueStr})`,
      subtitle: `Statement balance ${formatPeso(card.outstandingBalance)}`,
      data: previous.sort((a, b) => b.date - a.date),
      subtotal: sum(previous),
    });

    if (excluded.length > 0) {
      result.push({
        title: 'EXCLUDED',
        data: excluded.sort((a, b) => b.date - a.date),
        subtotal: 0,
      });
    }

    return result;
  }, [card, cardTxs]);

  if (!card) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.heading}>Card not found</Text>
      </View>
    );
  }

  const hasTransactions = cardTxs.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backBtn, { color: t.primary }]}>Back</Text>
        </Pressable>
        <Text style={[styles.heading, { color: t.textPrimary }]}>{card.bankName}</Text>
        <Pressable onPress={() => router.push(`/log-transaction?cardId=${card.id}`)}>
          <Text style={[styles.addBtn, { color: t.primary }]}>+ Log</Text>
        </Pressable>
      </View>

      {!hasTransactions ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No transactions logged yet</Text>
          <Caption>Tap + Log to log your first purchase.</Caption>
          <View style={styles.emptyBtn}>
            <Button
              label="Log Transaction"
              onPress={() => router.push(`/log-transaction?cardId=${card.id}`)}
            />
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: t.background }]}>
              <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>
                {section.title}
              </Text>
              {section.subtitle ? (
                <Caption>{section.subtitle}</Caption>
              ) : null}
            </View>
          )}
          renderItem={({ item }) => (
            <TransactionRow tx={item} />
          )}
          renderSectionFooter={({ section }) => (
            <View style={styles.sectionFooter}>
              <View style={[styles.divider, { backgroundColor: t.border }]} />
              <View style={styles.subtotalRow}>
                <Text style={[styles.subtotalLabel, { color: t.textSecondary }]}>
                  Subtotal
                </Text>
                <Text style={[styles.subtotalValue, { color: t.textPrimary }]}>
                  {formatPeso(section.subtotal)}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const t = useAppTheme();
  const isPayment = tx.type === 'payment';
  const isRefund = tx.type === 'refund';
  const isExcluded = tx.cycleLabel === 'excluded';

  return (
    <View style={[styles.txRow, isExcluded && { opacity: 0.4 }]}>
      <View style={styles.txLeft}>
        <Text style={[styles.txDate, { color: t.textMuted }]}>
          {formatTxDate(tx.date)}
        </Text>
        <Text style={[styles.txMerchant, { color: t.textPrimary }]} numberOfLines={1}>
          {tx.merchant || tx.type}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            { color: isPayment || isRefund ? t.safe : t.textPrimary },
          ]}
        >
          {isPayment || isRefund ? '−' : ''}
          {formatPeso(tx.amount)}
        </Text>
        {isExcluded ? (
          <Text style={[styles.txBadge, { color: t.textMuted }]}>Excluded</Text>
        ) : (
          <Text style={[styles.txBadge, { color: t.textMuted }]}>{tx.type}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
  },
  addBtn: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionFooter: {
    paddingBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtotalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  txDate: {
    fontSize: 13,
    width: 48,
  },
  txMerchant: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  txBadge: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
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
  emptyBtn: {
    marginTop: 24,
    width: '100%',
  },
});
