import { create } from 'zustand';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useOnboardingStore } from '@/store/onboardingStore';
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
  signUpWithEmail: (email: string, password: string) => Promise<void>;
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
  signUpWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) set({ user: data.user, loading: false });
  },
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    try { await GoogleSignin.signOut(); } catch { /* not signed in via Google */ }
    set({ user: null, loading: false });
    // Local data (cards, profile, onboarding) persists — sign-out only clears auth
    useSubscriptionStore.getState().reset();
  },
  deleteAccount: async () => {
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw error;
    try { await GoogleSignin.signOut(); } catch { /* not signed in via Google */ }
    set({ user: null, loading: false });
    // Delete account wipes everything
    useCardStore.getState().reset();
    useUserStore.getState().reset();
    useSubscriptionStore.getState().reset();
  },
  clearLocalData: () => {
    useCardStore.getState().reset();
    useUserStore.getState().reset();
    useSubscriptionStore.getState().reset();
    useOnboardingStore.getState().reset();
  },
}));
