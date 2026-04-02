import { useEffect, useRef } from 'react';
import { logger } from '../instance';

export async function measureAsync<T>(
  tag: string,
  label: string,
  operation: () => Promise<T>,
  thresholdMs = 1000,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await operation();
    const durationMs = Math.round(performance.now() - start);
    const exceeded = durationMs > thresholdMs;
    const logFn = exceeded ? 'warn' : 'debug';
    logger[logFn](tag, `${label} completed`, { durationMs, label, exceededThreshold: exceeded });
    return result;
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    logger.error(tag, `${label} failed`, error instanceof Error ? error : undefined, { durationMs, label });
    throw error;
  }
}

export function measureSync<T>(
  tag: string,
  label: string,
  operation: () => T,
  thresholdMs = 1000,
): T {
  const start = performance.now();
  try {
    const result = operation();
    const durationMs = Math.round(performance.now() - start);
    const exceeded = durationMs > thresholdMs;
    const logFn = exceeded ? 'warn' : 'debug';
    logger[logFn](tag, `${label} completed`, { durationMs, label, exceededThreshold: exceeded });
    return result;
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    logger.error(tag, `${label} failed`, error instanceof Error ? error : undefined, { durationMs, label });
    throw error;
  }
}

export function useRenderTimer(screenName: string): void {
  const mountTime = useRef(performance.now());

  useEffect(() => {
    const durationMs = Math.round(performance.now() - mountTime.current);
    logger.debug('Render', `${screenName} mounted`, { durationMs, screen: screenName });
  }, []);
}
