import { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  View,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { Button, FormInput } from '@/components/atoms';
import { useAuthStore } from '@/store/authStore';
import { useAppTheme } from '@/theme';

export default function SignInScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google Sign-In failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Type your email address above, then tap Forgot Password.');
      return;
    }
    try {
      await auth().sendPasswordResetEmail(email.trim());
      Alert.alert('Check your inbox', `A password reset link has been sent to ${email.trim()}.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send reset email';
      Alert.alert('Error', msg);
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
        {/* Header */}
        <Text style={[styles.title, { color: t.textPrimary }]}>Falcly</Text>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>
          Is it safe to swipe right now?
        </Text>

        {/* Email + Password */}
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

          <Pressable onPress={() => setIsSignUp((v) => !v)} style={styles.toggle}>
            <Text style={[styles.toggleText, { color: t.textMuted }]}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={{ color: t.primary, fontWeight: '600' }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </Pressable>

          {!isSignUp && (
            <Pressable onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: t.textMuted }]}>
                Forgot password?
              </Text>
            </Pressable>
          )}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
          <Text style={[styles.dividerText, { color: t.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
        </View>

        {/* Google */}
        <Button
          label={loading ? 'Please wait...' : 'Continue with Google'}
          onPress={handleGoogleSignIn}
          variant="secondary"
          disabled={loading}
        />

        {loading && (
          <ActivityIndicator style={styles.spinner} color={t.primary} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    marginBottom: 24,
  },
  spacer: {
    height: 12,
  },
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
