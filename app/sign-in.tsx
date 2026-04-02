import { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { Button, FormInput } from '@/components/atoms';
import { useAuthStore } from '@/store/authStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login')) return 'Incorrect email or password.';
  if (lower.includes('already registered')) return 'An account with this email already exists.';
  if (lower.includes('too many')) return 'Too many attempts. Please wait a moment.';
  if (lower.includes('invalid email')) return 'Check your email format.';
  return message;
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
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const isSignUp = mode === 'signup';

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password.');
      return;
    }
    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      setError(mapAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google Sign-In failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Type your email address above, then tap Forgot Password.');
      return;
    }
    setError('');
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send reset email';
      setError(msg);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: t.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: t.textMuted }]}>← Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: t.textPrimary }]}>
          {isSignUp ? 'Create Account' : 'Welcome back'}
        </Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          {isSignUp
            ? 'Back up your data and sync across devices.'
            : 'Sign in to sync your data.'}
        </Text>

        {error !== '' && (
          <Text style={[styles.errorText, { color: t.risky }]}>{error}</Text>
        )}
        {resetSent && (
          <Text style={[styles.successText, { color: t.safe }]}>
            Password reset link sent to {email.trim()}.
          </Text>
        )}

        <View style={styles.form}>
          <FormInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.spacer} />
          <FormInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
          <View style={styles.buttonWrapper}>
            <Button
              label={loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              onPress={handleEmailAuth}
              disabled={loading}
            />
          </View>

          {!isSignUp && (
            <Pressable onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: t.textMuted }]}>
                Forgot password?
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
          <Text style={[styles.dividerText, { color: t.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
        </View>

        <Button
          label={loading ? 'Please wait...' : 'Continue with Google'}
          onPress={handleGoogleSignIn}
          variant="secondary"
          disabled={loading}
        />

        {loading && (
          <ActivityIndicator style={styles.spinner} color={t.primary} />
        )}

        <Pressable
          onPress={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(''); setResetSent(false); }}
          style={styles.toggle}
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
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
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
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  form: {
    marginBottom: 24,
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
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 13,
    marginHorizontal: 16,
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
  },
  spinner: {
    marginTop: 16,
  },
});
