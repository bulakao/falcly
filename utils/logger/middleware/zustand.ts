import type { StateCreator } from 'zustand';
import { logger } from '../instance';

interface LoggerOptions {
  ignoreKeys?: string[];
  level?: 'debug' | 'info';
}

const SENSITIVE_VALUE_KEYS = new Set([
  'cashOnHand',
  'monthlyIncome',
  'committedExpenses',
  'outstandingBalance',
  'creditLimit',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
]);

export function createLoggerMiddleware<T>(
  storeName: string,
  options?: LoggerOptions,
) {
  const ignoreKeys = new Set(options?.ignoreKeys ?? []);
  const level = options?.level ?? 'info';

  return (creator: StateCreator<T>): StateCreator<T> =>
    (set, get, api) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loggedSet: typeof set = ((...args: any[]) => {
        const prev = get();
        (set as (...a: any[]) => void)(...args);
        const next = get();

        const changed: Record<string, string> = {};
        for (const key of Object.keys(next as object)) {
          if (ignoreKeys.has(key)) continue;
          const prevVal = (prev as Record<string, unknown>)[key];
          const nextVal = (next as Record<string, unknown>)[key];
          if (prevVal !== nextVal) {
            changed[key] = SENSITIVE_VALUE_KEYS.has(key) ? '[changed]' : 'updated';
          }
        }

        if (Object.keys(changed).length > 0) {
          logger[level](`Store:${storeName}`, 'State changed', { changed });
        }
      }) as typeof set;

      return creator(loggedSet, get, api);
    };
}
