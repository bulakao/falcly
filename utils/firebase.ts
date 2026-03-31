import { getFirestore, collection, doc } from '@react-native-firebase/firestore';

const db = getFirestore();

export async function initFirestore(): Promise<void> {
  try {
    await db.settings({
      persistence: true,
      cacheSizeBytes: -1, // CACHE_SIZE_UNLIMITED
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already been called')) {
      return;
    }
    throw error;
  }
}

export const collections = {
  userCards: (userId: string) => collection(doc(collection(db, 'users'), userId), 'cards'),
  userProfile: (userId: string) => doc(collection(db, 'users'), userId),
} as const;
