const SENSITIVE_FIELDS = new Set([
  // Financial
  'outstandingBalance',
  'creditLimit',
  'cashOnHand',
  'monthlyIncome',
  'committedExpenses',
  'pendingTransactions',
  'installmentsMonthlyAmount',
  'subscriptionsThisCycle',
  'annualFee',
  // Auth / PII
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'secret',
  'apiKey',
  'phoneNumber',
  'address',
  'fullName',
  'firstName',
  'lastName',
  'ssn',
  'cardNumber',
  'cvv',
  'expiryDate',
]);

const REDACTED = '[REDACTED]';

const PATTERN_REPLACEMENTS: [RegExp, string][] = [
  // Currency amounts (₱, $, €, £, ¥, etc.)
  [/[₱$€£¥₩₫₹฿]\s*[\d,]+\.?\d*/g, '[AMOUNT]'],
  [/(?:PHP|USD|EUR|GBP|JPY|SGD|MYR|THB|IDR|INR|AUD|CAD|NZD|CHF|HKD|KRW|CNY)\s*[\d,]+\.?\d*/gi, '[AMOUNT]'],
  // Credit card numbers
  [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_NUMBER]'],
  // Email addresses
  [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]'],
  // JWT tokens
  [/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[TOKEN]'],
  // Long numbers (account/card numbers)
  [/\b\d{8,}\b/g, '[REDACTED_NUMBER]'],
];

function sanitizeString(value: string): string {
  let result = value;
  for (const [pattern, replacement] of PATTERN_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 10) return REDACTED;

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key)) {
        result[key] = REDACTED;
      } else {
        result[key] = sanitizeValue(val, depth + 1);
      }
    }
    return result;
  }

  return value;
}

export function sanitize<T>(obj: T): T {
  return sanitizeValue(obj, 0) as T;
}

export function sanitizeError(error: Error): { name: string; message: string; stack?: string } {
  return {
    name: error.name,
    message: sanitizeString(error.message),
    stack: error.stack ? sanitizeString(error.stack) : undefined,
  };
}
