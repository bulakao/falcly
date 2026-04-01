# WIGGUM — Structured Logging System PRD

**Generated:** 2026-04-01

---

## Epic: LOG — Core Logger

### LOG-01: Types, sanitizer, and core logger singleton

**Priority:** P0 (blocker for all other stories)
**Phase:** 1
**Estimate:** 1 day

**Description:** Build the foundational logger module with log levels, structured records, PII sanitization, and transport dispatch.

**Tasks:**
- [ ] Create `utils/logger/types.ts` — `LogLevel` (debug/info/warn/error/fatal), `LogRecord`, `LogContext`, `Transport` interface, `LoggerConfig`
- [ ] Create `utils/logger/sanitizer.ts` — deep-clone + redact PII: amounts (₱/$), PHP amounts, long numbers, emails, card numbers, JWTs, passwords, tokens; subsumes `utils/secureLogger.ts`
- [ ] Create `utils/logger/breadcrumbs.ts` — circular buffer (50 entries, ~10KB), lightweight entries (timestamp, level, tag, message only)
- [ ] Create `utils/logger/core.ts` — singleton class with `debug/info/warn/error/fatal(tag, message, data?)`, level gating (early return before object allocation), monotonic sequenceNumber, sessionId (random UUID per launch), context provider callback, sanitize-before-dispatch
- [ ] Create `utils/logger/index.ts` — public API: `logger` singleton, `initLogger()`, re-exports
- [ ] Deprecate `utils/secureLogger.ts` — thin wrappers calling `logger.debug`/`logger.warn`
- [ ] Deprecate `utils/crashReporting.ts` — thin wrappers calling `logger.error`/`logger.fatal`

**Acceptance Criteria:**
- `logger.info('Tag', 'message', { email: 'user@test.com' })` produces a sanitized `LogRecord` with `[EMAIL]`
- `logger.debug(...)` in prod (minLevel: warn) returns immediately with zero allocations
- Breadcrumb buffer wraps correctly at capacity, evicts oldest first
- `tsc --noEmit` passes

---

### LOG-02: Console transport

**Priority:** P0
**Phase:** 1
**Estimate:** 0.25 day
**Depends on:** LOG-01

**Description:** Dev-only console transport with formatted, level-mapped output.

**Tasks:**
- [ ] Create `utils/logger/transports/console.ts`
- [ ] Format: `[HH:MM:SS.mmm] [LEVEL] [Tag] Message {data}`
- [ ] Map levels: debug/info → `console.log`, warn → `console.warn`, error/fatal → `console.error`
- [ ] Only active when `__DEV__` is true

**Acceptance Criteria:**
- Dev console shows formatted log lines with timestamps
- No console output in production builds
- Data objects are printed inline when present

---

### LOG-03: Wire logger into app boot

**Priority:** P0
**Phase:** 1
**Estimate:** 0.25 day
**Depends on:** LOG-01, LOG-02

**Description:** Initialize logger in `_layout.tsx` boot sequence, replacing direct `initCrashReporting()` call.

**Tasks:**
- [ ] Call `initLogger()` in the `loaded && dbReady` effect in `_layout.tsx`
- [ ] Replace `initCrashReporting()` call with logger-based crash init
- [ ] Add `logger.info('App', 'App initialized')` after boot
- [ ] Update imports in any file using `secureLog`/`secureWarn`/`logBreadcrumb`/`recordSafeError` to use logger

**Acceptance Criteria:**
- App boots with logger initialized
- Existing crash reporting behavior preserved
- No references to old `secureLog`/`secureWarn` in app code (deprecation wrappers still exist)

---

## Epic: PERSIST — File Persistence

### PERSIST-01: File transport with rotation

**Priority:** P1
**Phase:** 2
**Estimate:** 1 day
**Depends on:** LOG-01

**Description:** Persist logs to device storage using `expo-file-system` in JSONL format with automatic rotation.

**Tasks:**
- [ ] Create `utils/logger/transports/file.ts`
- [ ] Write JSONL (one JSON record per line) to `FileSystem.documentDirectory + 'logs/'`
- [ ] Batched writes: accumulate max 20 records or 5 seconds, whichever first
- [ ] File naming: `falcly-YYYY-MM-DD.jsonl`
- [ ] Rotation: on init + hourly check, delete files older than 7 days
- [ ] Cap total log directory at 5MB; delete oldest files when exceeded
- [ ] minLevel: `debug` in dev, `warn` in prod
- [ ] `flush()` method for crash handler to call before app terminates

**Acceptance Criteria:**
- Log files appear in `documentDirectory/logs/` in JSONL format
- Files older than 7 days are cleaned up
- Total log size stays under 5MB
- Batched writes don't block JS thread

---

### PERSIST-02: Export logs for debugging

