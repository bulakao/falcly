import { create } from 'zustand';
import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

GoogleSignin.configure({
  webClientId: '919376331601-3u0ig0ek6gbbmntsbtqsj5c90520u8sg.apps.googleusercontent.com',
});

interface AuthStore {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (credential: FirebaseAuthTypes.AuthCredential) => Promise<void>;
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
    const credential = auth.GoogleAuthProvider.credential(response.data.idToken);
    await auth().signInWithCredential(credential);
  },
  signInWithEmail: async (email: string, password: string) => {
    await auth().signInWithEmailAndPassword(email, password);
  },
  signUpWithEmail: async (email: string, password: string) => {
    await auth().createUserWithEmailAndPassword(email, password);
  },
  signOut: async () => {
    await auth().signOut();
    try { await GoogleSignin.signOut(); } catch { /* not signed in via Google */ }
    useCardStore.getState().reset();
    useUserStore.getState().reset();
    useSubscriptionStore.getState().reset();
  },
  deleteAccount: async (credential: FirebaseAuthTypes.AuthCredential) => {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('No user signed in');
    // Re-authenticate first (Firebase requires recent login before delete)
    await currentUser.reauthenticateWithCredential(credential);
    await currentUser.delete();
    try { await GoogleSignin.signOut(); } catch { /* not signed in via Google */ }
    useCardStore.getState().reset();
    useUserStore.getState().reset();
    useSubscriptionStore.getState().reset();
  },
  clearLocalData: () => {
    useCardStore.getState().reset();
    useUserStore.getState().reset();
    useSubscriptionStore.getState().reset();
  },
}));
