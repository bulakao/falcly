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
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAppTheme } from '@/theme';
import { trackOnboardingSignupCompleted } from '@/utils/analytics';

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    default:
      return 'Sign-up failed. Please try again.';
  }
}

export default function SignUpScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEmailSignUp() {
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      trackOnboardingSignupCompleted('email');
      useOnboardingStore.getState().setStep('card_entry');
      router.replace('/onboarding');
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      trackOnboardingSignupCompleted('google');
      useOnboardingStore.getState().setStep('card_entry');
      router.replace('/onboarding');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google Sign-In failed';
      setError(msg);
    } finally {
      setLoading(false);
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
        <Text style={[styles.title, { color: t.textPrimary }]}>Create your account</Text>

        {error !== '' && (
          <Text style={[styles.errorText, { color: t.risky }]}>{error}</Text>
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
              label={loading ? 'Please wait...' : 'Create Account'}
              onPress={handleEmailSignUp}
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
          <Text style={[styles.dividerText, { color: t.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
        </View>

        <Button
          label={loading ? 'Please wait...' : 'Continue with Google'}
          onPress={handleGoogleSignUp}
          variant="secondary"
          disabled={loading}
        />

        {loading && (
          <ActivityIndicator style={styles.spinner} color={t.primary} />
        )}

        <Pressable onPress={() => router.replace('/sign-in')} style={styles.toggle}>
          <Text style={[styles.toggleText, { color: t.textMuted }]}>
            Already have an account?{' '}
            <Text style={{ color: t.primary, fontWeight: '600' }}>Sign in</Text>
          </Text>
        </Pressable>

        <Text style={[styles.legal, { color: t.textMuted }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
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
  form: {
    marginBottom: 24,
  },
  spacer: { height: 12 },
  buttonWrapper: {
    marginTop: 20,
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
  toggle: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  toggleText: {
    fontSize: 14,
  },
  legal: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  spinner: {
    marginTop: 16,
  },
});
