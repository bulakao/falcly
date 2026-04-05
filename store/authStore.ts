import { create } from 'zustand';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { logoutUser } from '@/utils/revenuecat';
import Constants from 'expo-constants';

GoogleSignin.configure({
  webClientId: Constants.expoConfig?.extra?.googleWebClientId as string,
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId as string,
});

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearLocalData: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signInWithGoogle: async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!response.data?.idToken) {
      throw new Error('Google Sign-In failed: no ID token');
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.data.idToken,
    });
    if (error) throw error;
    if (data.user) set({ user: data.user, loading: false });
  },
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) set({ user: data.user, loading: false });
  },
  signUpWithEmail: async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: name ? { data: { full_name: name } } : undefined,
    });
    if (__DEV__) {
      console.log('[AUTH] signUp response:', JSON.stringify({
        error: error?.message,
        userId: data?.user?.id,
        identities: data?.user?.identities?.length,
        session: !!data?.session,
        confirmedAt: data?.user?.confirmed_at,
        emailConfirmedAt: data?.user?.email_confirmed_at,
      }));
    }
    if (error) throw error;
    // Supabase returns a fake user with empty identities when email already exists
    // (email confirmation enabled — prevents enumeration attacks)
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('An account with this email is already registered.');
    }
    // If email confirmation is disabled, Supabase creates a session even for duplicates
    // but the created_at will be in the past — detect this
    if (data.user && data.session) {
      const createdAt = new Date(data.user.created_at).getTime();
      const now = Date.now();
      // If user was created more than 30 seconds ago, it's an existing account
      if (now - createdAt > 30_000) {
        await supabase.auth.signOut();
        throw new Error('An account with this email is already registered.');
      }
    }
    if (data.user) set({ user: data.user, loading: false });
  },
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    try { await GoogleSignin.signOut(); } catch { /* not signed in via Google */ }
    try { await logoutUser(); } catch { /* RC logout — resets to anonymous */ }
    set({ user: null, loading: false });
    // Clear local data but keep onboarding complete
    // User stays on sign-in screen, not sent back through onboarding
    useCardStore.getState().reset();
    useUserStore.getState().reset();
    useSubscriptionStore.getState().reset();
  },
  deleteAccount: async () => {
    // Check if user has active subscription — warn them first
    const tier = useSubscriptionStore.getState().tier;
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw error;
    try { await GoogleSignin.signOut(); } catch { /* not signed in via Google */ }
    try { await logoutUser(); } catch { /* RC logout — resets to anonymous */ }
    set({ user: null, loading: false });
    // Delete account wipes everything local + resets onboarding
    useCardStore.getState().reset();
    useUserStore.getState().reset();
    useSubscriptionStore.getState().reset();
    useOnboardingStore.getState().reset();
  },
  clearLocalData: () => {
    useCardStore.getState().reset();
    useUserStore.getState().reset();
    useSubscriptionStore.getState().reset();
    useOnboardingStore.getState().reset();
  },
}));
