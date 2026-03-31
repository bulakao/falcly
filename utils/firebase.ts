import { getApp } from '@react-native-firebase/app';
import { initializeFirestore, getFirestore, collection, doc } from '@react-native-firebase/firestore';

let db = getFirestore();

export async function initFirestore(): Promise<void> {
  try {
    db = await initializeFirestore(getApp(), {
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
