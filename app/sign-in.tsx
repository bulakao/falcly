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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { Button, FormInput } from '@/components/atoms';
import { useAuthStore } from '@/store/authStore';
import { useAppTheme } from '@/theme';

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Try again or reset it.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment.';
    case 'auth/invalid-email':
      return 'Check your email format.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

export default function SignInScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 60 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: t.textPrimary }]}>Welcome back</Text>

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
              label={loading ? 'Please wait...' : 'Sign In'}
              onPress={handleEmailAuth}
              disabled={loading}
            />
          </View>

          <Pressable onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: t.textMuted }]}>
              Forgot password?
            </Text>
          </Pressable>
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

        <Pressable onPress={() => router.replace('/welcome')} style={styles.toggle}>
          <Text style={[styles.toggleText, { color: t.textMuted }]}>
            Don&apos;t have an account?{' '}
            <Text style={{ color: t.primary, fontWeight: '600' }}>Sign up</Text>
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
    fontWeight: '700',
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
