import type { LogLevel, LogRecord, Transport } from '../types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

const LEVEL_LABEL: Record<LogLevel, string> = {
  debug: 'DBG',
  info: 'INF',
  warn: 'WRN',
  error: 'ERR',
  fatal: 'FTL',
};

export class ConsoleTransport implements Transport {
  name = 'console';
  minLevel: LogLevel;

  constructor(minLevel: LogLevel = 'debug') {
    this.minLevel = minLevel;
  }

  write(record: LogRecord): void {
    const time = formatTime(record.timestamp);
    const label = LEVEL_LABEL[record.level];
    const prefix = `[${time}] [${label}] [${record.tag}]`;
    const parts: unknown[] = [prefix, record.message];

    if (record.data) parts.push(record.data);
    if (record.error) parts.push(record.error);

    switch (record.level) {
      case 'debug':
      case 'info':
        console.log(...parts);
        break;
      case 'warn':
        console.warn(...parts);
        break;
      case 'error':
      case 'fatal':
        console.error(...parts);
        break;
    }
  }
}
