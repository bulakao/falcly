# Falcly — Technical Stack

> **Last Updated:** 2026-04-04
> **Status:** Implemented — 95/99 stories passing
> **Platform:** Android-first, iOS parity at launch

---

## Executive Summary

Falcly's stack: **Expo CNG (React Native 0.81+, New Architecture on)** with **Expo Router v4** for file-based routing, **expo-sqlite + Drizzle ORM** for local-first storage, **Supabase Auth** for authentication + cloud backup, **Zustand** for state management (persisted via AsyncStorage + Drizzle), **Jest** for testing, **Notifee** for local notifications. CI/CD via **EAS Build + EAS Update**.

**Key decision:** Local-first SQLite over Firestore. All data lives on-device, cloud is opt-in backup only. No Firebase dependency.

---

## Current Stack

| Layer | Technology | Status |
|-------|------------|--------|
| **Framework** | Expo CNG (React Native 0.81+) | ✅ |
| **Language** | TypeScript (strict mode) | ✅ |
| **Routing** | Expo Router v4 (file-based) | ✅ |
| **State** | Zustand (6 stores, persisted) | ✅ |
| **Local DB** | expo-sqlite + Drizzle ORM | ✅ |
| **Auth** | Supabase Auth + Google Sign-In | ✅ |
| **Cloud Sync** | Supabase Postgres (backup only) | ✅ |
| **Testing** | Jest + ts-jest | ✅ |
| **Notifications** | Notifee | ✅ |
| **Analytics** | (parked — PostHog planned) | ❌ |
| **Payments** | (pending — RevenueCat) | ❌ |
| **Crash Reports** | Custom JS handler | ✅ |

---

## 1. Framework

### Expo CNG (Continuous Native Generation)

Native `ios/` and `android/` folders are **never committed** — generated on-demand by `npx expo prebuild` during EAS Build. Source of truth is `app.json` + config plugins.

**React Native Version:** 0.81+ (New Architecture on by default)
**Hermes:** Enabled (default JS engine)
**Bundler:** Metro via Expo

### Why CNG?

| Benefit | Impact |
|---------|--------|
| No native folder maintenance | Expo manages upgrades |
| Cloud builds (no Mac for iOS) | EAS Build handles all platforms |
| OTA updates | EAS Update for JS-only changes |
| Config plugins for native changes | No manual AndroidManifest edits |

---

## 2. Project Structure

```
app/                    Expo Router screens and layouts
  (tabs)/               Bottom tab screens
  _layout.tsx           Root layout (auth gate, providers)
assets/                 Fonts, images, splash
components/
  atoms/                Basic UI elements
  molecules/            Composed components
  organisms/            Complex feature components
constants/              Theme, wiki cards, config
db/
  schema/               Drizzle schema definitions
docs/                   PRD, discovery, archives
drizzle/                Migrations
hooks/                  Custom React hooks
store/                  Zustand stores
theme/                  Colors, fonts, spacing
types/                  TypeScript definitions
utils/                  Decision engine, sync, helpers
__tests__/              Jest test suites
```

---

## 3. State Management

### Zustand Stores (6 total)

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `cardStore` | Cards CRUD | Drizzle (SQLite) |
| `userStore` | Profile, cash, paydays, overlay prefs | Drizzle (SQLite) |
| `transactionStore` | Transaction logging | Drizzle (SQLite) |
| `subscriptionStore` | Tier, trial, limits | AsyncStorage |
| `overlayStore` | Overlay queue, dismissed IDs | AsyncStorage |
| `authStore` | Supabase session | Memory (Supabase handles persistence) |

### Pattern

```typescript
// store/cardStore.ts
export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      cards: [],
      addCard: (card) => { /* ... */ },
      // ...
    }),
    {
      name: 'card-storage',
      storage: createDrizzleStorage(),
    }
  )
);
```

---

## 4. Database

### Local: expo-sqlite + Drizzle ORM

**Why SQLite over Firestore?**
- Offline-first by default (no sync complexity)
- Relational queries (joins, aggregations)
- No Firebase dependency
- Full control over data model

**Schema location:** `db/schema/local.ts`
**Migrations:** `drizzle/` folder

### Cloud: Supabase Postgres (backup only)

**Not real-time sync.** Simple backup/restore model:
- On sign-in: upload local records if cloud empty
- On new install: download from cloud
- On conflict: prompt user to choose

**Table:** `user_cards` with RLS policies
**Migration:** `supabase/migrations/`

---

## 5. Authentication

### Supabase Auth

- Email/password sign-up
- Google Sign-In (`@react-native-google-signin/google-signin`)
- Session persistence handled by Supabase
- Guest mode (no sign-in required for local use)

### Flow

```
App Launch
  └─ Check authStore.session
      ├─ Signed in → sync check → home
      └─ Guest → home (local data only)
```

---

## 6. Key Algorithms

### Decision Engine (`utils/decisionEngine.ts`)

**Tested:** 45 tests passing

| Function | Purpose |
|----------|---------|
| `daysToStatement()` | Days until statement close |
| `getCycleDates()` | Cycle start, close, due date |
| `utilization()` | Balance / limit ratio |
| `projectedStatementBalance()` | Balance + pending + swipe |
| `calculateCardStatus()` | SAFE/CAUTION/RISKY |
| `calculateSwipeImpact()` | Full impact analysis |
| `computeNetAvailableCash()` | Cash + income - expenses |
| `calculateBestCard()` | Rank cards, pick safest |
| `computePayoffProjection()` | Months to payoff, interest |

### Statement Advisor (`utils/statementAdvisor.ts`)

**Tested:** 25 tests passing

| Function | Purpose |
|----------|---------|
| `analyzeSpread()` | Score portfolio spread (0–100) |
| `calculateGaps()` | Find dead zones, clusters |
| `checkPaydayAlignment()` | Card-payday alignment check |
| `getOptimalSwipeDays()` | Best days to swipe per card |

---

## 7. Testing

### Jest + ts-jest

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

**Test files:** `__tests__/*.test.ts`
**Coverage:** Decision engine + statement advisor (70 tests)

### Config

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

---

## 8. Pending Integrations

### RevenueCat (PK-01)

**Status:** Simulated — needs real SDK integration

```typescript
// Current (simulated)
purchasePro(plan) → set tier in subscriptionStore

// Target
import Purchases from 'react-native-purchases';
Purchases.purchaseProduct(productId) → real IAP
```

### PostHog (parked)

Analytics deferred. Custom event tracking via `utils/analytics.ts` ready for future integration.

---

## 9. Build & Deploy

### EAS Build

```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

### EAS Update (OTA)

```bash
eas update --branch production --message "Bug fix"
```

### Environments

| Profile | Use |
|---------|-----|
| `development` | Local dev with Expo Go |
| `preview` | Internal testing (APK/IPA) |
| `production` | Store release |

---

## 10. Phase 2 Considerations

### SMS Listener (P2-01)

Requires local Expo module in `modules/sms-reader/`:
- Kotlin `NotificationListenerService`
- Config plugin for `AndroidManifest.xml`
- Android-only (no iOS equivalent)

### AI Layer (P2-03)

- Gemini 2.0 Flash API for NL queries
- Deterministic engine remains source of truth
- AI augments, never overrides

---

## Commands

```bash
# Development
npm start             # Expo dev server
npm run ios           # iOS simulator
npm run android       # Android emulator

# Testing
npm test              # Run Jest tests

# Building
eas build             # Cloud build
eas update            # OTA update

# Database
npx drizzle-kit generate  # Generate migrations
npx drizzle-kit push      # Apply migrations
```
