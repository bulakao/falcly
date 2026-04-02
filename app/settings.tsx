import { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Alert,
  Switch,
  View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from '@/components/Themed';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/authStore';
import { useAppTheme } from '@/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { exportDataAsCSV } from '@/utils/csvExport';
import { Button, Badge, Heading, SectionHeader } from '@/components/atoms';
import { SectionCard, AlertBanner } from '@/components/molecules';

export default function SettingsScreen() {
  const t = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const clearLocalData = useAuthStore((s) => s.clearLocalData);

  const tier = useSubscriptionStore((s) => s.tier);
  const isTrialActive = useSubscriptionStore((s) => s.isTrialActive);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const isProPlus = useSubscriptionStore((s) => s.isProPlus);
  const planType = useSubscriptionStore((s) => s.planType);
  const trialDaysRemaining = useSubscriptionStore((s) => s.trialDaysRemaining);
  const getTrialEndDate = useSubscriptionStore((s) => s.getTrialEndDate);
  const trialEndDate = getTrialEndDate();

  const analyticsOptOut = useUserStore((s) => s.analyticsOptOut);
  const setAnalyticsOptOutStore = useUserStore((s) => s.setAnalyticsOptOut);
  const themePreference = useUserStore((s) => s.themePreference);
  const setThemePreference = useUserStore((s) => s.setThemePreference);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);

  const cards = useCardStore((s) => s.cards);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();
  const [exporting, setExporting] = useState(false);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
        <FontAwesome name="chevron-left" size={16} color={t.textMuted} />
      </Pressable>
      <Heading>Settings</Heading>

      {/* Account */}
      {user ? (
        <SectionCard>
          <SectionHeader title="Account" />
          <View style={styles.accountRow}>
            <RNView style={styles.accountAvatar}>
              {user.user_metadata?.avatar_url ? (
                <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.accountAvatarImage} />
              ) : (
                <FontAwesome name="user" size={18} color={t.textMuted} />
              )}
            </RNView>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: t.textPrimary }]}>{user.user_metadata?.full_name ?? 'User'}</Text>
              <Text style={[styles.accountEmail, { color: t.textMuted }]}>{user.email}</Text>
            </View>
          </View>
        </SectionCard>
      ) : (
        <SectionCard accentBorder={t.primary}>
          <View style={styles.accountPromptRow}>
            <FontAwesome name="shield" size={24} color={t.primary} />
            <View style={styles.accountPromptText}>
              <Text style={[styles.accountName, { color: t.textPrimary }]}>Back up your data</Text>
              <Text style={[styles.accountPromptSubtitle, { color: t.textSecondary }]}>
                Create a free account to sync across devices and keep your data safe.
              </Text>
            </View>
          </View>
          <View style={styles.accountPromptButtons}>
            <Button label="Create Account" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup' } })} />
            <Button label="Sign In" variant="secondary" onPress={() => router.push('/sign-in')} />
          </View>
        </SectionCard>
      )}

      {/* Subscription Status */}
      {(isTrialActive() || isPro() || isProPlus()) && (
        <SectionCard accentBorder={t.accent} accentBg={t.accentBg}>
          <View style={[styles.proBadgeRow, { backgroundColor: 'transparent' }]}>
            <Badge label={isProPlus() ? 'PRO+' : 'PRO'} variant="pro" />
            <Text style={[styles.proStatusText, { color: t.accentText }]}>
              {isTrialActive()
                ? `Free Trial · ${trialDaysRemaining()} days left`
                : planType === 'pro_annual' ? 'Pro — Annual'
                : planType === 'pro_quarterly' ? 'Pro — Quarterly'
                : planType === 'pro_monthly' ? 'Pro — Monthly'
                : planType === 'pro_plus_annual' ? 'Pro+ — Annual'
                : planType === 'pro_plus_quarterly' ? 'Pro+ — Quarterly'
                : planType === 'pro_plus_monthly' ? 'Pro+ — Monthly'
                : 'Active'}
            </Text>
          </View>
          {isTrialActive() && trialEndDate && (
            <Text style={[styles.trialEndText, { color: t.accent }]}>
              Trial ends{' '}
              {trialEndDate.toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
          {!isTrialActive() && planType && (
            <Text style={[styles.trialEndText, { color: t.accent }]}>
              {planType === 'pro_annual' ? '₱999/yr'
                : planType === 'pro_quarterly' ? '₱399/qtr'
                : planType === 'pro_monthly' ? '₱149/mo'
                : planType === 'pro_plus_annual' ? '₱1,699/yr'
                : planType === 'pro_plus_quarterly' ? '₱649/qtr'
                : '₱249/mo'} · Cancel anytime
            </Text>
          )}
        </SectionCard>
      )}

      {/* Export Data */}
      <SectionCard>
        <SectionHeader
          title="Export Data"
          subtitle="Export all your cards, installments, subscriptions, and profile data as a CSV file."
        />
        <Button
          label={exporting ? 'Exporting...' : 'Export as CSV'}
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
      </SectionCard>

      {/* Cloud Sync Status */}
      {(tier === 'pro' || tier === 'pro_plus') && (
        <SectionCard>
          <SectionHeader
            title="Cloud Sync"
            subtitle="Pro feature — sync your card data across devices."
          />
          {isOffline ? (
            <AlertBanner message="Cloud sync unavailable — you are offline. Your data is saved locally and all core features work normally." variant="stale" />
          ) : (
            <Text style={[styles.cloudOnlineText, { color: t.safe }]}>Connected — sync available</Text>
          )}
        </SectionCard>
      )}

      {/* Component Showcase */}
      <SectionCard>
        <SectionHeader
          title="Component Showcase"
          subtitle="Preview all UI components with the falcon premium palette."
        />
        <Button
          label="Open Showcase"
          onPress={() => router.push('/component-showcase')}
          variant="secondary"
        />
      </SectionCard>

      {/* Appearance */}
      <SectionCard>
        <SectionHeader title="Appearance" />
        <View style={styles.themeRow}>
          {(['system', 'light', 'dark'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setThemePreference(option)}
              style={[
                styles.themeOption,
                { borderColor: themePreference === option ? t.primary : t.border, backgroundColor: themePreference === option ? t.accentBg : t.surface },
              ]}
            >
              <FontAwesome
                name={option === 'system' ? 'adjust' : option === 'light' ? 'sun-o' : 'moon-o'}
                size={16}
                color={themePreference === option ? t.primary : t.textMuted}
              />
              <Text style={[styles.themeOptionText, { color: themePreference === option ? t.primary : t.textPrimary }]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      {/* Analytics Opt-Out */}
      <SectionCard>
        <SectionHeader
          title="Analytics"
          subtitle="Anonymous behavioral analytics help us improve Falcly. No personal or financial data is ever tracked."
        />
        <View style={styles.valueRow}>
          <Text style={[styles.optOutLabel, { color: t.textPrimary }]}>Opt out of analytics</Text>
          <Switch
            value={analyticsOptOut}
            onValueChange={setAnalyticsOptOutStore}
            trackColor={{ true: t.risky }}
          />
        </View>
      </SectionCard>

      {/* Sign Out */}
      {user && <SectionCard>
        <SectionHeader
          title="Sign Out"
          subtitle="Switch to a different account. Your local data stays on this device."
        />
        <Button
          label="Sign Out"
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                onPress: async () => {
                  try {
                    await signOut();
                    // _layout.tsx auth guard handles redirect to /sign-in
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
      </SectionCard>}

      {/* Delete Account / Clear Data */}
      <SectionCard>
        <SectionHeader
          title={user ? 'Delete Account' : 'Clear All Data'}
          subtitle={user
            ? 'Permanently removes your account, all cards, and associated data. This cannot be undone.'
            : 'Erase all cards, finances, and settings from this device. This cannot be undone.'}
        />
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
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  backButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
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
    fontWeight: '700',
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
    fontWeight: '600',
  },
  trialEndText: {
    fontSize: 13,
    marginTop: 8,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cloudOnlineText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dangerZone: {
    gap: 12,
  },
  optOutLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
