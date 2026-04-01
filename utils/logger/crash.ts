import type { Logger } from './core';

export function initCrashHandler(logger: Logger): void {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    const breadcrumbs = logger.getBreadcrumbs();
    const level = isFatal ? 'fatal' : 'error';

    if (level === 'fatal') {
      logger.fatal('Crash', error.message, error, { breadcrumbs, isFatal: true });
    } else {
      logger.error('Crash', error.message, error, { isFatal: false });
    }

    // Attempt to flush logs to disk before app terminates
    logger.flush().catch(() => {});

    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}
