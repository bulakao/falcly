import {
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  View as RNView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useInstallmentStore } from '@/store/installmentStore';
import { Button } from '@/components/atoms';
import { SurfaceCard } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

export default function ManageInstallmentsScreen() {
  const t = useAppTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const installments = useInstallmentStore((s) => s.installments.filter((i) => i.cardId === cardId));
  const deleteInstallment = useInstallmentStore((s) => s.deleteInstallment);
  const getMonthsRemaining = useInstallmentStore((s) => s.getMonthsRemaining);

  if (!card) {
    return (
      <RNView style={[styles.container, { backgroundColor: t.background }]}>
        <Text>Card not found</Text>
      </RNView>
    );
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Delete Installment', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteInstallment(id) },
    ]);
  }

  const active = installments.filter((i) => i.isActive);
  const completed = installments.filter((i) => !i.isActive);

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.subtitle, { color: t.textMuted }]}>
        {card.bankName} · {active.length} active
      </Text>

      {active.length === 0 && (
        <SurfaceCard>
          <Text style={[styles.emptyText, { color: t.textMuted }]}>
            No installments yet. Add one to track monthly charges.
          </Text>
        </SurfaceCard>
      )}

      {active.map((inst) => {
        const remaining = getMonthsRemaining(inst);
        const elapsed = inst.totalMonths - remaining;
        const progress = inst.totalMonths > 0 ? elapsed / inst.totalMonths : 0;

        return (
          <SurfaceCard key={inst.id}>
            <RNView style={styles.row}>
              <RNView style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: t.textPrimary }]}>{inst.name}</Text>
                {inst.merchant !== '' && (
                  <Text style={[styles.itemDetail, { color: t.textMuted }]}>{inst.merchant}</Text>
                )}
              </RNView>
              <Text style={[styles.amount, { color: t.textPrimary }]}>
                ₱{inst.monthlyAmount.toLocaleString()}/mo
              </Text>
            </RNView>

            <RNView style={styles.progressContainer}>
              <RNView style={[styles.progressBg, { backgroundColor: t.border }]}>
                <RNView style={[styles.progressFill, { backgroundColor: t.primary, width: `${Math.round(progress * 100)}%` }]} />
              </RNView>
              <Text style={[styles.progressText, { color: t.textMuted }]}>
                {elapsed}/{inst.totalMonths} months · {remaining} left
              </Text>
            </RNView>

            <RNView style={styles.row}>
              <Text style={[styles.itemDetail, { color: t.textMuted }]}>
                Total ₱{inst.totalAmount.toLocaleString()}
              </Text>
              <Pressable onPress={() => handleDelete(inst.id, inst.name)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${inst.name}`}>
                <Text style={[styles.deleteText, { color: t.risky }]}>Remove</Text>
              </Pressable>
            </RNView>
          </SurfaceCard>
        );
      })}

      {completed.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>Completed</Text>
          {completed.map((inst) => (
            <SurfaceCard key={inst.id} style={{ opacity: 0.6 }}>
              <RNView style={styles.row}>
                <Text style={[styles.itemName, { color: t.textMuted }]}>{inst.name}</Text>
                <Pressable onPress={() => handleDelete(inst.id, inst.name)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${inst.name}`}>
                  <Text style={[styles.deleteText, { color: t.risky }]}>Remove</Text>
                </Pressable>
              </RNView>
            </SurfaceCard>
          ))}
        </>
      )}

      <RNView style={styles.buttonWrapper}>
        <Button
          label="Add Installment"
          onPress={() => router.push({ pathname: '/add-installment', params: { cardId } })}
        />
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.interRegular,
    textAlign: 'center',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
  itemDetail: {
    fontSize: 13,
    fontFamily: fonts.interRegular,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontFamily: fonts.interBold,
  },
  progressContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: fonts.interRegular,
    marginTop: 4,
  },
  deleteText: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  buttonWrapper: {
    marginTop: 24,
  },
});
