/**
 * Client-side AES-256-GCM encryption for Pro cloud sync.
 * Card config is encrypted before transmission — Firestore stores ciphertext only.
 * Balances and transactions never leave the device unencrypted.
 *
 * Uses @noble/ciphers (audited, pure JS, no native dependencies).
 */

import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';

/** AES-256-GCM nonce size in bytes (96 bits as recommended by NIST) */
const NONCE_LENGTH = 12;

/** AES-256 key size in bytes */
const KEY_LENGTH = 32;

/** Encrypted payload format stored in Firestore */
export interface EncryptedPayload {
  /** Base64-encoded ciphertext (includes GCM auth tag) */
  ciphertext: string;
  /** Base64-encoded nonce/IV */
  nonce: string;
  /** Encryption algorithm identifier for future-proofing */
  algorithm: 'aes-256-gcm';
  /** Schema version for encrypted payload format */
  version: 1;
}

/**
 * Generate a cryptographically secure 256-bit encryption key.
 * In production, this key should be derived from user credentials
 * or stored in the device's secure enclave (Keychain/Keystore).
 */
export function generateEncryptionKey(): Uint8Array {
  return randomBytes(KEY_LENGTH);
}

/**
 * Encrypt a JSON-serializable object with AES-256-GCM.
 * Returns an EncryptedPayload suitable for Firestore storage.
 *
 * @param data - The plaintext object to encrypt
 * @param key - 256-bit encryption key
 * @returns EncryptedPayload with base64-encoded ciphertext and nonce
 */
export function encrypt(data: Record<string, unknown>, key: Uint8Array): EncryptedPayload {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (got ${key.length})`);
  }

  const nonce = randomBytes(NONCE_LENGTH);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  const cipher = gcm(key, nonce);
  const ciphertext = cipher.encrypt(plaintext);

  return {
    ciphertext: uint8ArrayToBase64(ciphertext),
    nonce: uint8ArrayToBase64(nonce),
    algorithm: 'aes-256-gcm',
    version: 1,
  };
}

/**
 * Decrypt an EncryptedPayload back to the original object.
 *
 * @param payload - The encrypted payload from Firestore
 * @param key - 256-bit encryption key (same key used for encryption)
 * @returns The decrypted object
 * @throws If decryption fails (wrong key, tampered data, or corrupted payload)
 */
export function decrypt(payload: EncryptedPayload, key: Uint8Array): Record<string, unknown> {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (got ${key.length})`);
  }

  if (payload.algorithm !== 'aes-256-gcm') {
    throw new Error(`Unsupported algorithm: ${payload.algorithm}`);
  }

  const nonce = base64ToUint8Array(payload.nonce);
  const ciphertext = base64ToUint8Array(payload.ciphertext);

  const cipher = gcm(key, nonce);
  const plaintext = cipher.decrypt(ciphertext);

  return JSON.parse(new TextDecoder().decode(plaintext));
}

// --- Base64 helpers (React Native compatible) ---

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
