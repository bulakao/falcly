import { useState } from 'react';
import { StyleSheet, Pressable, Alert, View as RNView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { exportDataAsCSV } from '@/utils/csvExport';
import { fullSync } from '@/utils/sync';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/atoms';
import { AlertBanner, SurfaceCard } from '@/components/molecules';

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function SettingsDataSection() {
  const t = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const cards = useCardStore((s) => s.cards);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const lastSyncedAt = useUserStore((s) => s.lastSyncedAt);
  const setLastSyncedAt = useUserStore((s) => s.setLastSyncedAt);

  const { isOffline } = useNetworkStatus();
  const [exporting, setExporting] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<'synced' | 'failed' | null>(null);

  return (
    <>
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Data</Text>
      <SurfaceCard>
        {__DEV__ && (
          <>
            <Text style={[styles.itemLabel, { color: t.textSecondary }]}>Export</Text>
            <Text style={[styles.itemHint, { color: t.textMuted, marginBottom: 12 }]}>
              Cards, installments, subscriptions, and profile as CSV.
            </Text>
            <Button
              label={exporting ? 'Exporting...' : 'Export as CSV'}
              variant="secondary"
              onPress={() => {
                setExporting(true);
                exportDataAsCSV(cards, {
                  cashOnHand,
                  monthlyIncome,
                  payday,
                  committedExpenses,
                })
                  .catch((e: unknown) => {
                    const message = e instanceof Error ? e.message : 'Export failed';
                    Alert.alert('Export Error', message);
                  })
                  .finally(() => {
                    setExporting(false);
                  });
              }}
              disabled={exporting}
            />
            <RNView style={[styles.divider, { backgroundColor: t.border }]} />
          </>
        )}

        {user && (
          <>
            <RNView style={[styles.divider, { backgroundColor: t.border }]} />
            <Text style={[styles.itemLabel, { color: t.textSecondary }]}>Cloud Backup</Text>
            {isOffline ? (
              <AlertBanner message="You are offline. Data is saved locally." variant="stale" />
            ) : (
              <Pressable
                style={styles.defaultRow}
                onPress={async () => {
                  if (syncingNow) return;
                  setSyncingNow(true);
                  setSyncFeedback(null);
                  try {
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    if (!authUser) throw new Error('Not signed in');
                    await fullSync(authUser.id, cards);
                    setLastSyncedAt(Date.now());
                    setSyncFeedback('synced');
                    setTimeout(() => setSyncFeedback(null), 2000);
                  } catch {
                    setSyncFeedback('failed');
                  } finally {
                    setSyncingNow(false);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Sync now"
              >
                <RNView>
                  <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Last synced</Text>
                  <Text style={[styles.itemHint, { color: t.textMuted }]}>
                    {syncingNow
                      ? 'Syncing...'
                      : syncFeedback === 'synced'
                      ? 'Synced'
                      : syncFeedback === 'failed'
                      ? 'Sync failed. Try again.'
                      : lastSyncedAt
                      ? timeAgo(lastSyncedAt)
                      : 'Never'}
                  </Text>
                </RNView>
                <FontAwesome name="refresh" size={14} color={t.textMuted} />
              </Pressable>
            )}
          </>
        )}
      </SurfaceCard>
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    marginBottom: 8,
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  itemLabel: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  itemHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  defaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
});
