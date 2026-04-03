import { useMemo } from 'react';
import {
  StyleSheet,
  SectionList,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { Button, Caption } from '@/components/atoms';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Receipt } from 'lucide-react-native';

import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { useCardStore } from '@/store/cardStore';
import { useTransactionStore, type Transaction } from '@/store/transactionStore';
import { getCycleDates } from '@/utils/decisionEngine';
import { formatCycleDateRange, classifyTransactionCycle } from '@/utils/cycleUtils';
import type { Card } from '@/types/card';

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
        <EmptyState
          icon={<Receipt size={48} color={t.textMuted} />}
          title="No transactions yet"
          subtitle="Log a purchase to see which bill it lands on"
        >
          <View style={styles.emptyBtn}>
            <Button
              label="Log Transaction"
              onPress={() => router.push(`/log-transaction?cardId=${card.id}`)}
            />
          </View>
        </EmptyState>
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
            <TransactionRow tx={item} card={card} />
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

function TransactionRow({ tx, card }: { tx: Transaction; card: Card }) {
  const t = useAppTheme();
  const excludeTransaction = useTransactionStore((s) => s.excludeTransaction);
  const includeTransaction = useTransactionStore((s) => s.includeTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const isPayment = tx.type === 'payment';
  const isRefund = tx.type === 'refund';
  const isExcluded = tx.cycleLabel === 'excluded';

  function handleLongPress() {
    const options = isExcluded
      ? [
          { text: 'Include', onPress: () => {
            const restoredLabel = classifyTransactionCycle(tx.date, card);
            includeTransaction(tx.id, restoredLabel);
          }},
          { text: 'Delete', style: 'destructive' as const, onPress: () => {
            Alert.alert('Delete Transaction', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(tx.id) },
            ]);
          }},
          { text: 'Cancel', style: 'cancel' as const },
        ]
      : [
          { text: 'Exclude', onPress: () => excludeTransaction(tx.id) },
          { text: 'Delete', style: 'destructive' as const, onPress: () => {
            Alert.alert('Delete Transaction', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(tx.id) },
            ]);
          }},
          { text: 'Cancel', style: 'cancel' as const },
        ];

    Alert.alert(
      tx.merchant || tx.type,
      `${formatPeso(tx.amount)} · ${formatTxDate(tx.date)}`,
      options,
    );
  }

  return (
    <Pressable onLongPress={handleLongPress} style={[styles.txRow, isExcluded && { opacity: 0.4 }]}>
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
    </Pressable>
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
    fontFamily: fonts.interSemiBold,
  },
  heading: {
    fontSize: 18,
    fontFamily: fonts.interBold,
  },
  addBtn: {
    fontSize: 16,
    fontFamily: fonts.interBold,
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
    fontFamily: fonts.interBold,
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
    fontFamily: fonts.interSemiBold,
  },
  subtotalValue: {
    fontSize: 14,
    fontFamily: fonts.interBold,
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
    fontFamily: fonts.interMedium,
    flex: 1,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
  },
  txBadge: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyBtn: {
    marginTop: 24,
    width: '100%',
  },
});
