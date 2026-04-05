import { StyleSheet, Pressable, Image, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Button, Badge } from '@/components/atoms';
import { SurfaceCard } from '@/components/molecules';

export function SettingsAccountSection() {
  const t = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const tier = useSubscriptionStore((s) => s.tier);
  const subExpirationDate = useSubscriptionStore((s) => s.getExpirationDate);

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
});
