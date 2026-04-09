import { useState } from 'react';
import { StyleSheet, Alert, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { posthog, trackUserSignedOut } from '@/utils/analytics';
import { Button } from '@/components/atoms';
import { SurfaceCard } from '@/components/molecules';

export function SettingsDangerSection() {
  const t = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const clearLocalData = useAuthStore((s) => s.clearLocalData);
  const tier = useSubscriptionStore((s) => s.tier);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Danger Zone</Text>
      <SurfaceCard>
        {user && (
          <>
            <Button
              label={busy ? 'Signing out...' : 'Sign Out'}
              disabled={busy}
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    onPress: async () => {
                      setBusy(true);
                      try {
                        trackUserSignedOut();
                        posthog.reset();
                        await signOut();
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : 'Sign out failed';
                        Alert.alert('Error', msg);
                      } finally {
                        setBusy(false);
                      }
                    },
                  },
                ]);
              }}
              variant="secondary"
            />
            <RNView style={styles.gap} />
          </>
        )}
        {user && (
          <>
            <Button
              label={busy ? 'Clearing...' : 'Clear Local Data'}
              variant="secondary"
              disabled={busy}
              onPress={() => {
                Alert.alert(
                  'Clear Local Data',
                  'This will erase all local data on this device. Your account and cloud backup are safe — data will re-sync when you sign back in.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: () => {
                        clearLocalData();
                        router.replace('/welcome');
                      },
                    },
                  ],
                );
              }}
            />
            <RNView style={styles.gap} />
          </>
        )}
        <Button
          label={busy ? 'Deleting...' : user ? 'Delete Account' : 'Clear All Data'}
          variant="destructive-outline"
          disabled={busy}
          onPress={() => {
            const hasSubscription = user && tier === 'pro';
            Alert.alert(
              user ? 'Delete Account' : 'Clear All Data',
              user
                ? `This will permanently delete your account and all your data. This cannot be undone.${hasSubscription ? '\n\nNote: This won\'t cancel your subscription. Please cancel it in your device settings first.' : ''}`
                : 'This will erase all your cards and data from this device. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: user ? 'Delete' : 'Clear',
                  style: 'destructive',
                  onPress: async () => {
                    setBusy(true);
                    try {
                      if (user) {
                        await deleteAccount();
                      } else {
                        clearLocalData();
                      }
                      router.replace('/welcome');
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : 'Failed to delete data';
                      Alert.alert('Error', msg);
                    } finally {
                      setBusy(false);
                    }
                  },
                },
              ],
            );
          }}
        />
      </SurfaceCard>
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: typeScale.callout,
    fontFamily: fonts.interSemiBold,
    marginBottom: 8,
    marginTop: 8,
  },
  gap: {
    height: 10,
  },
});
