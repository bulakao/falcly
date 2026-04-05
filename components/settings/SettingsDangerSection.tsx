import { StyleSheet, Alert, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { useAuthStore } from '@/store/authStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
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

  return (
    <>
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Danger Zone</Text>
      <SurfaceCard>
        {user && (
          <>
            <Button
              label="Sign Out"
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    onPress: async () => {
                      try {
                        trackUserSignedOut();
                        posthog.reset();
                        await signOut();
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : 'Sign out failed';
                        Alert.alert('Error', msg);
                      }
                    },
                  },
                ]);
              }}
              variant="secondary"
            />
            <RNView style={[styles.divider, { backgroundColor: t.border }]} />
          </>
        )}
        <Button
          label={user ? 'Delete Account' : 'Clear All Data'}
          variant="destructive-outline"
          onPress={() => {
            Alert.alert(
              user ? 'Delete Account' : 'Clear All Data',
              user
                ? 'This will permanently delete your account and all your data. This cannot be undone.'
                : 'This will erase all your cards and data from this device. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: user ? 'Delete' : 'Clear',
                  style: 'destructive',
                  onPress: async () => {
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
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    marginBottom: 8,
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
});
