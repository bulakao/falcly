import { getCrashlytics, setCrashlyticsCollectionEnabled, recordError, log } from '@react-native-firebase/crashlytics';
import { redactSensitive } from '@/utils/secureLogger';

const crash = getCrashlytics();

export function initCrashReporting(): void {
  setCrashlyticsCollectionEnabled(crash, true);

  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    recordSafeError(error, isFatal ? 'FatalJSError' : 'JSError');

    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

export function recordSafeError(error: Error, jsErrorName?: string): void {
  const sanitized = sanitizeErrorMessage(error.message);
  const safeError = new Error(sanitized);
  safeError.name = error.name;
  safeError.stack = error.stack;

  recordError(crash, safeError, jsErrorName);
}

export function logBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (data) {
    const safe = redactSensitive(data);
    log(crash, `${message} ${JSON.stringify(safe)}`);
  } else {
    log(crash, message);
  }
}

/**
 * Strip PII patterns from error messages before they reach Crashlytics.
 * Removes currency amounts, potential balance/limit values, and numeric sequences
 * that could represent financial data.
 */
function sanitizeErrorMessage(message: string): string {
  return (
    message
      // Strip currency amounts (e.g., ₱12,345.67, $1000, PHP 500)
      .replace(/[₱$]\s*[\d,]+\.?\d*/g, '[AMOUNT]')
      .replace(/PHP\s*[\d,]+\.?\d*/gi, '[AMOUNT]')
      // Strip potential card numbers or long numeric sequences (8+ digits)
      .replace(/\b\d{8,}\b/g, '[REDACTED_NUMBER]')
  );
}
