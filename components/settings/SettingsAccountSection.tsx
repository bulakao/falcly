import { useState } from 'react';
import { StyleSheet, Pressable, Image, Alert, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { fullSync } from '@/utils/sync';
import { supabase } from '@/utils/supabase';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Button, Badge } from '@/components/atoms';
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

export function SettingsAccountSection() {
  const t = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const tier = useSubscriptionStore((s) => s.tier);
  const subExpirationDate = useSubscriptionStore((s) => s.getExpirationDate);
  const cards = useCardStore((s) => s.cards);
  const lastSyncedAt = useUserStore((s) => s.lastSyncedAt);
  const setLastSyncedAt = useUserStore((s) => s.setLastSyncedAt);
  const { isOffline } = useNetworkStatus();
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<'synced' | 'failed' | null>(null);

  return (
    <>
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Account</Text>
      <SurfaceCard>
        {user ? (
          <RNView style={styles.accountRow}>
            <RNView style={styles.accountAvatar}>
              {user.user_metadata?.avatar_url ? (
                <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.accountAvatarImage} />
              ) : (
                <FontAwesome name="user" size={18} color={t.textMuted} />
              )}
            </RNView>
            <RNView style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: t.textPrimary }]}>{user.user_metadata?.full_name ?? 'User'}</Text>
              <Text style={[styles.accountEmail, { color: t.textMuted }]}>{user.email}</Text>
            </RNView>
          </RNView>
        ) : (
          <>
            <RNView style={styles.accountPromptRow}>
              <FontAwesome name="shield" size={24} color={t.primary} />
              <RNView style={styles.accountPromptText}>
                <Text style={[styles.accountName, { color: t.textPrimary }]}>Back up your data</Text>
                <Text style={[styles.accountPromptSubtitle, { color: t.textSecondary }]}>
                  Create a free account to sync across devices and keep your data safe.
                </Text>
              </RNView>
            </RNView>
            <RNView style={styles.accountPromptButtons}>
              <Button label="Create Account" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup' } })} />
              <Button label="Sign In" variant="secondary" onPress={() => router.push('/sign-in')} />
            </RNView>
          </>
        )}

        {user && (
          <>
            <RNView style={[styles.divider, { backgroundColor: t.border }]} />
            {isOffline ? (
              <AlertBanner message="You are offline. Data is saved locally." variant="stale" />
            ) : (
              <RNView style={styles.syncRow}>
                <RNView>
                  <Text style={[styles.syncLabel, { color: t.textPrimary }]}>Last synced</Text>
                  <Text style={[styles.syncHint, { color: t.textMuted }]}>
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
                <Pressable
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
                  disabled={syncingNow}
                  style={({ pressed }) => [
                    styles.syncButton,
                    { backgroundColor: t.inputBg, borderColor: t.inputBorder, opacity: pressed || syncingNow ? 0.6 : 1 },
                  ]}
                >
                  <FontAwesome name="refresh" size={12} color={t.textSecondary} />
                  <Text style={[styles.syncButtonText, { color: t.textSecondary }]}>
                    {syncingNow ? 'Syncing…' : 'Sync'}
                  </Text>
                </Pressable>
              </RNView>
            )}
          </>
        )}

        {isPro() && (
          <>
            <RNView style={[styles.divider, { backgroundColor: t.border }]} />
            <RNView style={styles.proBadgeRow}>
              <Badge label="PRO" variant="pro" />
              <Text style={[styles.proStatusText, { color: t.accentText }]}>
                Pro — Active
              </Text>
            </RNView>
            {subExpirationDate() && (
              <Text style={[styles.trialEndText, { color: t.accent }]}>
                Renews{' '}
                {subExpirationDate()!.toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            )}
            <Pressable
              onPress={async () => {
                try {
                  const RevenueCatUI = (await import('react-native-purchases-ui')).default;
                  await RevenueCatUI.presentCustomerCenter();
                } catch (e) {
                  console.error('Customer Center error:', e);
                }
              }}
              style={styles.manageSubButton}
            >
              <Text style={[styles.manageSubText, { color: t.primary }]}>Manage Subscription</Text>
            </Pressable>
          </>
        )}
        {tier === 'free' && (
          <>
            <RNView style={[styles.divider, { backgroundColor: t.border }]} />
            <Pressable
              onPress={() => router.push('/paywall-manual' as any)}
              style={styles.manageSubButton}
            >
              <Text style={[styles.manageSubText, { color: t.primary }]}>Upgrade to Pro</Text>
            </Pressable>
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
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  accountAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  accountInfo: {
    flex: 1,
  },
  accountPromptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  accountPromptText: {
    flex: 1,
  },
  accountPromptSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  accountPromptButtons: {
    gap: 10,
  },
  accountName: {
    fontSize: 15,
    fontFamily: fonts.interBold,
  },
  accountEmail: {
    fontSize: 12,
  },
  proBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proStatusText: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
  },
  trialEndText: {
    fontSize: 13,
    marginTop: 8,
  },
  manageSubButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  manageSubText: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncLabel: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  syncHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  syncButtonText: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
  },
});
