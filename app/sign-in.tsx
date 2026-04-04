import { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ActivityIndicator,
  ToastAndroid,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { Button, FormInput } from '@/components/atoms';
import { useAuthStore } from '@/store/authStore';
import { useCardStore } from '@/store/cardStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { syncOnSignIn, type SyncResult } from '@/utils/sync';
import { supabase } from '@/utils/supabase';

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
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [mode, setMode] = useState<'signin' | 'signup'>(
    initialMode === 'signup' ? 'signup' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  async function handlePostSignInSync() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const localCards = useCardStore.getState().cards;
      const result = await syncOnSignIn(user.id, localCards);
      setSyncResult(result);
      if (result.action === 'uploaded') {
        showToast('Your cards have been backed up');
      }
    } catch {
      // Sync failure should not block sign-in
    }
  }

  const isSignUp = mode === 'signup';

  function clearErrors() {
    setEmailError('');
    setPasswordError('');
  }

  async function handleEmailAuth() {
    clearErrors();
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
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      await handlePostSignInSync();
      router.back();
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
      await handlePostSignInSync();
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google Sign-In failed';
      setEmailError(msg);
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
          {isSignUp ? 'Create Account' : 'Welcome back'}
        </Text>
        <Text style={[styles.subtitle, { color: resetSent ? t.safe : t.textSecondary }]}>
          {resetSent
            ? `Password reset link sent to ${email.trim()}.`
            : isSignUp
            ? 'Back up your data and sync across devices.'
            : 'Sign in to sync your data.'}
        </Text>

        <Button
          label={loading ? 'Please wait...' : 'Continue with Google'}
          onPress={handleGoogleSignIn}
          disabled={loading}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
          <Text style={[styles.dividerText, { color: t.textMuted }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
        </View>

        <View style={styles.form}>
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
              label={loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              onPress={handleEmailAuth}
              disabled={loading}
              variant="secondary"
            />
          </View>
        </View>

        {loading && (
          <ActivityIndicator style={styles.spinner} color={t.primary} />
        )}

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
    fontSize: 24,
    fontFamily: fonts.interBold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
  },
  fieldError: {
    fontSize: 13,
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
    fontSize: 14,
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
    fontSize: 13,
    marginHorizontal: 16,
  },
  passwordHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 13,
  },
  spinner: {
    marginTop: 16,
  },
});
