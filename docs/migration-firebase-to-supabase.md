# Firebase to Supabase Migration Plan

**App:** Falcly -- credit card billing cycle intelligence
**Stack:** Expo CNG (React Native 0.81+), TypeScript, Zustand, Expo Router
**Date:** 2026-04-01
**Author:** Med Aduh

---

## Table of Contents

1. [Current State Inventory](#1-current-state-inventory)
2. [Target Architecture](#2-target-architecture)
3. [Auth Migration](#3-auth-migration)
4. [Data Layer Migration](#4-data-layer-migration)
5. [Database Schema for Supabase](#5-database-schema-for-supabase)
6. [Row Level Security Policies](#6-row-level-security-policies)
7. [Crashlytics Replacement (Sentry)](#7-crashlytics-replacement-sentry)
8. [Packages to Install and Remove](#8-packages-to-install-and-remove)
9. [Migration Phases](#9-migration-phases)
10. [Expo Go Compatibility](#10-expo-go-compatibility)
11. [Risk Assessment and Rollback Plan](#11-risk-assessment-and-rollback-plan)

---

## 1. Current State Inventory

### Firebase Packages (from package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-native-firebase/app` | ^23.8.8 | Firebase core SDK (native module) |
| `@react-native-firebase/auth` | ^23.8.8 | Authentication (email/password + Google) |
| `@react-native-firebase/crashlytics` | ^23.8.8 | Crash reporting with global JS error handler |
| `@react-native-firebase/firestore` | ^23.8.8 | Firestore with offline persistence |
| `@react-native-google-signin/google-signin` | ^16.1.2 | Native Google Sign-In for Android/iOS |

### Firebase Touchpoints by File

| File | Firebase Usage |
|------|---------------|
| `app.config.js` | Plugins: `@react-native-firebase/app`, `@react-native-firebase/crashlytics`, `@react-native-google-signin/google-signin`. References `firebase/dev/` and `firebase/prod/` for `google-services.json` / `GoogleService-Info.plist`. `expo-build-properties` forces static linking for `RNFBApp`, `RNFBCrashlytics`, `RNFBFirestore`. |
| `app/_layout.tsx` | `auth().onAuthStateChanged()` listener for auth state. Calls `initFirestore()`, `initCrashReporting()` on app boot. |
| `app/sign-in.tsx` | `auth().sendPasswordResetEmail()`. Calls `signInWithGoogle`, `signInWithEmail`, `signUpWithEmail` from authStore. |
| `app/settings.tsx` | `auth.EmailAuthProvider.credential()` for re-auth before account deletion. Dynamic import of `@react-native-firebase/auth` and `@react-native-google-signin/google-signin` for Google re-auth flow. |
| `store/authStore.ts` | `GoogleSignin.configure()` with webClientId. `auth().signInWithCredential()` (Google), `auth().signInWithEmailAndPassword()`, `auth().createUserWithEmailAndPassword()`, `auth().signOut()`, `currentUser.reauthenticateWithCredential()`, `currentUser.delete()`. Uses `FirebaseAuthTypes.User` and `FirebaseAuthTypes.AuthCredential` types. |
| `utils/firebase.ts` | `initializeFirestore()` with offline persistence (`persistence: true`, `cacheSizeBytes: -1`). Defines `collections.userCards(userId)` and `collections.userProfile(userId)` helpers. **Note:** These collection helpers are defined but not imported anywhere -- Firestore is initialized but not actively read/written from app code. |
| `utils/crashReporting.ts` | `getCrashlytics()`, `setCrashlyticsCollectionEnabled()`, `recordError()`, `log()`. Custom global error handler via `ErrorUtils.setGlobalHandler()`. PII sanitization before recording. |
| `firebase/dev/` | Contains `google-services.json` and `GoogleService-Info.plist` for dev environment. |

### Non-Firebase Services (kept as-is)

| Service | Package | File |
|---------|---------|------|
| PostHog analytics | `posthog-react-native` | `utils/analytics.ts` |
| Network status | `@react-native-community/netinfo` | `hooks/useNetworkStatus.ts` |
| Local persistence | `@react-native-async-storage/async-storage` + Zustand `persist` | All stores |

### Data Architecture (current)

All user data lives **locally** in Zustand stores persisted to AsyncStorage:

- **cardStore** (`falcly-cards`): Array of `Card` objects with credit limit, balance, statement day, installments, subscriptions, etc. Versioned migrations (v0 -> v1 -> v2).
- **userStore** (`falcly-user`): Cash on hand, monthly income, payday, committed expenses, analytics opt-out preference.
- **subscriptionStore** (`falcly-subscription`): Tier (free/trial/pro/pro_plus), trial timestamps, plan type, expiry tracking.
- **authStore**: In-memory only (no persistence). Holds Firebase User object and auth methods.

**Key finding:** Firestore is initialized with offline persistence but the `collections` helpers are not used anywhere in the app. The app is effectively **local-only** today. Cloud sync is referenced in the settings UI as a Pro feature but is not yet implemented.

---

## 2. Target Architecture

### Design Principles

1. **Local-first with SQLite.** All user data lives in expo-sqlite via Drizzle ORM. Works offline, no network needed for core features.
2. **Cloud sync is a Pro/Pro+ feature.** Only paid users get bidirectional sync to Supabase Postgres via Drizzle.
3. **Auth is the only universal network dependency.** All users authenticate via Supabase Auth.
4. **No native Firebase modules.** The entire `@react-native-firebase/*` family is removed, eliminating the need for `google-services.json`, `GoogleService-Info.plist`, and `useFrameworks: 'static'` in build config.
5. **Type-safe data layer.** Drizzle ORM provides typed schemas and queries for both local SQLite and remote Postgres.

### Component Mapping

| Current (Firebase) | Target (Supabase + Drizzle) |
|---------------------|----------------------------------|
| Firebase Auth (email/password) | Supabase Auth (email/password) |
| Firebase Auth (Google via native SDK) | Supabase Auth + `@react-native-google-signin/google-signin` using `signInWithIdToken` |
| Firebase Auth (future Apple Sign-In) | Supabase Auth + `expo-apple-authentication` using `signInWithIdToken` |
| Firebase Crashlytics | Sentry (`@sentry/react-native`) |
| Firestore (initialized but unused) | Supabase Postgres via Drizzle (Pro sync only) |
| `google-services.json` / `GoogleService-Info.plist` | Supabase project URL + anon key (no native config files) |
| Zustand + AsyncStorage (card/user data) | Drizzle ORM + expo-sqlite (local), Zustand for ephemeral UI state only |

### Data Architecture

```
+---------------------+       +------------------+       +-------------------+
|  expo-sqlite        | <---> |  Sync Engine     | <---> |  Supabase Postgres|
|  + Drizzle ORM      |       |  (custom hook)   |       |  + Drizzle ORM    |
|  (sqliteTable)      |       |                  |       |  (pgTable)        |
+---------------------+       +------------------+       +-------------------+
        |                          |
   Always primary            Only when online
   (offline-first)           + tier = pro/pro_plus
        |
+---------------------+
|  Zustand            |
|  (ephemeral UI      |
|   state only)       |
+---------------------+
```

**Local database (all users):** Drizzle ORM + expo-sqlite replaces AsyncStorage for persistent data (cards, user profile, subscription state). The SQLite database is the single source of truth.

**Remote database (Pro/Pro+ only):** Drizzle ORM + Supabase Postgres (`drizzle-orm/postgres-js` or `@supabase/supabase-js`). Separate `pgTable` schema file mirroring the local `sqliteTable` schema.

**Zustand stays for:** Ephemeral UI state (active card index, modal visibility, form drafts, loading states). No longer persisted to AsyncStorage for card/user data.

**Sync engine:** Custom hook that:
- Watches local SQLite changes via Drizzle
- Debounces pushes (2s after last change)
- Pushes to Supabase Postgres on change
- Pulls remote on app launch (last-write-wins by `updated_at`)
- Respects network status via `useNetworkStatus`

**Why Drizzle over raw queries?**
- Type-safe schemas and queries for both SQLite and Postgres
- Schema-as-code with generated migrations
- `useLiveQuery` hook for reactive UI updates from SQLite
- Same ORM API for local and remote, reducing cognitive overhead

**Why not PowerSync/WatermelonDB/RxDB?** Falcly's data model is simple (a handful of cards per user, no collaborative editing). Drizzle + custom sync is sufficient. If conflict resolution needs grow, PowerSync integrates with both Drizzle and Supabase Postgres.

### Drizzle Setup Requirements

```bash
# Packages
drizzle-orm              # ORM core
expo-sqlite              # Already in Expo SDK
drizzle-kit              # (devDep) migration generator

# Dev tooling (optional but recommended)
expo-drizzle-studio-plugin  # (devDep) in-app Drizzle Studio debugger
babel-plugin-inline-import  # (devDep) bundle .sql migration files
```

**Metro config:** Add `"sql"` to `resolver.sourceExts` in `metro.config.js`.

**Schema files:** Two separate schemas required (different dialects):
- `db/schema/local.ts` — uses `sqliteTable` from `drizzle-orm/sqlite-core`
- `db/schema/remote.ts` — uses `pgTable` from `drizzle-orm/pg-core`

**Migrations:** Generated via `drizzle-kit generate`, bundled with the app, run on startup via `migrate()`. The `drizzle/` output folder is committed to git.

**Expo Go compatibility:** expo-sqlite works in Expo Go. Drizzle + expo-sqlite works in Expo Go. No dev build needed for local database features.

---

## 3. Auth Migration

### 3.1 Supabase Client Setup

Create `utils/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const SUPABASE_URL = 'https://<project-ref>.supabase.co';
const SUPABASE_ANON_KEY = '<anon-key>';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no window.location in RN
  },
});

// Auto-refresh token when app comes to foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

### 3.2 Email/Password Auth

Direct replacement -- Supabase Auth has equivalent methods:

| Firebase | Supabase |
|----------|----------|
| `auth().signInWithEmailAndPassword(email, pw)` | `supabase.auth.signInWithPassword({ email, password })` |
| `auth().createUserWithEmailAndPassword(email, pw)` | `supabase.auth.signUp({ email, password })` |
| `auth().sendPasswordResetEmail(email)` | `supabase.auth.resetPasswordForEmail(email)` |
| `auth().onAuthStateChanged(cb)` | `supabase.auth.onAuthStateChange((event, session) => ...)` |
| `auth().signOut()` | `supabase.auth.signOut()` |
| `auth().currentUser` | `supabase.auth.getUser()` |
| `currentUser.delete()` | `supabase.auth.admin.deleteUser(id)` -- **requires service role key on backend, or use Supabase Edge Function** |

### 3.3 Google Sign-In

**Keep `@react-native-google-signin/google-signin`** for native UX. Instead of creating a Firebase credential, pass the ID token directly to Supabase:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '@/utils/supabase';

GoogleSignin.configure({
  webClientId: '<GOOGLE_WEB_CLIENT_ID>', // same one, reuse it
  iosClientId: '<GOOGLE_IOS_CLIENT_ID>', // needed for iOS
});

async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!response.data?.idToken) throw new Error('No ID token');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.data.idToken,
  });

  if (error) throw error;
  return data;
}
```

**Supabase config required:** Enable Google provider in Supabase Dashboard > Auth > Providers. Enter the Web Client ID and Client Secret from Google Cloud Console.

### 3.4 Apple Sign-In (new -- not yet in app)

Use `expo-apple-authentication` for native iOS sign-in:

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/utils/supabase';

async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error('No identity token');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;

  // Apple only provides name on first sign-in; store it if available
  if (credential.fullName) {
    const name = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean)
      .join(' ');
    if (name) {
      await supabase.auth.updateUser({ data: { full_name: name } });
    }
  }

  return data;
}
```

**Gotcha:** Apple's identity token does not include the user's full name in its JWT claims. The name is only provided once (first sign-in). Capture and persist it immediately.

**Supabase config required:** Enable Apple provider in Supabase Dashboard. For native iOS sign-in, you only need the Service ID; no client secret rotation is needed (that is only for web OAuth flow).

### 3.5 Account Deletion

Firebase allows client-side `currentUser.delete()` after re-authentication. Supabase's `auth.admin.deleteUser()` requires the service role key, which must never be on the client.

**Solution:** Create a Supabase Edge Function:

```sql
-- Alternatively, use a Postgres function called via RPC
create or replace function delete_own_account()
returns void
language plpgsql
security definer
as $$
begin
  -- Delete user data first (cascade should handle this via FK, but be explicit)
  delete from public.cards where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  -- Delete the auth user
  delete from auth.users where id = auth.uid();
end;
$$;
```

Client-side call:

```typescript
const { error } = await supabase.rpc('delete_own_account');
```

**Re-authentication:** Supabase does not require re-authentication before deletion like Firebase does. The session JWT is sufficient. If you want to gate it behind re-auth for UX safety, implement a password confirmation step in the UI that calls `supabase.auth.signInWithPassword()` before proceeding.

### 3.6 authStore Rewrite

The `FirebaseAuthTypes.User` type is replaced with Supabase's `User` type:

```typescript
import { create } from 'zustand';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearLocalData: () => void;
}
```

Key differences from current authStore:
- `deleteAccount` no longer takes a `credential` parameter (no re-auth required by Supabase)
- `user` type changes from `FirebaseAuthTypes.User` to Supabase `User`
- User properties change: `user.photoURL` becomes `user.user_metadata.avatar_url`, `user.displayName` becomes `user.user_metadata.full_name`, `user.email` stays `user.email`
- Provider detection changes: `user.providerData` becomes `user.app_metadata.providers` (string array)

### 3.7 Existing User Migration

Since the app is not yet in production (v1.0.0), there are no existing Firebase Auth users to migrate. If there were, the process would be:

1. Export Firebase Auth users via `firebase auth:export`
2. Use Supabase's auth import API with Firebase password hash parameters (base64_signer_key, base64_salt_separator, rounds, mem_cost)
3. Store the Firebase UID in a `firebase_uid` column in the profiles table for reference
4. Email/password users: passwords can be imported with hash parameters
5. Google-only users: will work seamlessly since Google ID tokens verify the same identity

---

## 4. Data Layer Migration

### 4.1 Local Database: Drizzle + expo-sqlite

**Current:** `User action -> Zustand setState() -> AsyncStorage persist`
**Target:** `User action -> Drizzle insert/update -> expo-sqlite -> UI reactively updates via useLiveQuery`

All persistent data moves from AsyncStorage to SQLite:

```typescript
// db/client.ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

const expoDb = openDatabaseSync('falcly.db', { enableChangeListener: true });
export const db = drizzle(expoDb);
```

```typescript
// db/schema/local.ts
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  bankName: text('bank_name').notNull(),
  creditLimit: real('credit_limit').notNull(),
  outstandingBalance: real('outstanding_balance').notNull().default(0),
  statementDay: integer('statement_day').notNull(),
  dueDayOffset: integer('due_day_offset').notNull().default(21),
  interestRate: real('interest_rate').notNull().default(0.02),
  minPaymentPct: real('min_payment_pct').notNull().default(0.05),
  minPaymentFloor: real('min_payment_floor').notNull().default(500),
  pendingTransactions: real('pending_transactions').notNull().default(0),
  installmentsMonthlyAmount: real('installments_monthly_amount').notNull().default(0),
  subscriptionsThisCycle: real('subscriptions_this_cycle').notNull().default(0),
  annualFee: real('annual_fee').notNull().default(0),
  annualFeeMonth: integer('annual_fee_month').notNull().default(0),
  balanceUpdatedAt: integer('balance_updated_at', { mode: 'timestamp_ms' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const profile = sqliteTable('profile', {
  id: text('id').primaryKey().default('local'),
  cashOnHand: real('cash_on_hand'),
  cashUpdatedAt: integer('cash_updated_at', { mode: 'timestamp_ms' }),
  monthlyIncome: real('monthly_income'),
  payday: integer('payday'),
  committedExpenses: real('committed_expenses'),
  analyticsOptOut: integer('analytics_opt_out', { mode: 'boolean' }).notNull().default(false),
});
```

**Zustand stores become thin wrappers** that read from and write to SQLite via Drizzle, instead of persisting to AsyncStorage. The `useLiveQuery` hook from Drizzle provides reactive updates when the database changes.

**Migration from AsyncStorage:** On first launch after migration, read existing AsyncStorage data, insert into SQLite, then clear AsyncStorage keys. This is a one-time operation in the app boot sequence.

### 4.2 Cloud Sync for Pro/Pro+ Users

**Trigger:** When `subscriptionStore.tier` is `'pro'` or `'pro_plus'` AND user is authenticated AND online.

**Sync direction:** Bidirectional with local SQLite as authority.

**Sync approach:** Custom hook that reads from local Drizzle SQLite and pushes to Supabase Postgres (also via Drizzle or raw `supabase-js`):

```typescript
// hooks/useSyncToSupabase.ts
export function useSyncToSupabase() {
  const tier = useSubscriptionStore((s) => s.tier);
  const user = useAuthStore((s) => s.user);
  const { isOffline } = useNetworkStatus();

  const shouldSync = (tier === 'pro' || tier === 'pro_plus') && user && !isOffline;

  // On app launch: pull remote -> merge into local SQLite (last-write-wins by updated_at)
  useEffect(() => {
    if (!shouldSync) return;
    pullRemoteAndMerge(user.id);
  }, [shouldSync, user?.id]);

  // On local SQLite change: debounced push to Supabase Postgres
  // Uses expo-sqlite change listener via Drizzle's enableChangeListener
}
```

**Conflict resolution:** `updated_at` timestamp comparison. The most recent write wins. This is acceptable because:
- Single-user data (no collaboration)
- Conflicts only arise from multi-device usage
- Card data changes infrequently (balance updates, not real-time)

### 4.3 Data Retention on Downgrade

Current behavior (from subscriptionStore): When Pro expires, `proExpiredAt` is set, and `daysUntilDataDeletion()` counts down from 90 days. This logic stays local. On downgrade:
- Stop syncing to Supabase
- Local SQLite data remains accessible (read-only for cards beyond free limit)
- Remote data stays in Supabase for 90 days, then a scheduled Supabase Edge Function or cron job deletes it

---

## 5. Database Schema for Supabase

### profiles table

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cash_on_hand numeric,
  cash_updated_at timestamptz,
  monthly_income numeric,
  payday smallint check (payday between 1 and 31),
  committed_expenses numeric,
  analytics_opt_out boolean default false,
  tier text default 'free' check (tier in ('free', 'trial', 'pro', 'pro_plus')),
  plan_type text check (plan_type in (
    'pro_monthly', 'pro_quarterly', 'pro_annual',
    'pro_plus_monthly', 'pro_plus_quarterly', 'pro_plus_annual'
  )),
  trial_ends_at timestamptz,
  pro_expired_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### cards table

```sql
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_id text not null, -- maps to the Zustand-generated string ID
  bank_name text not null,
  credit_limit numeric not null,
  outstanding_balance numeric not null default 0,
  statement_day smallint not null check (statement_day between 1 and 31),
  due_day_offset smallint not null default 21,
  interest_rate numeric not null default 0.02,
  min_payment_pct numeric not null default 0.05,
  min_payment_floor numeric not null default 500,
  pending_transactions numeric not null default 0,
  installments_monthly_amount numeric not null default 0,
  subscriptions_this_cycle numeric not null default 0,
  annual_fee numeric not null default 0,
  annual_fee_month smallint not null default 0,
  balance_updated_at timestamptz not null,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, local_id)
);

create index idx_cards_user_id on public.cards(user_id);
```

### updated_at trigger

```sql
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_cards_updated_at
  before update on public.cards
  for each row execute function public.update_updated_at();
```

---

## 6. Row Level Security Policies

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.cards enable row level security;

-- profiles: users can only read/write their own row
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- cards: users can only CRUD their own cards
create policy "Users can read own cards"
  on public.cards for select
  using (auth.uid() = user_id);

create policy "Users can insert own cards"
  on public.cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cards"
  on public.cards for update
  using (auth.uid() = user_id);

create policy "Users can delete own cards"
  on public.cards for delete
  using (auth.uid() = user_id);
```

**Best practices applied:**
- Index on `user_id` for policy performance
- No complex joins in policies -- simple `auth.uid()` comparison
- Separate policies per operation (SELECT, INSERT, UPDATE, DELETE)
- No service-role bypass from the client; anon key + RLS only

---

## 7. Crashlytics Replacement (Sentry)

### Why Sentry

- Official Expo integration (`@sentry/react-native` with Expo plugin)
- Source map upload via EAS Build
- JS + native crash capture
- Session Replays available
- Works with CNG workflow (no manual native config)
- Free tier: 5K errors/month, 1 team member

### Setup

```bash
npx @sentry/wizard@latest -i reactNative
```

The wizard will:
1. Install `@sentry/react-native`
2. Add `@sentry/react-native/metro` to `metro.config.js`
3. Add `@sentry/react-native/expo` plugin to `app.config.js`

### Code Migration

Replace `utils/crashReporting.ts`:

```typescript
import * as Sentry from '@sentry/react-native';
import { redactSensitive } from '@/utils/secureLogger';

export function initCrashReporting(): void {
  Sentry.init({
    dsn: '__SENTRY_DSN__',
    tracesSampleRate: 0.2,
    // Strip PII from error messages before sending
    beforeSend(event) {
      if (event.message) {
        event.message = sanitizeErrorMessage(event.message);
      }
      return event;
    },
  });
}

export function recordSafeError(error: Error, context?: string): void {
  const sanitized = sanitizeErrorMessage(error.message);
  const safeError = new Error(sanitized);
  safeError.name = error.name;
  safeError.stack = error.stack;

  Sentry.captureException(safeError, {
    tags: { context },
  });
}

export function logBreadcrumb(message: string, data?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({
    message,
    data: data ? redactSensitive(data) : undefined,
    level: 'info',
  });
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/[₱$]\s*[\d,]+\.?\d*/g, '[AMOUNT]')
    .replace(/PHP\s*[\d,]+\.?\d*/gi, '[AMOUNT]')
    .replace(/\b\d{8,}\b/g, '[REDACTED_NUMBER]');
}
```

Replace `ErrorUtils.setGlobalHandler()` approach -- Sentry captures unhandled JS errors automatically when initialized.

In `_layout.tsx`, wrap the root component:

```typescript
import * as Sentry from '@sentry/react-native';

export default Sentry.wrap(function RootLayout() {
  // ... existing code
});
```

---

## 8. Packages to Install and Remove

### Remove

| Package | Reason |
|---------|--------|
| `@react-native-firebase/app` | No longer needed |
| `@react-native-firebase/auth` | Replaced by Supabase Auth |
| `@react-native-firebase/crashlytics` | Replaced by Sentry |
| `@react-native-firebase/firestore` | Replaced by Supabase Postgres (Pro sync) |

### Install

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client (auth, remote database) |
| `react-native-url-polyfill` | Required by supabase-js in React Native |
| `@sentry/react-native` | Crash reporting + performance monitoring |
| `expo-apple-authentication` | Native Apple Sign-In on iOS |
| `drizzle-orm` | Type-safe ORM for SQLite (local) and Postgres (remote) |
| `expo-sqlite` | Local SQLite database (included in Expo SDK) |
| `drizzle-kit` | (devDep) Schema migration generator |
| `babel-plugin-inline-import` | (devDep) Bundle .sql migration files with Metro |
| `expo-drizzle-studio-plugin` | (devDep) In-app database inspector |

### Keep (already installed)

| Package | Reason |
|---------|--------|
| `@react-native-google-signin/google-signin` | Still used for native Google Sign-In, but token goes to Supabase instead of Firebase |
| `@react-native-async-storage/async-storage` | Supabase session storage (Zustand no longer persists card/user data) |
| `posthog-react-native` | Analytics (unchanged) |
| `@react-native-community/netinfo` | Network status for sync (unchanged) |

### Installation Commands

```bash
# Install new dependencies
npx expo install @supabase/supabase-js react-native-url-polyfill @sentry/react-native expo-apple-authentication expo-sqlite drizzle-orm
npm install -D drizzle-kit babel-plugin-inline-import expo-drizzle-studio-plugin

# Remove Firebase
npm uninstall @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/crashlytics @react-native-firebase/firestore
```

### Metro Config Change

Add `"sql"` to source extensions in `metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');
module.exports = config;
```

---

## 9. Migration Phases

### Phase 0: Supabase Project Setup (1 day)

- [ ] Create Supabase project (choose region closest to PH users -- Singapore)
- [ ] Run schema SQL (profiles, cards, triggers, RLS policies)
- [ ] Enable Google and Apple auth providers in Dashboard
- [ ] Configure Google OAuth: add Web Client ID + Secret from Google Cloud Console
- [ ] Configure Apple: add Service ID, Key ID, Team ID
- [ ] Store Supabase URL and anon key in `app.config.js` `extra` section
- [ ] Create the `delete_own_account` RPC function

### Phase 1: Auth Migration (2-3 days)

- [ ] Create `utils/supabase.ts` with client initialization
- [ ] Rewrite `store/authStore.ts` to use Supabase Auth
  - `signInWithEmail` / `signUpWithEmail` -> `supabase.auth.signInWithPassword` / `supabase.auth.signUp`
  - `signInWithGoogle` -> Google native SDK + `supabase.auth.signInWithIdToken`
  - `signOut` -> `supabase.auth.signOut()`
  - `deleteAccount` -> `supabase.rpc('delete_own_account')`
- [ ] Add `signInWithApple` to authStore
- [ ] Update `app/_layout.tsx`:
  - Replace `auth().onAuthStateChanged()` with `supabase.auth.onAuthStateChange()`
  - Remove `initFirestore()` call
  - Replace `initCrashReporting()` with Sentry init
- [ ] Update `app/sign-in.tsx`:
  - Replace `auth().sendPasswordResetEmail()` with `supabase.auth.resetPasswordForEmail()`
  - Add Apple Sign-In button (iOS only, using `AppleAuthentication.isAvailableAsync()`)
- [ ] Update `app/settings.tsx`:
  - Replace `auth.EmailAuthProvider.credential()` re-auth flow with password confirmation + `supabase.auth.signInWithPassword()`
  - Replace Google re-auth flow with Google native SDK + `supabase.auth.signInWithIdToken()`
  - Update `user.photoURL` -> `user.user_metadata.avatar_url`
  - Update `user.displayName` -> `user.user_metadata.full_name`
  - Replace provider detection (`providerData` -> `app_metadata.providers`)
- [ ] Delete `utils/firebase.ts`
- [ ] Delete `firebase/` directory (config files)

### Phase 2: Crashlytics to Sentry (1 day)

- [ ] Run Sentry wizard: `npx @sentry/wizard@latest -i reactNative`
- [ ] Rewrite `utils/crashReporting.ts` to use Sentry API
- [ ] Wrap root component with `Sentry.wrap()`
- [ ] Remove `ErrorUtils.setGlobalHandler()` (Sentry handles this)
- [ ] Update `app.config.js`: remove `@react-native-firebase/app` and `@react-native-firebase/crashlytics` plugins, add `@sentry/react-native/expo`
- [ ] Remove `forceStaticLinking` for RNFB modules from `expo-build-properties`
- [ ] Verify crash reporting in development build

### Phase 3: Remove Firebase Dependencies (1 day)

- [ ] Run `npm uninstall` for all `@react-native-firebase/*` packages
- [ ] Remove all Firebase plugin references from `app.config.js`
- [ ] Remove `google-services.json` and `GoogleService-Info.plist` references from `app.config.js`
- [ ] Delete `firebase/` directory
- [ ] Clean and rebuild: `npx expo prebuild --clean`
- [ ] Verify app boots, auth works, crash reporting works
- [ ] Run `npx expo lint` and `tsc --noEmit`

### Phase 4: Cloud Sync (Pro/Pro+ only) (3-5 days)

- [ ] Implement `utils/syncEngine.ts` with push/pull logic
- [ ] Implement `hooks/useSyncToSupabase.ts` wiring Zustand changes to sync
- [ ] Add sync status indicator in settings (replaces current placeholder)
- [ ] Handle merge conflicts (last-write-wins by `updated_at`)
- [ ] Handle offline queue (changes made offline pushed when connection returns)
- [ ] Test multi-device sync scenarios
- [ ] Test downgrade flow (Pro -> Free: stop sync, local data persists)
- [ ] Add 90-day data retention cleanup (Supabase pg_cron or Edge Function)

### Phase 5: Cleanup and Verification (1 day)

- [ ] Search entire codebase for any remaining `firebase` references
- [ ] Verify all auth flows: email sign-up, email sign-in, Google sign-in, Apple sign-in, sign-out, account deletion, password reset
- [ ] Verify crash reporting sends to Sentry
- [ ] Verify Pro sync works online and degrades gracefully offline
- [ ] Verify Free tier works entirely offline
- [ ] Update `CLAUDE.md` tech stack documentation
- [ ] Update `docs/discovery/16-tech-stack.md`

---

## 10. Expo Go Compatibility

| Feature | Expo Go | Dev Build |
|---------|---------|-----------|
| Supabase Auth (email/password) | Works | Works |
| Supabase Auth (Google via `@react-native-google-signin`) | Does NOT work (native module) | Works |
| Supabase Auth (Apple via `expo-apple-authentication`) | Works (built into Expo Go on iOS) | Works |
| Sentry crash reporting | JS errors only (no native crashes) | Full support |
| Supabase database queries | Works | Works |
| AsyncStorage | Works | Works |

**Recommendation:** Continue using development builds (`npx expo run:android` / `npx expo run:ios`) as the primary workflow. This is already the case given the CNG workflow and the existing dependency on `@react-native-google-signin/google-signin`.

**Improvement over Firebase:** The current Firebase setup requires a dev build for ALL functionality (including email auth) because `@react-native-firebase/app` is a native module. With Supabase, email auth and Apple sign-in will work in Expo Go, improving the inner dev loop for those flows.

---

## 11. Risk Assessment and Rollback Plan

### Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| `supabase-js` `ws` module crash in RN | High | Medium | Pin to latest stable version. The `ws` issue (GitHub #1434) affects v2.49.8; check if resolved in current version. Disable realtime if not needed: `createClient(url, key, { realtime: { enabled: false } })` |
| Google Sign-In token rejected by Supabase | Medium | Low | Test immediately in Phase 1. Ensure the same Web Client ID is configured in both Google Cloud Console and Supabase Dashboard. |
| Apple secret key rotation (6-month expiry) | Medium | Certain (if using OAuth flow) | Use native `signInWithIdToken` flow instead of OAuth -- no secret rotation needed for native iOS. |
| Session loss on migration (if app were in production) | High | N/A | Not applicable -- app is pre-launch. For a production migration, you would dual-write auth for a transition period. |
| Supabase free tier limits | Low | Low | Free tier: 50K monthly active users, 500MB database, 1GB file storage, 2GB bandwidth. More than sufficient for launch. |
| Offline auth token expiry | Medium | Medium | Supabase JWT expires after 1 hour by default. If offline longer, re-auth is needed on reconnect. Increase JWT expiry to 7 days in Dashboard for mobile use case. |

### Rollback Plan

Since this is a pre-launch app with no production users:

1. **Git-based rollback:** Each phase is a separate commit. `git revert` any phase if issues arise.
2. **Firebase project persists:** Do not delete the Firebase project until Supabase migration is verified in production for at least 2 weeks.
3. **Parallel testing:** Before removing Firebase packages, both auth systems can coexist briefly for A/B verification.

### Known Gotchas

1. **`react-native-url-polyfill` must be imported before `createClient`.** Import it at the top of `utils/supabase.ts` or in the app entry point.
2. **`detectSessionInUrl: false` is required** in Supabase client config for React Native (no `window.location`).
3. **Supabase merges OAuth identities by email.** If a user signs up with email/password, then later signs in with Google using the same email, Supabase links the identities. This is generally desirable but differs from Firebase's default behavior.
4. **Apple Sign-In name is only provided once.** Cache `credential.fullName` immediately and write to `user_metadata` -- it will not appear in subsequent sign-ins.
5. **`expo-build-properties` changes:** After removing Firebase, the `useFrameworks: 'static'` and `forceStaticLinking` config can likely be removed unless another dependency requires it. Test the build after removal.
6. **No `Alert.prompt` on Android.** The current account deletion flow uses `Alert.prompt` for password re-entry, which is iOS-only. This is a pre-existing issue, not introduced by migration, but worth fixing while touching that code.

---

## References

- [Supabase + Expo React Native Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
- [Supabase Auth with React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Using Supabase - Expo Documentation](https://docs.expo.dev/guides/using-supabase/)
- [Supabase Google Sign-In](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Apple Sign-In](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Migrate Firebase Auth to Supabase](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth)
- [Migrate Firebase Firestore to Supabase](https://supabase.com/docs/guides/platform/migrating-to-supabase/firestore-data)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Sentry for Expo](https://docs.expo.dev/guides/using-sentry/)
- [Sentry React Native SDK](https://docs.sentry.io/platforms/react-native/)
- [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Local-first Architecture with Expo](https://docs.expo.dev/guides/local-first/)
- [PowerSync + Supabase](https://www.powersync.com/blog/bringing-offline-first-to-supabase)
- [Offline-first with WatermelonDB + Supabase](https://supabase.com/blog/react-native-offline-first-watermelon-db)
- [supabase-js ws module issue #1434](https://github.com/supabase/supabase-js/issues/1434)
- [Firebase to Supabase Migration Tools](https://github.com/supabase-community/firebase-to-supabase)
