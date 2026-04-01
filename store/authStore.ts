import { create } from 'zustand';
import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '919376331601-3u0ig0ek6gbbmntsbtqsj5c90520u8sg.apps.googleusercontent.com',
});

interface AuthStore {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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
  signOut: async () => {
    await auth().signOut();
    await GoogleSignin.signOut();
  },
}));
