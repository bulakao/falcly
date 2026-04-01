# WIGGUM — Firebase to Supabase Migration PRD

**Source:** [migration-firebase-to-supabase.md](migration-firebase-to-supabase.md)
**Generated:** 2026-04-01

---

## Epic: AUTH — Supabase Auth Migration

### AUTH-01: Set up Supabase project and client

**Priority:** P0 (blocker for all other stories)
**Phase:** 0
**Estimate:** 0.5 day

**Description:** Create Supabase project, configure providers, create client utility.

**Tasks:**
- [ ] Create Supabase project (Singapore region)
- [ ] Run schema SQL: `profiles`, `cards` tables with triggers and RLS
- [ ] Enable Google provider (Web Client ID + Secret from Google Cloud Console)
- [ ] Enable Apple provider (Service ID, Key ID, Team ID)
- [ ] Create `delete_own_account` RPC function
- [ ] Set JWT expiry to 7 days (mobile offline use case)
- [ ] Install `@supabase/supabase-js`, `react-native-url-polyfill`
- [ ] Install `drizzle-orm`, `expo-sqlite`, `drizzle-kit` (dev), `babel-plugin-inline-import` (dev), `expo-drizzle-studio-plugin` (dev)
- [ ] Create `utils/supabase.ts` with client init, session storage via AsyncStorage, auto-refresh on foreground
- [ ] Store Supabase URL and anon key in `app.config.js` `extra`
- [ ] Add `"sql"` to Metro `resolver.sourceExts` in `metro.config.js`

**Acceptance Criteria:**
- Supabase client initializes without error in dev build and Expo Go
- `supabase.auth.getSession()` returns null (no user yet)
- RLS policies block unauthenticated access to `profiles` and `cards` tables

---

### AUTH-02: Rewrite authStore for Supabase

**Priority:** P0
**Phase:** 1
**Estimate:** 1 day
**Depends on:** AUTH-01

**Description:** Replace Firebase Auth with Supabase Auth in the auth store.

**Tasks:**
- [ ] Change `user` type from `FirebaseAuthTypes.User` to Supabase `User`
- [ ] `signInWithEmail` → `supabase.auth.signInWithPassword({ email, password })`
- [ ] `signUpWithEmail` → `supabase.auth.signUp({ email, password })`
- [ ] `signInWithGoogle` → keep `@react-native-google-signin`, route token to `supabase.auth.signInWithIdToken({ provider: 'google', token })`
- [ ] `signOut` → `supabase.auth.signOut()` + store resets
- [ ] `deleteAccount` → `supabase.rpc('delete_own_account')` (no credential param needed)
- [ ] Remove `FirebaseAuthTypes` imports

**Acceptance Criteria:**
- All auth methods compile and call Supabase instead of Firebase
- User type is Supabase `User` throughout
- `deleteAccount` no longer requires re-authentication credential

---

### AUTH-03: Add Apple Sign-In

**Priority:** P1
**Phase:** 1
**Estimate:** 0.5 day
**Depends on:** AUTH-01

**Description:** Add native Apple Sign-In using `expo-apple-authentication`.

**Tasks:**
- [ ] Install `expo-apple-authentication`
- [ ] Add `signInWithApple` to authStore: `AppleAuthentication.signInAsync()` → `supabase.auth.signInWithIdToken({ provider: 'apple', token })`
- [ ] Capture `credential.fullName` on first sign-in, write to `user_metadata`
- [ ] Add Apple Sign-In button to sign-in screen (iOS only, guard with `AppleAuthentication.isAvailableAsync()`)
- [ ] Add `expo-apple-authentication` plugin to `app.config.js`

**Acceptance Criteria:**
- Apple Sign-In button appears on iOS, hidden on Android
- Sign-in creates Supabase user with correct email and name
- Works in Expo Go on iOS (no dev build needed)

---

### AUTH-04: Update sign-in screen

**Priority:** P0
**Phase:** 1
**Estimate:** 0.5 day
**Depends on:** AUTH-02, AUTH-03

