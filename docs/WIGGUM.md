# WIGGUM — Firebase to Supabase Migration PRD

**Source:** [migration-firebase-to-supabase.md](migration-firebase-to-supabase.md)
**Generated:** 2026-04-01

---

## Completed

| Story | Description | Status |
|-------|-------------|--------|
| AUTH-01 | Set up Supabase project and client | Done |
| AUTH-02 | Rewrite authStore for Supabase | Done |
| AUTH-03 | Update sign-in screen | Done |
| AUTH-04 | Update settings screen | Done |
| AUTH-05 | Update root layout auth listener | Done |
| AUTH-06 | Update AllCardsOverview avatar | Done |
| CRASH-01 | Replace Crashlytics → console logger | Done |
| CLEANUP-01 | Uninstall Firebase packages and config | Done |
| DRIZZLE-01 | Set up Drizzle + expo-sqlite | Done |
| DRIZZLE-02 | Migrate cardStore to Drizzle | Done |
| DRIZZLE-03 | Migrate userStore to Drizzle | Done |

---

## Remaining

### DRIZZLE-04: Create remote Postgres schema

**Priority:** P2
**Phase:** Deferred (with SYNC epic)
**Estimate:** 0.5 day

**Description:** Create `pgTable` schema mirroring local SQLite for Supabase sync.

**Tasks:**
- [ ] Create `db/schema/remote.ts` with `pgTable` definitions
- [ ] Add `user_id` column for multi-user sync
- [ ] Verify schema matches Supabase tables

---

### SYNC-01: Implement sync engine

**Priority:** P2
**Phase:** Deferred
**Estimate:** 2 days

**Description:** Push/pull sync engine for Pro/Pro+ users. Last-write-wins by `updated_at`.

---

### SYNC-02: Implement sync hook

**Priority:** P2
**Phase:** Deferred
**Estimate:** 1 day
**Depends on:** SYNC-01

**Description:** Wire sync to Zustand store changes. Debounced pushes, pull on launch.

---

### SYNC-03: Sync status UI

**Priority:** P2
**Phase:** Deferred
**Estimate:** 0.5 day
**Depends on:** SYNC-02

**Description:** Show sync status in settings (synced/syncing/offline/error).

---

### SYNC-04: Data retention cleanup

**Priority:** P3
**Phase:** Deferred
**Estimate:** 0.5 day

**Description:** 90-day remote data retention for downgraded users via pg_cron.

---

### VERIFY-01: End-to-end auth flow testing

**Priority:** P1
**Estimate:** 0.5 day

**Flows to test:**
- [ ] Email sign-up → sign in
- [ ] Google sign-in (dev build)
- [ ] Sign out → redirects to sign-in
- [ ] Delete account → data removed
- [ ] Session persistence across app restarts
- [ ] Token refresh after background

---

### VERIFY-02: Update documentation

**Priority:** P1
**Estimate:** 0.5 day

**Tasks:**
- [ ] Update `CLAUDE.md` tech stack section
- [ ] Update `docs/discovery/16-tech-stack.md`
- [ ] Archive migration doc as completed

---

## Summary

| Epic | Stories | Done | Remaining |
|------|---------|------|-----------|
| AUTH | 6 | 6 | 0 |
| DRIZZLE | 4 | 3 | 1 |
| CRASH | 1 | 1 | 0 |
| CLEANUP | 1 | 1 | 0 |
| SYNC | 4 | 0 | 4 |
| VERIFY | 2 | 0 | 2 |
| **Total** | **18** | **11** | **7** |