**Priority:** P1
**Phase:** 2
**Estimate:** 0.5 day
**Depends on:** PERSIST-01

**Description:** Expose log export API for a "Send debug logs" button in settings.

**Tasks:**
- [ ] Export `exportLogs()` — returns file URI of combined log archive
- [ ] Export `getLogFileList()` — returns `{name, size, date}[]`
- [ ] Export `clearLogs()` — deletes all log files
- [ ] Add "Export Debug Logs" button in settings screen (share sheet via `expo-sharing`)

**Acceptance Criteria:**
- Tapping "Export Debug Logs" opens share sheet with log file
- `clearLogs()` removes all files from log directory
- Log file list shows accurate sizes and dates

---

## Epic: CRASH — Enhanced Crash Handler

### CRASH-01: Replace crashReporting.ts with logger-based crash handler

**Priority:** P0
**Phase:** 2
**Estimate:** 0.5 day
**Depends on:** LOG-01, PERSIST-01

**Description:** Enhanced crash handler that captures breadcrumbs, flushes to file, and handles unhandled promise rejections.

**Tasks:**
- [ ] Create `utils/logger/crash.ts`
- [ ] Set `ErrorUtils.setGlobalHandler` — log `fatal` with error + breadcrumb trail, flush, chain to default handler
- [ ] Add `globalThis.addEventListener('unhandledrejection', ...)` — log `error` with rejection reason
- [ ] Attach breadcrumb trail (last 50 events) to every fatal record's data
- [ ] Stack trace sanitization: redact PII, strip absolute paths to relative
- [ ] Delete `utils/crashReporting.ts` (replace with re-exports from logger during transition)

**Acceptance Criteria:**
- Uncaught JS errors log a `fatal` record with breadcrumbs and flush to file
- Unhandled promise rejections log an `error` record
- PII in stack traces is redacted
- File transport flushes before app terminates

---

## Epic: MW — Middleware Integrations

### MW-01: Performance measurement utilities

**Priority:** P2
**Phase:** 3
**Estimate:** 0.5 day
**Depends on:** LOG-01

**Description:** Timing helpers for async operations, sync operations, and React renders.

**Tasks:**
- [ ] Create `utils/logger/middleware/performance.ts`
- [ ] `measureAsync<T>(tag, label, operation, thresholdMs?)` — wraps async fn, logs duration, warns if threshold exceeded (default 1000ms)
- [ ] `measureSync<T>(tag, label, operation, thresholdMs?)` — same for sync
- [ ] `useRenderTimer(screenName)` — hook that logs mount time via `useEffect`
- [ ] Log data includes `{ durationMs, label, exceededThreshold }`

**Acceptance Criteria:**
- `measureAsync('DB', 'loadCards', () => db.select()...)` logs timing
- Threshold warnings fire at warn level when exceeded
- `useRenderTimer` logs once per mount, not per re-render

---

### MW-02: Navigation tracking

**Priority:** P2
**Phase:** 3
**Estimate:** 0.25 day
**Depends on:** LOG-01

**Description:** Automatically log route changes and update logger context with current screen.

**Tasks:**
- [ ] Create `utils/logger/middleware/navigation.ts`
- [ ] `useNavigationLogger()` hook — uses `usePathname()` and `useSegments()` from expo-router
- [ ] On route change: log `info` with tag `Navigation`, message includes from/to paths
- [ ] Update logger shared context with `{ screen: currentPath }`
- [ ] Add `useNavigationLogger()` to `RootLayoutNav` in `_layout.tsx`

**Acceptance Criteria:**
- Route changes produce info-level log records
- All subsequent log records include `context.screen` with current route
- No duplicate logs on re-renders without actual navigation

---

### MW-03: Network request logging

**Priority:** P2
**Phase:** 3
**Estimate:** 0.5 day
**Depends on:** LOG-01

**Description:** Fetch interceptor that logs HTTP request/response metadata without bodies.

**Tasks:**
- [ ] Create `utils/logger/middleware/network.ts`
- [ ] `installNetworkLogger()` — replaces `globalThis.fetch` with wrapper
- [ ] On request: log `info` with `{ method, url (host+path only, query params redacted), requestId }`
- [ ] On response: log `info` with `{ requestId, status, durationMs }`
- [ ] On failure: log `error` with `{ requestId, errorMessage (sanitized), durationMs }`
- [ ] Never log request/response bodies (financial data risk)
- [ ] Redact authorization headers entirely
- [ ] Skip PostHog and Supabase auth token refresh URLs to avoid log spam

**Acceptance Criteria:**
- Network requests produce paired start/complete log records
- No request/response bodies appear in any log record
- Auth headers are redacted
- PostHog/Supabase refresh URLs are excluded

---

### MW-04: Zustand store mutation logging

