import { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { exportDataAsCSV } from '@/utils/csvExport';
import { Button } from '@/components/atoms';
import { SurfaceCard } from '@/components/molecules';

export function SettingsDataSection() {
  const t = useAppTheme();
  const cards = useCardStore((s) => s.cards);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const [exporting, setExporting] = useState(false);

  if (!__DEV__) return null;

  return (
    <>
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Data</Text>
      <SurfaceCard>
        <Text style={[styles.itemLabel, { color: t.textSecondary }]}>Export</Text>
        <Text style={[styles.itemHint, { color: t.textMuted, marginBottom: 12 }]}>
          Cards, installments, subscriptions, and profile as CSV.
        </Text>
        <Button
          label={exporting ? 'Exporting...' : 'Export as CSV'}
          variant="primary"
          onPress={() => {
            setExporting(true);
            exportDataAsCSV(cards, { cashOnHand, monthlyIncome, payday, committedExpenses })
              .catch((e: unknown) => {
                const message = e instanceof Error ? e.message : 'Export failed';
                Alert.alert('Export Error', message);
              })
              .finally(() => setExporting(false));
          }}
          disabled={exporting}
        />
      </SurfaceCard>
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interRegular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  itemLabel: {
    fontSize: typeScale.body,
    fontFamily: fonts.interRegular,
    marginBottom: 4,
  },
  itemHint: {
    fontSize: typeScale.caption,
    lineHeight: 17,
  },
});
