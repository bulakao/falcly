/**
 * Pro cloud sync service.
 * Encrypts card config client-side (AES-256-GCM) before writing to Firestore.
 * Firestore stores ciphertext only — balances and transactions never leave the device unencrypted.
 *
 * Requires: Pro subscription + network connectivity + user authentication (future).
 */

import { Card } from '@/types/card';
import { encrypt, decrypt, EncryptedPayload } from '@/utils/encryption';
import { collections } from '@/utils/firebase';
import { secureLog } from '@/utils/secureLogger';

/** Fields that are encrypted before cloud transmission */
const SENSITIVE_CARD_FIELDS: (keyof Card)[] = [
  'creditLimit',
  'outstandingBalance',
  'pendingTransactions',
  'installmentsMonthlyAmount',
  'subscriptionsThisCycle',
  'annualFee',
];

/** Cloud-synced card document shape in Firestore */
interface SyncedCardDocument {
  /** Non-sensitive metadata (plaintext, queryable) */
  id: string;
  bankName: string;
  statementDay: number;
  dueDayOffset: number;
  balanceUpdatedAt: number;
  createdAt: number;
  /** Encrypted sensitive fields (AES-256-GCM ciphertext) */
  encrypted: EncryptedPayload;
  /** Sync metadata */
  syncedAt: number;
}

/**
 * Encrypt a card's sensitive fields for cloud storage.
 * Returns a document with plaintext metadata + encrypted sensitive data.
 */
export function prepareCardForSync(card: Card, encryptionKey: Uint8Array): SyncedCardDocument {
  // Extract sensitive fields into a separate object for encryption
  const sensitiveData: Record<string, unknown> = {};
  for (const field of SENSITIVE_CARD_FIELDS) {
    sensitiveData[field] = card[field];
  }
  // Include non-enumerated fields that should also be encrypted
  sensitiveData.interestRate = card.interestRate;
  sensitiveData.minPaymentPct = card.minPaymentPct;
  sensitiveData.minPaymentFloor = card.minPaymentFloor;
  sensitiveData.annualFeeMonth = card.annualFeeMonth;

  const encrypted = encrypt(sensitiveData, encryptionKey);

  return {
    id: card.id,
    bankName: card.bankName,
    statementDay: card.statementDay,
    dueDayOffset: card.dueDayOffset,
    balanceUpdatedAt: card.balanceUpdatedAt,
    createdAt: card.createdAt,
    encrypted,
    syncedAt: Date.now(),
  };
}

/**
 * Decrypt a cloud-synced card document back to a full Card object.
 */
export function restoreCardFromSync(doc: SyncedCardDocument, encryptionKey: Uint8Array): Card {
  const sensitiveData = decrypt(doc.encrypted, encryptionKey);

  return {
    id: doc.id,
    bankName: doc.bankName,
    statementDay: doc.statementDay,
    dueDayOffset: doc.dueDayOffset,
    balanceUpdatedAt: doc.balanceUpdatedAt,
    createdAt: doc.createdAt,
    creditLimit: sensitiveData.creditLimit as number,
    outstandingBalance: sensitiveData.outstandingBalance as number,
    pendingTransactions: sensitiveData.pendingTransactions as number,
    installmentsMonthlyAmount: sensitiveData.installmentsMonthlyAmount as number,
    subscriptionsThisCycle: sensitiveData.subscriptionsThisCycle as number,
    annualFee: sensitiveData.annualFee as number,
    annualFeeMonth: sensitiveData.annualFeeMonth as number,
    interestRate: sensitiveData.interestRate as number,
    minPaymentPct: sensitiveData.minPaymentPct as number,
    minPaymentFloor: sensitiveData.minPaymentFloor as number,
  };
}

/**
 * Sync a card to Firestore with client-side encryption.
 * Only available for Pro users with network connectivity.
 *
 * @param userId - Authenticated user ID (from Firebase Auth, future)
 * @param card - Card to sync
 * @param encryptionKey - User's encryption key
 */
export async function syncCardToCloud(
  userId: string,
  card: Card,
  encryptionKey: Uint8Array,
): Promise<void> {
  const doc = prepareCardForSync(card, encryptionKey);

  secureLog('CloudSync', `Syncing card ${card.id} for user ${userId}`);

  await collections.userCards(userId).doc(card.id).set(doc);
}

/**
 * Fetch and decrypt a card from Firestore.
 *
 * @param userId - Authenticated user ID
 * @param cardId - Card document ID
 * @param encryptionKey - User's encryption key
 * @returns Decrypted Card or null if not found
 */
export async function fetchCardFromCloud(
  userId: string,
  cardId: string,
  encryptionKey: Uint8Array,
): Promise<Card | null> {
  const snapshot = await collections.userCards(userId).doc(cardId).get();

  if (!snapshot.exists) {
    return null;
  }

  const doc = snapshot.data() as SyncedCardDocument;
  return restoreCardFromSync(doc, encryptionKey);
}
