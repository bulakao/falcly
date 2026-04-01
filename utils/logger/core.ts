import { LOG_LEVEL_SEVERITY } from './types';
import type { LogLevel, LogRecord, LogContext, Transport, LoggerConfig } from './types';
import { sanitize, sanitizeError } from './sanitizer';
import { BreadcrumbBuffer } from './breadcrumbs';

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx'.replace(/[x]/g, () =>
    ((Math.random() * 16) | 0).toString(16),
  );
}

export class Logger {
  private minLevel: number;
  private transports: Transport[] = [];
  private contextProvider?: () => Partial<LogContext>;
  private breadcrumbs: BreadcrumbBuffer;
  private sessionId: string;
  private sequence = 0;
  private context: Partial<LogContext> = {};

  constructor(config?: Partial<LoggerConfig>) {
    this.minLevel = LOG_LEVEL_SEVERITY[config?.minLevel ?? 'debug'];
    this.transports = config?.transports ?? [];
    this.contextProvider = config?.contextProvider;
    this.breadcrumbs = new BreadcrumbBuffer(config?.maxBreadcrumbs ?? 50);
    this.sessionId = generateSessionId();
  }

  debug(tag: string, message: string, data?: Record<string, unknown>): void {
    this.log('debug', tag, message, undefined, data);
  }

  info(tag: string, message: string, data?: Record<string, unknown>): void {
    this.log('info', tag, message, undefined, data);
  }

  warn(tag: string, message: string, data?: Record<string, unknown>): void {
    this.log('warn', tag, message, undefined, data);
  }

  error(tag: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', tag, message, error, data);
  }

  fatal(tag: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('fatal', tag, message, error, data);
  }

  setContext(partial: Partial<LogContext>): void {
    Object.assign(this.context, partial);
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name);
  }

  getBreadcrumbs() {
    return this.breadcrumbs.getAll();
  }

  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map((t) => t.flush?.()),
    );
  }

  dispose(): void {
    for (const t of this.transports) t.dispose?.();
    this.transports = [];
  }

  private log(
    level: LogLevel,
    tag: string,
    message: string,
    error?: Error,
    data?: Record<string, unknown>,
  ): void {
    const severity = LOG_LEVEL_SEVERITY[level];

    // Early exit before any allocations
    if (severity < this.minLevel) return;

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      tag,
      message: sanitize(message),
      data: data ? sanitize(data) : undefined,
      error: error ? sanitizeError(error) : undefined,
      context: {
        ...this.context,
        ...this.contextProvider?.(),
      },
      sessionId: this.sessionId,
      sequenceNumber: this.sequence++,
    };

    // Always capture breadcrumbs for info+
    if (severity >= LOG_LEVEL_SEVERITY.info) {
      this.breadcrumbs.push(record.timestamp, level, tag, record.message);
    }

    // Dispatch to transports
    for (const transport of this.transports) {
      if (severity >= LOG_LEVEL_SEVERITY[transport.minLevel]) {
        try {
          transport.write(record);
        } catch {
          // Transport failure must not crash the app
        }
      }
    }
  }
}
