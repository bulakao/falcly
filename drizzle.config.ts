import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema/local.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
});
