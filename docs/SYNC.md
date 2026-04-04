# SYNC.md — Auth, Data Ownership & Sync Strategy

> Generic boilerplate reference. Written for Falcly but applicable to any local-first mobile app using SQLite + Supabase Auth.

---

## Architecture Overview

This app is **local-first**: all data lives in SQLite on-device via Drizzle. Supabase is auth-only today. Cloud sync is an opt-in layer, not a requirement for core functionality.

```
Device
├── SQLite (Drizzle)     ← source of truth
├── Zustand stores       ← in-memory
└── Supabase Auth        ← identity only (today)

Cloud (future)
└── Supabase DB          ← mirror of SQLite for backup/sync
```

---

## User Identity Model

| State | Description |
|-------|-------------|
| **Guest** | No account. Data is device-local, anonymous. |
| **Authenticated** | Has a Supabase account. Data can be backed up / synced. |
| **Guest → Auth** | Created local data, then signed in. Requires merge decision. |
| **Auth → Guest** | Signed out. Local data stays. Now anonymous until next sign-in. |

---

## Sync Strategy: Cloud Backup (Recommended Phase)

Not real-time sync. Not Firebase. Simple backup/restore model:

- **On sign-in:** upload local records to Supabase if cloud is empty
- **On new install / sign-in with existing account:** download from cloud
- **Conflict (local + cloud both have data):** prompt user to choose
- **After backup established:** incremental sync on mutations (add/edit/delete)

This covers the 90% case (reinstall, new device) without the complexity of real-time multi-device sync.

---

## All Scenarios

### Scenario 1 — New install, skips auth (Guest)

**Flow:** Opens app → skips sign-in during onboarding → uses app fully as guest

**Behavior:**
- All data stored locally
- Full functionality up to free tier limits
- No backup, no restore on reinstall

**Risk:** Data lost on uninstall or device wipe

**Resolution:**
- Show a soft prompt periodically: "Back up your cards — sign in to save your data"
- Not intrusive, dismissible, respects the guest choice

---

### Scenario 2 — Returning user, reinstalls or gets new device

**Flow:** Had the app, uninstalled (or new phone), reinstalls, signs in

**Behavior (today):** Signs in → empty app. Cards are gone. ❌

**Behavior (with cloud backup):** Signs in → detects cloud backup → restores cards ✅

**Resolution:**
- On sign-in, check Supabase for existing records
- If found: restore silently (or show "Restoring your X cards...")
- If not found: fresh start

---

### Scenario 3 — Guest creates cards, then signs in (new account)

**Flow:** Guest with local cards → signs up for the first time

**Behavior:**
- Local cards exist, cloud is empty (new account)
- Upload local cards to cloud, associate with new user_id
- Continue seamlessly — no disruption

**Resolution:** Auto-upload on first sign-in when cloud is empty. Show "Your cards have been backed up" toast.

---

### Scenario 4 — Guest creates cards, then signs in (existing account with prior data)

**Flow:** Guest with local cards → signs into an existing account that already has cards in the cloud

**Behavior:**
- Local cards: 2 cards (BDO, BPI)
- Cloud cards: 3 cards (BDO, Metrobank, Security Bank)
- Overlap possible (BDO appears in both)

**Resolution — present a clear choice:**

```
You have local cards and cloud cards.

[ Keep local cards ]   [ Restore from cloud ]   [ Merge both ]
```

- **Keep local** → overwrite cloud with device data
- **Restore from cloud** → overwrite local with cloud data (local data lost)
- **Merge both** → union of both sets, deduplicate by (bankName + statementDay), user resolves exact duplicates

> For boilerplate: "Merge both" is optional complexity. "Keep local" and "Restore from cloud" are the must-haves.

---

### Scenario 5 — Logged in, signs out

**Flow:** User signs out from Settings

**Behavior:**
- Auth clears (Supabase session ends)
- **Local data stays** — cards remain on device
- App continues to work as guest with existing data
- Next sign-in will trigger merge check again

**Note:** This is intentional. Signing out should not destroy data.

---

### Scenario 6 — Logged in, reinstalls (with cloud backup)

**Flow:** User reinstalls — signed in before, cloud backup exists

**Behavior:**
- Signs in → detects cloud data → restores
- Same as Scenario 2

---

### Scenario 7 — Two devices, same account (multi-device)

**Flow:** Phone A and Phone B both signed in to the same account

**Behavior (cloud backup model):**
- Changes on Phone A sync to cloud → Phone B pulls on next open
- Not real-time — eventual consistency on app foreground / explicit sync

**Conflict:** Both devices edit the same card offline → last-write-wins by `updatedAt` timestamp

> For boilerplate: multi-device is Phase 2. Backup model handles it "good enough" — users rarely edit the same card on two devices simultaneously.

---

### Scenario 8 — Guest hits paywall (needs Pro / RevenueCat)

**Flow:** Guest tries to add a 4th card → hits paywall → must sign in to subscribe

**Behavior:**
- RevenueCat requires a user identity for subscription management
- Natural point to prompt account creation
- After sign-in: check for cloud data (merge if needed), then complete purchase

**Resolution:** Paywall screen gates on sign-in first, then purchase. Show "Create an account to subscribe" before showing plan options.

---

### Scenario 9 — Guest, no account, uninstalls

**Flow:** Guest never signed in → uninstalls app

**Behavior:** All data gone. No recovery.

