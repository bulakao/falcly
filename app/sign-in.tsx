import { useState, useLayoutEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ToastAndroid,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { Button, FormInput } from '@/components/atoms';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { syncOnSignIn, uploadCard, type SyncResult } from '@/utils/sync';
import { supabase } from '@/utils/supabase';
import { MergePrompt } from '@/components/organisms/MergePrompt';
import type { Card } from '@/types/card';
import {
  posthog,
  trackCardAdded,
  trackUserSignedIn,
  trackUserSignedUp,
  trackOnboardingSignupCompleted,
} from '@/utils/analytics';

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login')) return 'Incorrect email or password.';
  if (lower.includes('already registered')) return 'An account with this email already exists.';
  if (lower.includes('too many')) return 'Too many attempts. Please wait a moment.';
  if (lower.includes('invalid email')) return 'Check your email format.';
  return message;
}

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function SignInScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const { mode: initialMode, pendingCard, fromOnboarding, toPaywall, locked } = useLocalSearchParams<{
    mode?: string;
    pendingCard?: string;
    fromOnboarding?: string;
    toPaywall?: string;  // after auth, show paywall before dashboard
    locked?: string;     // no back button, returning user must sign in
  }>(); 
  const navigation = useNavigation();

  // Hide back button when user signed out (locked mode) — must sign in to continue
  useLayoutEffect(() => {
    if (locked === 'true') {
      navigation.setOptions({ headerBackVisible: false, gestureEnabled: false });
    }
  }, [locked, navigation]);

  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [mode, setMode] = useState<'signin' | 'signup'>(
    initialMode === 'signup' || fromOnboarding === 'true' ? 'signup' : 'signin',
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  /** Returns true if sign-in screen should navigate away, false if merge prompt is shown. */
  async function handlePostSignInSync(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true;
      const localCards = useCardStore.getState().cards;
      const result = await syncOnSignIn(user.id, localCards);
      setSyncResult(result);
      if (result.action === 'uploaded') {
        showToast('Your cards have been backed up');
      } else if (result.action === 'restored' && result.cloudCards) {
        useCardStore.getState().bulkImport(result.cloudCards);
        showToast(`Restored ${result.cloudCards.length} cards from your account`);
      } else if (result.action === 'merge_needed') {
        return false; // Stay on screen to show MergePrompt
      }
    } catch {
      // Sync failure should not block sign-in
    }
    return true;
  }

  function savePendingCard() {
    if (!pendingCard || fromOnboarding !== 'true') return;
    try {
      const cardData = JSON.parse(pendingCard);
      const { addCard } = useCardStore.getState();
      const { defaultInterestRate, defaultMinPaymentPct, defaultMinPaymentFloor } = useUserStore.getState();

      addCard({
        bankName: cardData.bankName,
        creditLimit: parseFloat(cardData.creditLimit),
        outstandingBalance: parseFloat(cardData.outstandingBalance),
        statementDay: parseInt(cardData.statementDay, 10),
        dueDayOffset: parseInt(cardData.dueDayOffset, 10),
        interestRate: defaultInterestRate,
        minPaymentPct: defaultMinPaymentPct,
        minPaymentFloor: defaultMinPaymentFloor,
      });

      trackCardAdded('onboarding');
    } catch (e) {
      console.warn('Failed to save pending card:', e);
    }
  }

  function navigateAfterAuth() {
    if (fromOnboarding === 'true') {
      savePendingCard();
    }
    // Always mark onboarding complete after any successful auth
    // Returning users (sign-in) skip onboarding; new users already went through it
    useOnboardingStore.getState().complete();

    if (toPaywall === 'true') {
      router.replace(('/paywall-manual?fromOnboarding=true') as any);
    } else {
      router.replace('/');
    }
  }

  async function handleKeepLocal() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const localCards = useCardStore.getState().cards;
      await Promise.all(localCards.map((card) => uploadCard(user.id, card)));
      showToast('Sync complete');
    } catch {
      showToast('Sync failed');
    }
    setSyncResult(null);
    navigateAfterAuth();
  }

  async function handleRestoreCloud() {
    if (!syncResult?.cloudCards) return;
    useCardStore.getState().reset();
    useCardStore.getState().bulkImport(syncResult.cloudCards);
    showToast('Sync complete');
    setSyncResult(null);
    navigateAfterAuth();
  }

  async function handleMergeBoth() {
    if (!syncResult?.cloudCards) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const localCards = useCardStore.getState().cards;
      const cloudCards = syncResult.cloudCards;

      // Deduplicate by bankName+statementDay, keep latest updatedAt
      const merged = new Map<string, Card>();
      for (const card of localCards) {
        const key = `${card.bankName}::${card.statementDay}`;
        merged.set(key, card);
      }
      for (const card of cloudCards) {
        const key = `${card.bankName}::${card.statementDay}`;
        const existing = merged.get(key);
        if (!existing || (card.createdAt > existing.createdAt)) {
          merged.set(key, card);
        }
      }

      const mergedCards = Array.from(merged.values());
      useCardStore.getState().reset();
      useCardStore.getState().bulkImport(mergedCards);
      await Promise.all(mergedCards.map((card) => uploadCard(user.id, card)));
      showToast('Sync complete');
    } catch {
      showToast('Sync failed');
    }
    setSyncResult(null);
    navigateAfterAuth();
  }

  const isSignUp = mode === 'signup';

  function clearErrors() {
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  }

  async function handleEmailAuth() {
    clearErrors();
    if (isSignUp && !fullName.trim()) {
      setGeneralError('Enter your name.');
      return;
    }
    if (!email.trim()) {
      setEmailError('Enter your email.');
      return;
    }
    if (!password.trim()) {
      setPasswordError('Enter your password.');
      return;
    }
    if (isSignUp && password.length < 6) {
      setPasswordError('Must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, fullName.trim());
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          posthog.identify(newUser.id, { $set: { email: newUser.email ?? '', name: fullName.trim() } });
          trackUserSignedUp('email');
          if (fromOnboarding === 'true') trackOnboardingSignupCompleted('email');
        }
      } else {
        await signInWithEmail(email.trim(), password);
        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        if (signedInUser) {
          posthog.identify(signedInUser.id, { $set: { email: signedInUser.email ?? '' } });
          trackUserSignedIn('email');
        }
      }
      const shouldNavigate = await handlePostSignInSync();
      if (shouldNavigate) navigateAfterAuth();
    } catch (e: unknown) {
      const msg = mapAuthError(e instanceof Error ? e.message : 'Authentication failed');
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account')) {
        setEmailError(msg);
      } else {
        setPasswordError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    clearErrors();
    setLoading(true);
    try {
      await signInWithGoogle();
      const { data: { user: googleUser } } = await supabase.auth.getUser();
      if (googleUser) {
        posthog.identify(googleUser.id, { $set: { email: googleUser.email ?? '' } });
        trackUserSignedIn('google');
        if (fromOnboarding === 'true') trackOnboardingSignupCompleted('google');
      }
      const shouldNavigate = await handlePostSignInSync();
      if (shouldNavigate) navigateAfterAuth();
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : '';
      const lower = raw.toLowerCase();
      if (lower.includes('cancel')) {
        // User cancelled — no error to show
      } else if (lower.includes('url scheme') || lower.includes('missing support')) {
        setGeneralError('Google Sign-In is not configured for this device.');
      } else if (lower.includes('network')) {
        setGeneralError('Network error. Check your connection and try again.');
      } else {
        setGeneralError('Google Sign-In failed. Try email instead.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    clearErrors();
    if (!email.trim()) {
      setEmailError('Enter your email first.');
      return;
    }
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send reset email';
      setEmailError(msg);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: t.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 80 }]}
        keyboardShouldPersistTaps="handled"
      >

        <Text style={[styles.title, { color: t.textPrimary }]}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Text>
        {fromOnboarding === 'true' && (
          <Text style={[styles.savePrompt, { color: t.textSecondary }]}>
            Create an account to save your card and sync across devices.
          </Text>
        )}
        <Text style={[styles.subtitle, { color: resetSent ? t.safe : t.textSecondary }]}>
          {resetSent
            ? `Password reset link sent to ${email.trim()}.`
            : isSignUp
            ? 'Back up your data and sync across devices.'
            : 'Sign in to sync your data.'}
        </Text>

        <Button
          label="Continue with Google"
          onPress={handleGoogleSignIn}
          loading={loading}
        />
        <Text style={[styles.generalError, { color: generalError ? t.risky : 'transparent' }]}>
          {generalError || ' '}
        </Text>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
          <Text style={[styles.dividerText, { color: t.textMuted }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <>
              <FormInput
                value={fullName}
                onChangeText={(v) => { setFullName(v); setGeneralError(''); }}
                placeholder="Full name"
                autoCapitalize="words"
                autoCorrect={false}
                accessibilityLabel="Full name"
              />
              <View style={styles.spacer} />
            </>
          )}
          <FormInput
            value={email}
            onChangeText={(v) => { setEmail(v); setEmailError(''); }}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={!!emailError}
            accessibilityLabel="Email"
          />
          <Text style={[styles.fieldError, { color: emailError ? t.risky : 'transparent' }]}>
            {emailError || ' '}
          </Text>
          <View style={styles.spacer} />
          <FormInput
            value={password}
            onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
            placeholder="Password"
            secureTextEntry
            error={!!passwordError}
            accessibilityLabel="Password"
          />
          <View style={styles.passwordHintRow}>
            <Text style={[styles.fieldError, { color: passwordError ? t.risky : 'transparent', flex: 1 }]}>
              {passwordError || ' '}
            </Text>
            {!isSignUp && (
              <Pressable onPress={handleForgotPassword} hitSlop={8} accessibilityRole="button" accessibilityLabel="Forgot password">
                <Text style={[styles.forgotPasswordText, { color: t.textMuted }]}>
                  Forgot password?
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              label={isSignUp ? 'Create Account' : 'Sign In'}
              onPress={handleEmailAuth}
              loading={loading}
              variant="secondary"
            />
          </View>
        </View>

        <Pressable
          onPress={() => { setMode(isSignUp ? 'signin' : 'signup'); clearErrors(); setResetSent(false); }}
          style={styles.toggle}
          accessibilityRole="button"
          accessibilityLabel={isSignUp ? 'Switch to sign in' : 'Switch to create account'}
        >
          <Text style={[styles.toggleText, { color: t.textMuted }]}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={{ color: t.primary, fontFamily: fonts.interSemiBold }}>
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>

      {syncResult?.action === 'merge_needed' && syncResult.cloudCards && (
        <MergePrompt
          localCount={useCardStore.getState().cards.length}
          cloudCards={syncResult.cloudCards}
          onKeepLocal={handleKeepLocal}
          onRestoreCloud={handleRestoreCloud}
          onMerge={handleMergeBoth}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: typeScale.h4,
    fontFamily: fonts.interBold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typeScale.body,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
  },
  fieldError: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interMedium,
    marginTop: 4,
  },
  spacer: { height: 12 },
  buttonWrapper: {
    marginTop: 20,
  },
  toggle: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  toggleText: {
    fontSize: typeScale.body,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: typeScale.subhead,
    marginHorizontal: 16,
  },
  passwordHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: typeScale.subhead,
  },
  generalError: {
    fontSize: typeScale.body,
    fontFamily: fonts.interMedium,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 0,
  },
  savePrompt: {
    fontSize: typeScale.body,
    textAlign: 'center',
    marginBottom: 8,
  },
});
