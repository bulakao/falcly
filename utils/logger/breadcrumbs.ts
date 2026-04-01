import type { LogLevel } from './types';

interface Breadcrumb {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
}

export class BreadcrumbBuffer {
  private buffer: (Breadcrumb | null)[];
  private head = 0;
  private count = 0;

  constructor(private capacity: number = 50) {
    this.buffer = new Array(capacity).fill(null);
  }

  push(timestamp: string, level: LogLevel, tag: string, message: string): void {
    this.buffer[this.head] = { timestamp, level, tag, message };
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  getAll(): Breadcrumb[] {
    if (this.count === 0) return [];

    const result: Breadcrumb[] = [];
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.capacity;
      const entry = this.buffer[idx];
      if (entry) result.push(entry);
    }
    return result;
  }

  clear(): void {
    this.buffer = new Array(this.capacity).fill(null);
    this.head = 0;
    this.count = 0;
  }
}
