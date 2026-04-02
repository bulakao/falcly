import type { LoggerConfig } from './types';
import { logger } from './instance';

export { logger };

export function initLogger(config?: Partial<LoggerConfig>): void {
  if (config?.transports) {
    for (const t of config.transports) {
      logger.addTransport(t);
    }
  }
  if (config?.contextProvider) {
    // Context provider is set at construction; for post-init, use setContext
  }
  logger.info('Logger', 'Logger initialized', { isDev: __DEV__ });
}

// Re-export types
export type { LogLevel, LogRecord, LogContext, Transport, LoggerConfig } from './types';

// Re-export core
export { Logger } from './core';

// Re-export crash handler
export { initCrashHandler } from './crash';

// Re-export middleware
export { useNavigationLogger } from './middleware/navigation';
export { useRenderTimer, measureAsync, measureSync } from './middleware/performance';
export { installNetworkLogger } from './middleware/network';
export { createLoggerMiddleware } from './middleware/zustand';

// Re-export file utilities
export { exportLogs, getLogFileList, clearLogs } from './transports/file';
