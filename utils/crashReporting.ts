import { redactSensitive } from '@/utils/secureLogger';

export function initCrashReporting(): void {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    const sanitized = sanitizeErrorMessage(error.message);
    console.error(`[${isFatal ? 'FATAL' : 'ERROR'}] ${sanitized}`);

    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

export function recordSafeError(error: Error, context?: string): void {
  const sanitized = sanitizeErrorMessage(error.message);
  console.error(`[${context ?? 'Error'}] ${sanitized}`);
}

export function logBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (__DEV__) {
    const safe = data ? redactSensitive(data) : undefined;
    console.log(`[Breadcrumb] ${message}`, safe ?? '');
  }
}

function sanitizeErrorMessage(message: string): string {
  return (
    message
      .replace(/[₱$€£¥₩₫₹฿]\s*[\d,]+\.?\d*/g, '[AMOUNT]')
      .replace(/(?:PHP|USD|EUR|GBP|JPY|SGD|MYR|THB|IDR|INR|AUD|CAD|NZD|CHF|HKD|KRW|CNY)\s*[\d,]+\.?\d*/gi, '[AMOUNT]')
      .replace(/\b\d{8,}\b/g, '[REDACTED_NUMBER]')
  );
}
