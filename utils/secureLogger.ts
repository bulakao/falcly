/**
 * Secure logging utility that redacts sensitive financial fields.
 * Prevents balances, limits, and other PII from appearing in debug logs.
 */

/** Fields that must never appear in logs */
const SENSITIVE_FIELDS = new Set([
  'outstandingBalance',
  'creditLimit',
  'cashOnHand',
  'monthlyIncome',
  'committedExpenses',
  'pendingTransactions',
  'installmentsMonthlyAmount',
  'subscriptionsThisCycle',
  'annualFee',
]);

const REDACTED = '[REDACTED]';

/**
 * Deep-redacts sensitive fields from an object for safe logging.
 * Returns a new object with sensitive values replaced by '[REDACTED]'.
 */
export function redactSensitive<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitive(item)) as T;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) {
      redacted[key] = REDACTED;
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted as T;
}

/**
 * Safe console.log that redacts sensitive fields in debug builds.
 * In production, logging is suppressed entirely.
 */
export function secureLog(tag: string, ...args: unknown[]): void {
  if (!__DEV__) return;

  const safeArgs = args.map((arg) =>
    typeof arg === 'object' && arg !== null ? redactSensitive(arg) : arg,
  );
  console.log(`[${tag}]`, ...safeArgs);
}

/**
 * Safe console.warn that redacts sensitive fields.
 */
export function secureWarn(tag: string, ...args: unknown[]): void {
  if (!__DEV__) return;

  const safeArgs = args.map((arg) =>
    typeof arg === 'object' && arg !== null ? redactSensitive(arg) : arg,
  );
  console.warn(`[${tag}]`, ...safeArgs);
}