**Priority:** P2
**Phase:** 3
**Estimate:** 0.5 day
**Depends on:** LOG-01

**Description:** Zustand middleware factory that logs state diffs on every mutation.

**Tasks:**
- [ ] Create `utils/logger/middleware/zustand.ts`
- [ ] `loggerMiddleware<T>(storeName, options?)` — Zustand middleware factory
- [ ] Log tag: `Store:${storeName}`, message: action name (derived from calling function)
- [ ] Data: diff of changed keys; sensitive values show `[changed]` not actual old/new
- [ ] Options: `ignoreActions` (skip `_initialized` etc.), `level` (default: `info`)
- [ ] Add middleware to `cardStore`, `userStore`, `authStore`, `subscriptionStore`

**Acceptance Criteria:**
- State changes produce info-level logs with store name and changed keys
- Sensitive values (cashOnHand, balances, passwords, tokens) show `[changed]`
- Ignored actions produce no logs
- In prod (minLevel: warn), info-level store logs are filtered with zero overhead

---

## Epic: REMOTE — Remote Log Shipping

### REMOTE-01: Supabase remote transport

**Priority:** P3
**Phase:** 4
**Estimate:** 1 day
**Depends on:** LOG-01, PERSIST-01

**Description:** Ship error/fatal logs to Supabase for Pro users, with breadcrumb context.

**Tasks:**
- [ ] Create `utils/logger/transports/remote.ts`
- [ ] Gated by `useSubscriptionStore.getState().isPro()` — free/trial users never ship
- [ ] minLevel: `error` (errors + fatals only, plus breadcrumb trail on fatal)
- [ ] Batch window: 30 seconds or 10 records, whichever first
- [ ] Ship via `supabase.functions.invoke('ingest-logs', { body: batch })`
- [ ] Retry: exponential backoff (1s, 2s, 4s), max 3 retries
- [ ] Respect network state via `@react-native-community/netinfo` — queue when offline, flush when online
- [ ] Add transport conditionally in `_layout.tsx` after subscription check

**Acceptance Criteria:**
- Pro user errors appear in Supabase (via Edge Function)
- Free/trial users never trigger remote shipping
- Offline errors queue and ship when connectivity returns
- Batch size stays reasonable (no request floods)

---

### REMOTE-02: Supabase Edge Function for log ingestion

**Priority:** P3
**Phase:** 4
**Estimate:** 0.5 day
**Depends on:** REMOTE-01

**Description:** Create the Supabase Edge Function that receives and stores device logs.

**Tasks:**
- [ ] Create Edge Function `ingest-logs` — accepts batch of `LogRecord[]`
- [ ] Validate JWT (only authenticated users)
- [ ] Insert into `device_logs` table: `id`, `user_id`, `timestamp`, `level`, `tag`, `message`, `data` (jsonb), `session_id`, `app_version`
- [ ] Add RLS: users can only read their own logs
- [ ] Add index on `(user_id, timestamp)` for efficient queries

**Acceptance Criteria:**
- Edge Function accepts and stores log batches
- Unauthenticated requests are rejected
- Logs are queryable by user and time range in Supabase dashboard

---

## Story Dependency Graph

```
LOG-01 (core types, sanitizer, breadcrumbs, logger singleton)
  ├── LOG-02 (console transport)
  │     └── LOG-03 (wire into app boot)
  ├── PERSIST-01 (file transport + rotation)
  │     ├── PERSIST-02 (export logs UI)
  │     ├── CRASH-01 (enhanced crash handler)
  │     └── REMOTE-01 (Supabase remote transport)
  │           └── REMOTE-02 (Edge Function)
  ├── MW-01 (performance measurement)
  ├── MW-02 (navigation tracking)
  ├── MW-03 (network request logging)
  └── MW-04 (Zustand store mutation logging)
```

## Summary

| Epic | Stories | Estimate |
|------|---------|----------|
| LOG | 3 | 1.5 days |
| PERSIST | 2 | 1.5 days |
| CRASH | 1 | 0.5 day |
| MW | 4 | 1.75 days |
| REMOTE | 2 | 1.5 days |
| **Total** | **12** | **~6.75 days** |

## Critical Path

`LOG-01 → LOG-02 → LOG-03 → PERSIST-01 → CRASH-01`

Core logger and file persistence are the critical path. Middleware (MW-01 through MW-04) can be built in parallel after LOG-01. Remote transport is deferred and independent.

## Technical Notes

- **Zero native modules added** — uses `expo-file-system` (already installed)
- **Privacy-first**: sanitizer runs on every record before any transport. No "raw" log path exists.
- **Performance**: debug/info calls in prod (`minLevel: warn`) return before allocating objects
- **Financial data**: request/response bodies are never logged. Store mutation values for balances/amounts show `[changed]` only.
