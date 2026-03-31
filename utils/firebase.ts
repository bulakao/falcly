import firestore from '@react-native-firebase/firestore';

/**
 * Initialize Firebase Firestore with offline persistence.
 * The native Firebase SDK encrypts cached data at rest on both iOS and Android.
 * Call once at app startup before any Firestore operations.
 */
export async function initFirestore(): Promise<void> {
  try {
    // Enable offline persistence — data is encrypted at rest by the native SDK
    // On iOS: uses SQLite with iOS Data Protection (file-level encryption)
    // On Android: uses SQLite with Android Keystore-backed encryption
    await firestore().settings({
      persistence: true,
      cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
    });
  } catch (error) {
    // Settings can only be called once before any other Firestore usage.
    // If already initialized, this is a no-op — safe to ignore.
    if (error instanceof Error && error.message.includes('already been called')) {
      return;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/** Firestore collection references for Pro cloud sync */
export const collections = {
  userCards: (userId: string) => firestore().collection('users').doc(userId).collection('cards'),
  userProfile: (userId: string) => firestore().collection('users').doc(userId),
} as const;