**Description:** Update `app/sign-in.tsx` to use Supabase auth methods.

**Tasks:**
- [ ] Replace `auth().sendPasswordResetEmail()` with `supabase.auth.resetPasswordForEmail()`
- [ ] Remove `import auth from '@react-native-firebase/auth'`
- [ ] Add Apple Sign-In button below Google button (iOS only)
- [ ] Verify email/password sign-up, sign-in, and forgot password flows

**Acceptance Criteria:**
- Email sign-up creates account and logs in
- Email sign-in works with existing account
- Forgot password sends reset email via Supabase
- Google sign-in works (dev build only)
- Apple sign-in works on iOS
- No Firebase imports remain in this file

---

### AUTH-05: Update settings screen

**Priority:** P0
**Phase:** 1
**Estimate:** 0.5 day
**Depends on:** AUTH-02

**Description:** Update `app/settings.tsx` for Supabase user properties and deletion flow.

**Tasks:**
- [ ] Replace `user.photoURL` → `user.user_metadata.avatar_url`
- [ ] Replace `user.displayName` → `user.user_metadata.full_name`
- [ ] Replace provider detection: `user.providerData` → `user.app_metadata.providers` (string array)
- [ ] Simplify delete account: remove re-auth flow, call `deleteAccount()` directly (Supabase doesn't require re-auth)
- [ ] Remove `import auth from '@react-native-firebase/auth'`
- [ ] Fix `Alert.prompt` Android issue: use custom modal input instead

**Acceptance Criteria:**
- Avatar, name, email display correctly from Supabase user
- Sign out clears session and redirects to sign-in
- Delete account removes user and all data
- No Firebase imports remain in this file

---

### AUTH-06: Update root layout auth listener

**Priority:** P0
**Phase:** 1
**Estimate:** 0.5 day
**Depends on:** AUTH-02

**Description:** Replace Firebase `onAuthStateChanged` with Supabase `onAuthStateChange` in `app/_layout.tsx`.

**Tasks:**
- [ ] Replace `auth().onAuthStateChanged()` with `supabase.auth.onAuthStateChange((event, session) => { setUser(session?.user ?? null) })`
- [ ] Remove `import auth from '@react-native-firebase/auth'`
- [ ] Remove `initFirestore()` call
- [ ] Update auth guard to work with Supabase session

**Acceptance Criteria:**
- Auth state changes trigger navigation (sign-in ↔ app)
- Session persists across app restarts (AsyncStorage)
- No Firebase imports remain in this file

---

### AUTH-07: Update AllCardsOverview avatar

**Priority:** P1
**Phase:** 1
**Estimate:** 0.25 day
**Depends on:** AUTH-02

**Description:** Update avatar to use Supabase user properties.

**Tasks:**
- [ ] Replace `user.photoURL` → `user.user_metadata.avatar_url`
- [ ] Verify avatar renders for Google, Apple, and email users

**Acceptance Criteria:**
- Google users see their Google profile photo
- Email/Apple users see the default user icon
- Tapping avatar opens settings modal

---

## Epic: CRASH — Crashlytics to Sentry

### CRASH-01: Replace Crashlytics with Sentry

**Priority:** P1
**Phase:** 2
**Estimate:** 1 day
**Depends on:** AUTH-06

**Description:** Swap Firebase Crashlytics for Sentry.

**Tasks:**
- [ ] Install `@sentry/react-native`
- [ ] Run Sentry wizard: `npx @sentry/wizard@latest -i reactNative`
- [ ] Rewrite `utils/crashReporting.ts`: replace `getCrashlytics()`, `recordError()`, `log()` with Sentry equivalents
- [ ] Preserve PII sanitization (amount redaction, number redaction)
- [ ] Wrap root component with `Sentry.wrap()`
- [ ] Remove `ErrorUtils.setGlobalHandler()` (Sentry handles this)
- [ ] Add `@sentry/react-native/expo` plugin to `app.config.js`
- [ ] Remove `@react-native-firebase/crashlytics` plugin from `app.config.js`

**Acceptance Criteria:**
- JS errors appear in Sentry dashboard
- PII (amounts, card numbers) are redacted in error reports
- No Firebase Crashlytics imports remain

---

## Epic: CLEANUP — Remove Firebase

### CLEANUP-01: Uninstall Firebase packages and config

**Priority:** P0
**Phase:** 3
**Estimate:** 1 day
**Depends on:** AUTH-06, CRASH-01

**Description:** Remove all Firebase dependencies, config files, and build plugins.

**Tasks:**
- [ ] `npm uninstall @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/crashlytics @react-native-firebase/firestore`
- [ ] Remove plugins from `app.config.js`: `@react-native-firebase/app`, `@react-native-firebase/crashlytics`
- [ ] Remove `googleServicesFile` references from `app.config.js` (ios + android)
- [ ] Remove `forceStaticLinking` for RNFB modules from `expo-build-properties`
- [ ] Remove `useFrameworks: 'static'` if no other dep needs it
- [ ] Delete `utils/firebase.ts`
- [ ] Delete `firebase/` directory
- [ ] `npx expo prebuild --clean`
- [ ] Grep codebase for any remaining `firebase` references
- [ ] Run `tsc --noEmit` and `npx expo lint`

**Acceptance Criteria:**
- Zero `firebase` references in source code
- App boots, auth works, crash reporting works
- `tsc` and lint pass clean
- Dev build compiles successfully

---

## Epic: DRIZZLE — Local Database Migration

### DRIZZLE-01: Set up Drizzle + expo-sqlite

**Priority:** P0
**Phase:** 1.5 (after auth, before sync)
**Estimate:** 1 day
**Depends on:** AUTH-01

**Description:** Initialize Drizzle ORM with expo-sqlite as the local database.

**Tasks:**
- [ ] Create `db/client.ts` — `openDatabaseSync('falcly.db')` + `drizzle(expoDb)`
- [ ] Create `db/schema/local.ts` — `sqliteTable` definitions for `cards` and `profile`
- [ ] Create `drizzle.config.ts` — `dialect: 'sqlite'`, `driver: 'expo'`
- [ ] Generate initial migration: `npx drizzle-kit generate`
- [ ] Create `db/migrate.ts` — run migrations on app startup via `useMigrations()` or `migrate()`
- [ ] Add migration runner to `_layout.tsx` boot sequence
- [ ] Commit `drizzle/` migration output folder

**Acceptance Criteria:**
- SQLite database creates on first launch
- Migrations run without error
- Drizzle Studio plugin shows empty tables in dev
- Works in Expo Go

---

### DRIZZLE-02: Migrate cardStore to Drizzle

**Priority:** P0
**Phase:** 1.5
**Estimate:** 1.5 days
**Depends on:** DRIZZLE-01

**Description:** Replace AsyncStorage-persisted cardStore with Drizzle SQLite queries.

**Tasks:**
- [ ] Rewrite `addCard` → `db.insert(cards).values(...)`
- [ ] Rewrite `updateCard` → `db.update(cards).set(...).where(eq(cards.id, cardId))`
- [ ] Rewrite `updateBalance` → same pattern with `balanceUpdatedAt: Date.now()`
- [ ] Rewrite `deleteCard` → `db.delete(cards).where(...)`
- [ ] Rewrite `toggleCardActive` → `db.update(cards).set({ isActive: !current })`
- [ ] Rewrite `reorderCards` → update `sortOrder` column per card
- [ ] Rewrite `enforceActiveLimit` → SQL update with limit
- [ ] Replace `useCardStore` selectors with `useLiveQuery` from Drizzle for reactive reads
- [ ] One-time migration: read existing AsyncStorage `falcly-cards` data, insert into SQLite, clear AsyncStorage
- [ ] Remove `persist` middleware from cardStore (no more AsyncStorage for cards)

**Acceptance Criteria:**
- All card CRUD operations work via SQLite
- Card list reactively updates when database changes
- Existing AsyncStorage data migrates to SQLite on first launch
- `tsc` and lint pass

---

### DRIZZLE-03: Migrate userStore to Drizzle

**Priority:** P0
**Phase:** 1.5
**Estimate:** 0.5 day
**Depends on:** DRIZZLE-01

**Description:** Replace AsyncStorage-persisted userStore with Drizzle SQLite queries.

**Tasks:**
- [ ] Read/write `profile` table for cash on hand, income, payday, expenses, analytics opt-out
- [ ] Replace `setCashOnHand`, `setMonthlyIncome`, `setPayday`, `setCommittedExpenses` with Drizzle updates
- [ ] One-time migration: read `falcly-user` from AsyncStorage, insert into SQLite `profile` table
- [ ] Keep `analyticsOptOut` reactive via `useLiveQuery` or Zustand wrapper
- [ ] Remove `persist` middleware from userStore

**Acceptance Criteria:**
- FinanceCard reads/writes via SQLite
- Cash staleness timestamp persists correctly
- Debounced autosave still works with Drizzle writes

---

### DRIZZLE-04: Create remote Postgres schema

**Priority:** P2
**Phase:** 4 (with sync)
**Estimate:** 0.5 day
**Depends on:** DRIZZLE-01

**Description:** Create the `pgTable` schema mirroring the local SQLite schema for Supabase sync.

**Tasks:**
- [ ] Create `db/schema/remote.ts` with `pgTable` definitions
- [ ] Map column types: `real` → `numeric`, `integer` → `smallint`/`integer`, `text` → `text`
- [ ] Add `user_id` column (not in local schema — added during sync)
- [ ] Verify schema matches Supabase SQL from migration doc

**Acceptance Criteria:**
- Remote schema types align with Supabase tables
- Can be used by sync engine for typed push/pull

---

## Epic: SYNC — Cloud Sync (Pro/Pro+ only)

### SYNC-01: Implement sync engine

**Priority:** P2
**Phase:** 4
**Estimate:** 2 days
**Depends on:** AUTH-01, DRIZZLE-04, CLEANUP-01

**Description:** Build the push/pull sync engine for Pro/Pro+ users.

**Tasks:**
- [ ] Create `utils/syncEngine.ts` with `pushCardsToRemote`, `pullRemoteCards`, `pushProfileToRemote`, `pullRemoteProfile`
- [ ] Merge strategy: last-write-wins by `updated_at` timestamp
- [ ] Handle card create/update/delete operations
- [ ] Handle `isActive` and card ordering sync
- [ ] Map local `Card` type to Supabase `cards` table columns

**Acceptance Criteria:**
- Local cards push to Supabase correctly
- Remote cards pull and merge into local state
- Deleted cards are removed remotely
- Timestamps prevent stale overwrites

---

### SYNC-02: Implement sync hook

**Priority:** P2
**Phase:** 4
**Estimate:** 1 day
**Depends on:** SYNC-01

**Description:** Wire the sync engine to Zustand store changes.

**Tasks:**
- [ ] Create `hooks/useSyncToSupabase.ts`
- [ ] Watch `cardStore` and `userStore` changes via `subscribe`
- [ ] Debounce pushes (2s after last change)
- [ ] Pull on app launch when `shouldSync` (tier is pro/pro_plus, user exists, online)
- [ ] Respect `useNetworkStatus` — skip sync when offline
- [ ] Queue offline changes, push when connection returns

**Acceptance Criteria:**
- Changes sync within 2s of last edit when online
- Offline changes sync when connection returns
- Free/trial users never trigger sync
- Sync stops immediately on downgrade to free

---

### SYNC-03: Sync status UI

**Priority:** P2
**Phase:** 4
**Estimate:** 0.5 day
**Depends on:** SYNC-02

**Description:** Replace placeholder cloud sync status in settings.

**Tasks:**
- [ ] Show last sync timestamp
- [ ] Show sync state: synced, syncing, offline, error
- [ ] Replace current static "Connected — sync available" text

**Acceptance Criteria:**
- Pro users see accurate sync status
- Free users don't see sync section
- Offline state shows clearly

---

### SYNC-04: Data retention cleanup

**Priority:** P3
**Phase:** 4
**Estimate:** 0.5 day
**Depends on:** SYNC-01

**Description:** Implement 90-day data retention for downgraded users.

**Tasks:**
- [ ] Create Supabase pg_cron job or Edge Function
- [ ] Delete `cards` rows where user tier is free and `proExpiredAt` > 90 days
- [ ] Respect local data (don't delete local — only remote)

**Acceptance Criteria:**
- Remote data is cleaned up after 90 days post-downgrade
- Local data persists regardless
- User is warned before deletion (existing `daysUntilDataDeletion` logic)

---

## Epic: VERIFY — Final Verification

### VERIFY-01: End-to-end auth flow testing

**Priority:** P0
**Phase:** 5
**Estimate:** 0.5 day
**Depends on:** CLEANUP-01

**Description:** Test all auth flows end-to-end.

**Flows to test:**
- [ ] Email sign-up → verify email → sign in
- [ ] Email sign-in with existing account
- [ ] Email forgot password → reset → sign in with new password
- [ ] Google sign-in (dev build)
- [ ] Apple sign-in (iOS)
- [ ] Sign out → redirects to sign-in screen
- [ ] Delete account → redirects to sign-in, data removed
- [ ] Session persistence: kill app → reopen → still signed in
- [ ] Token refresh: leave app in background 1+ hours → reopen → still works

---

### VERIFY-02: Update documentation

**Priority:** P1
**Phase:** 5
**Estimate:** 0.5 day
**Depends on:** VERIFY-01

**Description:** Update project docs to reflect new stack.

**Tasks:**
- [ ] Update `CLAUDE.md` tech stack section
- [ ] Update `docs/discovery/16-tech-stack.md`
- [ ] Archive `docs/migration-firebase-to-supabase.md` as completed
- [ ] Remove `firebase/` references from `.gitignore` if no longer needed

---

## Story Dependency Graph

```
AUTH-01 (Supabase + Drizzle setup)
  ├── AUTH-02 (authStore rewrite)
  │     ├── AUTH-04 (sign-in screen)
  │     ├── AUTH-05 (settings screen)
  │     ├── AUTH-06 (root layout listener)
  │     └── AUTH-07 (avatar update)
  ├── AUTH-03 (Apple Sign-In)
  │     └── AUTH-04 (sign-in screen)
  ├── DRIZZLE-01 (local DB setup)
  │     ├── DRIZZLE-02 (migrate cardStore)
  │     ├── DRIZZLE-03 (migrate userStore)
  │     └── DRIZZLE-04 (remote Postgres schema)
  │           └── SYNC-01 (sync engine)
  │                 ├── SYNC-02 (sync hook)
  │                 │     └── SYNC-03 (sync status UI)
  │                 └── SYNC-04 (data retention)
  └── ...

CRASH-01 (Sentry) ← AUTH-06

CLEANUP-01 (remove Firebase) ← AUTH-06 + CRASH-01

VERIFY-01 (testing) ← CLEANUP-01 + DRIZZLE-02 + DRIZZLE-03
VERIFY-02 (docs) ← VERIFY-01
```

## Summary

| Epic | Stories | Estimate |
|------|---------|----------|
| AUTH | 7 | 3.75 days |
| DRIZZLE | 4 | 3.5 days |
| CRASH | 1 | 1 day |
| CLEANUP | 1 | 1 day |
| SYNC | 4 | 4 days |
| VERIFY | 2 | 1 day |
| **Total** | **19** | **~14.25 days** |

## Critical Path

`AUTH-01 → DRIZZLE-01 → DRIZZLE-02 + DRIZZLE-03 → AUTH-02 → AUTH-06 → CRASH-01 → CLEANUP-01 → VERIFY-01`

The Drizzle local DB migration is now on the critical path since stores must be rewritten before Firebase removal. SYNC, Apple Sign-In, and remote Postgres schema can be deferred.
