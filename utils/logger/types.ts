export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: LogContext;
  sessionId: string;
  sequenceNumber: number;
}

export interface LogContext {
  screen?: string;
  userId?: string;
  tier?: string;
  appVersion?: string;
  platform?: string;
}

export interface Transport {
  name: string;
  minLevel: LogLevel;
  write(record: LogRecord): void;
  flush?(): Promise<void>;
  dispose?(): void;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  transports: Transport[];
  contextProvider?: () => Partial<LogContext>;
  maxBreadcrumbs?: number;
}
