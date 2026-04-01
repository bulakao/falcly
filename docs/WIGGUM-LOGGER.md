# WIGGUM — Structured Logging System PRD

**Generated:** 2026-04-01

---

## Completed

| Story | Description | Status |
|-------|-------------|--------|
| LOG-01 | Core types, sanitizer, breadcrumbs, logger singleton | Done |
| LOG-02 | Console transport | Done |
| LOG-03 | Wire logger into app boot | Done |
| PERSIST-01 | File transport with rotation | Done |
| CRASH-01 | Enhanced crash handler with breadcrumbs | Done |
| MW-01 | Performance measurement utilities | Done |
| MW-02 | Navigation tracking | Done |
| MW-03 | Network request logging | Done |
| MW-04 | Zustand store mutation middleware | Done |

---

## Remaining

### PERSIST-02: Export logs for debugging

**Priority:** P1
**Estimate:** 0.5 day
**Depends on:** PERSIST-01

**Description:** Add "Export Debug Logs" button in settings screen.

**Tasks:**
- [ ] Add "Export Debug Logs" button in settings screen (share sheet via `expo-sharing`)
- [ ] Add "Clear Logs" option

**Acceptance Criteria:**
- Tapping "Export Debug Logs" opens share sheet with log file
- `clearLogs()` removes all files from log directory

**Note:** `exportLogs()`, `getLogFileList()`, and `clearLogs()` are already implemented in `utils/logger/transports/file.ts`. Only the UI wiring remains.

---

### REMOTE-01: Supabase remote transport

**Priority:** P3
**Phase:** Deferred (with SYNC epic)
**Estimate:** 1 day

**Description:** Ship error/fatal logs to Supabase for Pro users, with breadcrumb context.

**Tasks:**
- [ ] Create `utils/logger/transports/remote.ts`
- [ ] Gate by Pro subscription
- [ ] Batch + retry with exponential backoff
- [ ] Respect offline state

---

### REMOTE-02: Supabase Edge Function for log ingestion

**Priority:** P3
**Phase:** Deferred (with SYNC epic)
**Estimate:** 0.5 day
**Depends on:** REMOTE-01

**Description:** Create Supabase Edge Function `ingest-logs` to receive and store device logs.

---

## Summary

| Epic | Stories | Done | Remaining |
|------|---------|------|-----------|
| LOG | 3 | 3 | 0 |
| PERSIST | 2 | 1 | 1 |
| CRASH | 1 | 1 | 0 |
| MW | 4 | 4 | 0 |
| REMOTE | 2 | 0 | 2 |
| **Total** | **12** | **9** | **3** |
