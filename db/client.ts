import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema/local';

const expoDb = openDatabaseSync('falcly.db', { enableChangeListener: true });
export const db = drizzle(expoDb, { schema });
