import * as Sentry from '@sentry/react-native';
import { redactSensitive } from '@/utils/secureLogger';

export function initCrashReporting(): void {
  Sentry.init({
    dsn: '', // TODO: Add Sentry DSN from project settings
    tracesSampleRate: 0.2,
    beforeSend(event) {
      // Sanitize error messages before sending
      if (event.exception?.values) {
        event.exception.values.forEach((ex) => {
          if (ex.value) {
            ex.value = sanitizeErrorMessage(ex.value);
          }
        });
      }
      return event;
    },
  });
}

export function recordSafeError(error: Error, context?: string): void {
  const sanitized = sanitizeErrorMessage(error.message);
  const safeError = new Error(sanitized);
  safeError.name = error.name;
  safeError.stack = error.stack;

  Sentry.captureException(safeError, {
    tags: { context },
  });
}

export function logBreadcrumb(message: string, data?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({
    message,
    data: data ? redactSensitive(data) : undefined,
    level: 'info',
  });
}

function sanitizeErrorMessage(message: string): string {
  return (
    message
      .replace(/[₱$]\s*[\d,]+\.?\d*/g, '[AMOUNT]')
      .replace(/PHP\s*[\d,]+\.?\d*/gi, '[AMOUNT]')
      .replace(/\b\d{8,}\b/g, '[REDACTED_NUMBER]')
  );
}
