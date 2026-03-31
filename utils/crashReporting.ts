import crashlytics from '@react-native-firebase/crashlytics';
import { redactSensitive } from '@/utils/secureLogger';

/**
 * Initialize Firebase Crashlytics and set up global JS error handling.
 * Source maps are uploaded automatically via the @react-native-firebase/crashlytics
 * Expo config plugin during EAS Build.
 *
 * Call once at app startup (after fonts/splash are ready).
 */
export function initCrashReporting(): void {
  // Enable automatic crash collection
  crashlytics().setCrashlyticsCollectionEnabled(true);

  // Set up global JS error handler to capture unhandled exceptions
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    // Record the JS error to Crashlytics (with PII-stripped breadcrumbs)
    recordSafeError(error, isFatal ? 'FatalJSError' : 'JSError');

    // Call the default handler so React Native still shows the red screen in dev
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

/**
 * Record a JS error to Crashlytics after stripping PII from the error message.
 * Use this for non-fatal error reporting throughout the app.
 */
export function recordSafeError(error: Error, jsErrorName?: string): void {
  const sanitized = sanitizeErrorMessage(error.message);
  const safeError = new Error(sanitized);
  safeError.name = error.name;
  safeError.stack = error.stack;

  crashlytics().recordError(safeError, jsErrorName);
}

/**
 * Log a PII-safe breadcrumb message to Crashlytics.
 * These appear in crash reports to provide context leading up to the crash.
 */
export function logBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (data) {
    const safe = redactSensitive(data);
    crashlytics().log(`${message} ${JSON.stringify(safe)}`);
  } else {
    crashlytics().log(message);
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
