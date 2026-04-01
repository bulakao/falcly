import { Paths, File, Directory } from 'expo-file-system';
import type { LogLevel, LogRecord, Transport } from '../types';

const LOG_DIR_NAME = 'logs';
const MAX_AGE_DAYS = 7;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const BATCH_SIZE = 20;
const BATCH_INTERVAL_MS = 5000;

function todayFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `falcly-${y}-${m}-${day}.jsonl`;
}

function getLogDir(): Directory {
  return new Directory(Paths.document, LOG_DIR_NAME);
}

function getCacheDir(): Directory {
  return new Directory(Paths.cache);
}

export class FileTransport implements Transport {
  name = 'file';
  minLevel: LogLevel;
  private logDir: Directory;
  private buffer: string[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  constructor(options?: { minLevel?: LogLevel }) {
    this.minLevel = options?.minLevel ?? 'warn';
    this.logDir = getLogDir();
    this.init();
  }

  private init() {
    try {
      if (!this.logDir.exists) {
        this.logDir.create();
      }
      this.initialized = true;
      this.startTimer();
      this.rotate();
    } catch {
      // Silently fail — logging should never crash the app
    }
  }

  private startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => this.flushBuffer(), BATCH_INTERVAL_MS);
  }

  write(record: LogRecord): void {
    try {
      this.buffer.push(JSON.stringify(record));
      if (this.buffer.length >= BATCH_SIZE) {
        this.flushBuffer();
      }
    } catch {
      // Silently fail
    }
  }

  async flush(): Promise<void> {
    this.flushBuffer();
  }

  dispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flushBuffer();
  }

  private flushBuffer(): void {
    if (!this.initialized || this.buffer.length === 0) return;

    const lines = this.buffer.splice(0);
    const content = lines.join('\n') + '\n';

    try {
      const file = new File(this.logDir, todayFilename());
      if (file.exists) {
        const existing = file.text();
        file.write(existing + content);
      } else {
        file.create();
        file.write(content);
      }
    } catch {
      // Silently fail
    }
  }

  private rotate(): void {
    try {
      const entries = this.logDir.list();
      const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      let totalSize = 0;

      const fileInfos: { file: File; modTime: number; size: number }[] = [];

      for (const entry of entries) {
        if (!(entry instanceof File)) continue;
        if (!entry.name.endsWith('.jsonl')) continue;
        const size = entry.size ?? 0;
        // Parse date from filename: falcly-YYYY-MM-DD.jsonl
        const match = entry.name.match(/falcly-(\d{4}-\d{2}-\d{2})\.jsonl/);
        const modTime = match ? new Date(match[1]).getTime() : 0;
        fileInfos.push({ file: entry, modTime, size });
        totalSize += size;
      }

      // Sort oldest first
      fileInfos.sort((a, b) => a.modTime - b.modTime);

      for (const info of fileInfos) {
        const shouldDeleteAge = info.modTime < cutoff;
        const shouldDeleteSize = totalSize > MAX_SIZE_BYTES;

        if (shouldDeleteAge || shouldDeleteSize) {
          info.file.delete();
          totalSize -= info.size;
        }
      }
    } catch {
      // Silently fail
    }
  }
}

export async function exportLogs(): Promise<string | null> {
  try {
    const logDir = getLogDir();
    if (!logDir.exists) return null;

    const entries = logDir.list();
    const logFiles = entries
      .filter((e): e is File => e instanceof File && e.name.endsWith('.jsonl'))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (logFiles.length === 0) return null;

    let combined = '';
    for (const file of logFiles) {
      combined += `--- ${file.name} ---\n${file.text()}\n`;
    }

    const exportFile = new File(getCacheDir(), 'falcly-logs-export.txt');
    exportFile.create();
    exportFile.write(combined);
    return exportFile.uri;
  } catch {
    return null;
  }
}

export async function getLogFileList(): Promise<{ name: string; size: number }[]> {
  try {
    const logDir = getLogDir();
    if (!logDir.exists) return [];

    const entries = logDir.list();
    return entries
      .filter((e): e is File => e instanceof File && e.name.endsWith('.jsonl'))
      .map((f) => ({ name: f.name, size: f.size ?? 0 }))
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return [];
  }
}

export async function clearLogs(): Promise<void> {
  try {
    const logDir = getLogDir();
    if (logDir.exists) {
      logDir.delete();
      logDir.create();
    }
  } catch {
    // Silently fail
  }
}
