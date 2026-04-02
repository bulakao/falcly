import { Logger } from './core';
import { ConsoleTransport } from './transports/console';
import { FileTransport } from './transports/file';

export const logger = new Logger({
  minLevel: __DEV__ ? 'debug' : 'warn',
  transports: [
    ...(__DEV__ ? [new ConsoleTransport('debug')] : []),
    new FileTransport({ minLevel: __DEV__ ? 'debug' : 'warn' }),
  ],
  maxBreadcrumbs: 50,
});