**Resolution:**
- Periodic "back up your data" nudge
- Clear messaging: "Your data is saved on this device only. Sign in to back it up."
- Not a blocker — user made the choice

---

### Scenario 10 — Subscription lapses (Pro → Free)

**Flow:** User was Pro, subscription expires

**Behavior:**
- Cards 3+ become read-only
- Sync/backup continues (auth is separate from subscription)
- No data deleted unless explicitly triggered (see grace period logic in subscriptionStore)

---

### Scenario 11 — Account deletion

**Flow:** User taps "Delete Account" in Settings

**Behavior:**
- Supabase `delete_own_account` RPC runs
- Cloud data deleted
- Local data cleared (cardStore.reset, userStore.reset, etc.)
- App returns to onboarding

**Important:** Warn the user: "This will delete all your data permanently. This cannot be undone."

---

### Scenario 12 — Token expiry / silent sign-out

**Flow:** Supabase session expires while user is using the app

**Behavior:**
- `onAuthStateChange` fires with `SIGNED_OUT` event
- App should gracefully degrade to guest mode (not crash)
- Prompt re-authentication if user tries a cloud action

**Resolution:** Handle `SIGNED_OUT` in `_layout.tsx` — don't wipe local data, just clear `authStore.user`.

---

### Scenario 13 — Offline during sign-in (no network)

**Flow:** User tries to sign in with no internet

**Behavior:**
- Supabase auth fails (network error)
- App is offline-first — local data still works
- Show friendly error: "No connection. You can still use the app offline."

---

### Scenario 14 — Corrupted local DB

**Flow:** SQLite file corrupted (rare but possible on Android)

**Behavior:**
- Drizzle migrations may fail
- App could crash on load

**Resolution:**
- Catch migration errors in `useRunMigrations`
- Offer "Reset local data" escape hatch
- If user has cloud backup → restore after reset

---

## Conflict Resolution Rules

| Situation | Strategy |
|-----------|----------|
| Local only, cloud empty | Auto-upload local → cloud |
| Cloud only, local empty | Auto-download cloud → local |
| Both exist, same user | Present choice (keep local / restore cloud / merge) |
| Both exist, same record | Last-write-wins by `updatedAt` |
| Duplicate detection | Match on `(bankName, statementDay)` — flag for user review |

---

## Sync Trigger Points

When cloud backup is implemented, sync should trigger at:

| Event | Action |
|-------|--------|
| Sign-in | Full pull (or merge check) |
| First sign-up | Full push (upload local) |
| Add card | Push new record |
| Edit card | Push updated record |
| Delete card | Soft delete (set `deletedAt`) |
| App foreground | Lightweight pull (changed since last sync) |
| Manual "Sync now" | Full reconciliation |

> Use `updatedAt` / `deletedAt` timestamps on all records. Soft deletes prevent sync gaps.

---

## Supabase Schema (when implemented)

```sql
-- Mirror of local cards table, scoped to user
create table user_cards (
  id          text primary key,        -- same UUID as local
  user_id     uuid references auth.users not null,
  data        jsonb not null,          -- serialized card fields
  updated_at  timestamptz not null,
  deleted_at  timestamptz,             -- soft delete
  created_at  timestamptz default now()
);

-- RLS: users can only access their own cards
alter table user_cards enable row level security;
create policy "own cards" on user_cards
  using (auth.uid() = user_id);
```

Using `jsonb` for card data keeps the sync layer generic — any app using this boilerplate just changes the shape of `data`.

---

## Implementation Phases

### Phase 1 (Today) — Auth only
- Supabase auth ✅
- Local SQLite only ✅
- No cloud backup
- Clear messaging: "Data is on this device"

### Phase 2 — Cloud Backup
- Supabase `user_cards` table
- Upload on sign-in (if cloud empty)
- Restore on new install
- Merge prompt when both sides have data
- Incremental sync on mutations

### Phase 3 — Multi-device Sync
- Foreground pull on app resume
- Conflict resolution by `updatedAt`
- "Last synced" indicator in Settings
- Manual sync trigger

### Phase 4 — Real-time (optional)
- Supabase Realtime subscriptions
- Live updates across devices
- Operational transforms or CRDTs for true conflict-free merging

---

## UX Principles

1. **Never block core functionality on auth.** Guest mode must work fully.
2. **Never silently delete local data.** Sign-out keeps local data. Only account deletion wipes it.
3. **Be transparent about data location.** Users should always know if their data is local-only.
4. **Merge is a user decision.** When conflict exists, present a clear choice — never auto-merge silently.
5. **Graceful degradation.** Network failure should never crash the app or lose data.
6. **Soft deletes always.** Hard deletes create sync gaps. Use `deletedAt`.

---

## Files to Touch (when implementing Phase 2)

| File | Change |
|------|--------|
| `store/authStore.ts` | Add `syncOnSignIn()`, `uploadLocalData()`, `pullCloudData()` |
| `store/cardStore.ts` | Add `syncCard()`, `softDeleteCard()`, `mergeCards()` |
| `utils/sync.ts` | New — sync engine, conflict detection, merge logic |
| `app/sign-in.tsx` | Trigger sync check after sign-in |
| `app/settings.tsx` | "Last synced" row, "Sync now" button |
| `supabase/migrations/` | `user_cards` table + RLS policies |
| `db/schema/local.ts` | Add `updatedAt`, `deletedAt` to cards table |

---

*Last updated: 2026-04-04*
*Stack: React Native (Expo) + SQLite (Drizzle) + Supabase Auth*
