# Falcly — Technical Stack

> **Date:** 2026-03-31 (updated — Firebase replaces SQLite + Supabase + Sentry)
> **For:** Falcly engineering reference — Android-first, iOS parity at launch
> **Framework:** Expo CNG (Continuous Native Generation) — React Native 0.80+, New Architecture

---

## Executive Summary

Falcly's stack: **Expo CNG (React Native 0.80+, New Architecture on)** with **Expo Router** for file-based routing, **Firebase (Firestore + offline persistence)** for local-first storage with optional cloud sync path, **Zustand** for UI state, **RevenueCat** for subscriptions, **Notifee** for local notifications, **FlashList** for high-performance lists, **PostHog Cloud** for analytics, and **Firebase Crashlytics** for crash reporting. CI/CD via **EAS Build + EAS Update** — cloud builds, OTA JS updates, no Mac or Fastlane. Phase 2 adds a custom Kotlin `NotificationListenerService` as a **local Expo module** in `modules/sms-reader/`. Phase 3 adds **Gemini Nano** (Android) and **Gemini 2.0 Flash** cloud fallback.

**Key decision:** Firebase (`@react-native-firebase`) replaces the entire `expo-sqlite + Drizzle + Supabase + Sentry` stack. Firestore's offline persistence is LevelDB-backed (true native cache, not a JS shim) — works offline by default, syncs when online. No manual migration path, no schema files, no Drizzle. Sentry replaced by Firebase Crashlytics (same ecosystem, better Android symbolication).

---

## 1. Framework

### Why CNG (Not Bare Workflow)

Falcly uses **Expo CNG** (`npx create-expo-app falcly --template tabs`). CNG means the `ios/` and `android/` directories are **never committed** — they're generated on-demand by `npx expo prebuild` during EAS Build. The source of truth is `app.json` + config plugins. Custom native code lives in `modules/` as local Expo modules, auto-linked without touching generated native folders.

| Factor | CNG | Expo Bare Workflow |
|--------|-----|--------------------|
| Committed ios/ android/ folders | ❌ None — generated on build | ✅ Committed, manually maintained |
| Native upgrade path | ✅ `npx expo upgrade` — Expo regenerates native | ⚠️ Manual Gradle/Xcode migration per RN release |
| Custom native modules (Phase 2) | ✅ Local Expo module in `modules/` | ✅ Direct edits to `android/` |
| AndroidManifest.xml changes | ✅ Config plugin in `app.json` | ⚠️ Manual edits to committed file |
| Xcode required | ❌ Never touch Xcode | ⚠️ For iOS troubleshooting |
| Android Studio required | ❌ Never touch Android Studio | ⚠️ For Android troubleshooting |
| EAS Build (no Mac for iOS) | ✅ | ✅ |
| EAS Update (OTA) | ✅ | ✅ |
| Expo SDK modules | ✅ | ✅ |
| Setup complexity | ✅ Lowest — all native via config | ⚠️ Medium — some manual native work |

**Decision:** CNG keeps the native layer fully managed. Phase 2's `NotificationListenerService` is handled as a local Expo module in `modules/sms-reader/` — Kotlin code there, config plugin handles `AndroidManifest.xml`, EAS Build compiles it. No Xcode, no Android Studio, no committed native folders to maintain across RN upgrades.

### React Native Version

**Recommended: React Native 0.80+** (latest stable as of early 2026)

- New Architecture (Fabric renderer + TurboModules) is **on by default since 0.76** (Oct 2024)
- 0.80+ introduces stable JSI-based async storage, improved Hermes performance, and React 19 support
- Do **not** downgrade to 0.74/0.75 for "stability" — community library support is now ahead of old arch

**Hermes:** Leave enabled. It's the default JS engine, ships with RN, and gives faster startup + lower memory vs JavaScriptCore.

### New Architecture (Fabric + TurboModules) — Safe to Use?

**Yes, for 2026 projects.** Key libraries used by Falcly all have New Architecture support:
- `expo-sqlite` ✅ Full New Arch support (Expo SDK managed)
- `@notifee/react-native` ✅ New Arch compatible (v9+)
- `react-native-purchases` (RevenueCat) ✅
- `react-native-reanimated` ✅ (v3+)
- `@shopify/flash-list` ✅ New Arch compatible

**Pitfall:** If you pull in a legacy bridge module, the app falls back to interop mode (slower). Audit every native dep with `react-native-new-architecture` compatibility checker. Keep a list.

### Bundler

**Metro** via Expo — keep the default. Expo Router uses Metro with its own Babel preset. Do not switch to Re.Pack (webpack-based) unless you have a monorepo with shared web/mobile code, which Falcly doesn't.

---

## 2. Navigation

**Recommended: Expo Router v4 (file-based)**

Expo Router is the native routing solution for Expo CNG projects. It uses a Next.js-style file-based convention where the folder structure in `app/` defines routes. Deep linking, typed routes, and tab navigation all work out of the box.

```
app/
├── _layout.tsx              — Root layout (auth gate, biometric lock)
├── (auth)/
│   ├── onboarding.tsx
│   └── biometric-gate.tsx
├── (tabs)/
│   ├── _layout.tsx          — Bottom tab navigator config
│   ├── index.tsx            — Dashboard (Card overview, Safe-to-Swipe)
│   ├── cards.tsx            — Card list + add/edit
│   ├── calendar.tsx         — Billing Gantt
│   └── settings.tsx         — Settings / Pro
└── modals/
    ├── swipe-impact.tsx     — Full-screen modal sheet
    ├── add-card.tsx
    ├── add-installment.tsx
    └── payoff-planner.tsx
```

**Why Expo Router over React Navigation:**
- Ships with Expo CNG — no extra setup
- File-based routing is predictable and scales naturally as screens grow
- Typed routes: `router.push('/modals/swipe-impact')` is type-checked
- Deep linking is automatic — no separate `linking` config needed
- `presentation: 'modal'` still available via `<Stack.Screen options={{ presentation: 'modal' }} />`

**Why not React Navigation v7:**
- React Navigation is a valid choice for bare RN; for CNG + Expo Router, adding React Navigation adds unnecessary complexity with no benefit
- Expo Router wraps React Navigation under the hood — you get the same primitives

### Deep Linking

Expo Router handles deep linking automatically based on file structure:
- `falcly://` → `app/(tabs)/index.tsx` (Dashboard)
- `falcly://cards/[id]` → direct card view (Phase 2 notification taps)
- `falcly://modals/swipe-impact` → open swipe impact checker (widget tap in Phase 3)
- Universal links for web fallback (Phase 3) via `expo-linking`

---

## 3. Local Data — Firebase Firestore

**Decision: `@react-native-firebase/firestore` with offline persistence enabled**

No SQLite. No Drizzle. No schema migration files. Firestore handles local storage, offline reads/writes, and optional cloud sync in one library.

### Why Firebase over SQLite + Supabase

| Factor | expo-sqlite + Supabase | Firebase Firestore |
|--------|----------------------|-------------------|
| Offline support | Manual (SQLite local + sync logic) | ✅ Built-in LevelDB cache, automatic |
| Sync logic | Write yourself | ✅ Automatic when online |
| Schema migrations | Drizzle-kit codegen + migrate() | ❌ Schema-free (document model) |
| Cloud sync for Pro | Supabase RLS + custom E2E crypto | ✅ Firestore security rules |
| Crash reporting | Sentry (separate service) | ✅ Firebase Crashlytics (same SDK) |
| Setup complexity | High (3 libs + migration pipeline) | Low (1 config plugin) |

**Falcly's use case:** no device-to-device sync needed (single-user, one device). Firestore's offline cache is the database. Cloud Firestore is the optional backup — not the primary store.

### SDK Choice: `@react-native-firebase` (NOT the JS SDK)

**Must use `@react-native-firebase`**, not `firebase` (JS SDK):
- `@react-native-firebase` wraps the native Android/iOS SDKs — true LevelDB-backed offline persistence
- Firebase JS SDK uses an IndexedDB shim in RN — weaker offline, not production-grade for mobile
- `@react-native-firebase` has an official Expo config plugin — works cleanly with CNG

```bash
npx expo install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/crashlytics
```

Config plugin in `app.json`:
```json
{
  "plugins": [
    "expo-router",
    "@react-native-firebase/app",
    "@react-native-firebase/crashlytics"
  ]
}
```

Place `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) in the project root. EAS Build picks them up automatically via the config plugin.

### Enabling Offline Persistence

```typescript
// lib/firebase.ts
import firestore from '@react-native-firebase/firestore';

firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});
```

With persistence enabled: all reads/writes work offline. Writes queue locally and sync when connectivity returns. No manual conflict resolution needed for Falcly's single-user model.

### Firestore Data Model

```
users/{userId}/
  profile                              — { liquidCash, monthlyIncome, payday,
                                           committedExpenses, payoffStrategy,
                                           fixedPayoffAmount, currency, updatedAt }
  cards/{cardId}                       — { bank, cardName, creditLimit, outstandingBalance,
                                           statementDay, dueDayOffset, interestRate,
                                           minPaymentPct, annualFee, annualFeeMonth,
                                           autoPayEnabled, autoPayAmount,
                                           createdAt, updatedAt }
  cards/{cardId}/installments/{id}     — { name, merchant, totalAmount, monthlyAmount,
                                           totalMonths, monthsPaid, startDate, createdAt }
  cards/{cardId}/subscriptions/{id}    — { name, amount, billingDay, frequency, createdAt }
  cards/{cardId}/snapshots/{id}        — { balance, snapshotAt }  ← local-only, never synced
```

**Privacy rule:** `snapshots` subcollection (actual balance figures) stays local-only. Firestore security rules block cloud writes to this path. All other data is user-owned, behind Auth UID rules.

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/cards/{cardId}/snapshots/{snapshotId} {
      allow read, write: if false;  // never leaves device
    }
  }
}
```

## 4. State Management

**Recommended: Zustand v5**

```
zustand    ^5.x
```

### Comparison

| Library | Bundle size | Boilerplate | Derived state | React Query compat | RN perf |
|---------|-------------|-------------|---------------|-------------------|---------|
| **Zustand** | ~3KB | Very low | Selectors/compute | ✅ | ⚡ Excellent |
| Jotai | ~4KB | Low | Derived atoms | ✅ | ⚡ Excellent |
| Redux Toolkit | ~20KB | High | RTK Query / reselect | ✅ | Good |

**Why Zustand for Falcly:**
- Card status (SAFE/CAUTION/RISKY) is derived state — Zustand selectors handle this cleanly
- Small bundle matters on Android mid-range PH devices
- No context hell, no reducers, just plain TypeScript
- Works well with SQLite (Zustand holds in-memory state; SQLite is the source of truth)

### Store Architecture

```typescript
// Primary stores
useCardStore       — card list, SAFE/CAUTION/RISKY per card, best card pick
useProfileStore    — user cash, income, payoff strategy
useSyncStore       — cloud sync status, last sync, conflict state

// Derived selectors (computed, not stored)
selectSwipeImpact(cardId, proposedAmount) → SwipeImpactResult
selectBestCard(amount?) → Card | null
selectProjectedTimeline(cardId) → CycleEntry[]
```

**Pattern:** SQLite is the source of truth. On app start, load from SQLite into Zustand. All writes go to SQLite first, then update Zustand. Never write to Zustand without writing to SQLite.

---

## 5. Cloud Sync

**Handled by Firestore** — no separate Supabase instance needed.

With `@react-native-firebase/firestore` and Firebase Auth:
- Free tier: data lives in Firestore offline cache only (no cloud write needed until Pro)
- Pro tier: Auth UID is set, Firestore security rules open, data syncs automatically
- No custom sync logic, no E2E encryption pipeline to build, no `react-native-quick-crypto`

**What syncs (Pro only, when Auth is enabled):**

| Data | Syncs? | Rationale |
|------|--------|-----------|
| Card config (limits, dates, rates) | ✅ Yes | Non-sensitive setup data |
| User profile (income, payday, strategy) | ✅ Yes | Setup data |
| Installments + subscriptions | ✅ Yes | User work product |
| Balance snapshots | ❌ No | Privacy — security rules block cloud writes |
| Notification parse results (Phase 2) | ❌ No | On-device only |

**Firebase free tier limits (Spark plan):**
- 1 GiB stored data
- 50K reads/day, 20K writes/day, 20K deletes/day
- More than sufficient for Falcly's data volume (cards are tiny documents)

**Upgrade path:** Blaze (pay-as-you-go) when needed — cost is negligible at Falcly's scale.

## 6. In-App Purchases

**Recommended: RevenueCat (`react-native-purchases` v8+)**

```
react-native-purchases    ^8.x
```

RevenueCat has an **Expo config plugin** — native setup is handled automatically in CNG. No manual `android/` or `ios/` edits required.

### RevenueCat vs Native StoreKit/BillingClient

| Factor | RevenueCat | Native StoreKit/BillingClient |
|--------|-----------|-------------------------------|
| Cross-platform | ✅ One SDK | ❌ Two separate implementations |
| Play Billing v5+ compliance | ✅ Handled automatically | ⚠️ Manual, complex |
| Receipt validation | ✅ Server-side, included | ❌ Must build server |
| Free trial mechanics | ✅ Dashboard config | ⚠️ Manual |
| Subscription analytics | ✅ Built-in dashboard | ❌ None |
| Cost | 1% rev share after $2.5K MTR | Free |
| Webhook support | ✅ | ❌ |
| Expo config plugin (CNG compatible) | ✅ | N/A |

**Use RevenueCat.** The 1% rev share is negligible at Falcly's scale. The alternative is maintaining two IAP integrations and a receipt validation server.

### Free Trial Mechanics (14-Day Trial)

Configure in RevenueCat dashboard → Offerings. Set `introductory_price_mode: freeTrial, introductoryPricePeriod: P14D`. RevenueCat handles Apple/Google differences in trial surfacing automatically.

### PH Pricing: ₱149/mo

Apple App Store PH pricing tiers (2025): The closest tier to ₱149 is **Tier 3 (₱149)**. Apple updated PH tiers in 2023 to align with local purchasing power. ₱149/mo is a valid App Store price point.

Google Play: Set price manually in ₱ per market. ₱149 maps to approximately ~$2.65 USD and is within Play's minimum pricing floor for PH.

### Google Play Billing v5+ Requirement

Google mandates Play Billing Library v5+ for all apps updated after **June 2024**. RevenueCat v7+ uses Billing Library v6 internally — stay on RevenueCat v8+ to ensure compliance. Never ship with Billing Library v4 or lower.

---

## 7. Notifications

**Recommended: `@notifee/react-native` v9+**

```
@notifee/react-native    ^9.x
```

Notifee has an **Expo config plugin** — works in CNG without touching native files.

### Notifee vs Alternatives

| Library | Local notifications | Android channels | iOS critical alerts | New Arch | Expo config plugin |
|---------|--------------------|-----------------|--------------------|----------|--------------------|
| **Notifee** | ✅ | ✅ Full control | ✅ (entitlement) | ✅ v7+ | ✅ CNG compatible |
| expo-notifications | ✅ | ⚠️ Limited | ❌ | ✅ | ✅ Built-in SDK |
| react-native-push-notification | ✅ | ⚠️ Limited | ❌ | ⚠️ Interop | ❌ |

**Notifee is the clear winner for Falcly.** It handles Android notification channels (required for Android 8+), supports all the notification types Falcly needs, is actively maintained, and has an **Expo config plugin** that handles all native registration in CNG — no `android/` edits needed.

### Notification Types for Falcly

| Trigger | Channel | Android Priority | iOS Relevance |
|---------|---------|-----------------|---------------|
| Statement day approaching (7 days) | `billing` | Default | Active |
| Statement day imminent (2 days) | `billing-urgent` | High | Time-sensitive |
| Due date reminder (3 days out) | `payment` | High | Time-sensitive |
| Due date imminent (1 day) | `payment-urgent` | Max | Critical alert (opt-in) |
| Data staleness warning (5 days stale) | `maintenance` | Low | Passive |
| Payoff milestone | `achievements` | Default | Active |

### Android 13+ Notification Permission

Android 13+ requires explicit `POST_NOTIFICATIONS` permission request. Handle with:
```typescript
import notifee, { AuthorizationStatus } from '@notifee/react-native'

const settings = await notifee.requestPermission()
if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
  // Show in-app nudge to enable in Settings
}
```

### iOS Critical Alerts

For "due date in 1 day" notifications, iOS Critical Alerts bypass Do Not Disturb. Requires Apple entitlement (`com.apple.developer.usernotifications.critical-alerts`) — declare in `app.json` under `ios.entitlements`; Expo CNG applies it during prebuild. Gate this feature behind an explicit user opt-in screen explaining why. Not needed for MVP.

---

## 8. Android Notification Listener (Phase 2)

**No existing RN library covers this. Requires a custom local Expo module.**

In CNG, custom native code lives in `modules/<name>/` as a local Expo module. The module is auto-linked by Expo — no manual `android/settings.gradle` edits (those files aren't committed). A companion config plugin in `app.json` handles `AndroidManifest.xml` registration automatically.

### Project Structure

```
modules/
└── sms-reader/
    ├── index.ts                          — JS/TS API surface (exported to app)
    ├── src/
    │   └── SmsReaderModule.kt            — Kotlin: NotificationListenerService + TurboModule
    └── expo-module.config.json           — tells Expo to auto-link this module
```

### Architecture

```
Android OS
  └── NotificationListenerService (Kotlin — modules/sms-reader/src/)
       ├── Receives all posted notifications
       ├── Filters by known PH bank package names
       ├── Passes notification text to RN via TurboModule event emitter
       └── RN layer runs TypeScript regex parser
```

### Kotlin Implementation Outline

```kotlin
// modules/sms-reader/src/SmsReaderModule.kt

class BankNotificationListenerService : NotificationListenerService() {
  
  private val bankPackages = setOf(
    "com.bdo.mobile",          // BDO Digital Banking
    "com.bpi.banking",         // BPI Mobile
    "com.unionbank.ebanking",  // UnionBank
    "com.metrobankdirect",     // Metrobank
    "com.gcash.gcash",         // GCash
    "ph.com.maya.app"          // Maya
  )

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (sbn.packageName !in bankPackages) return
    
    val extras = sbn.notification.extras
    val title = extras.getString("android.title") ?: ""
    val text = extras.getCharSequence("android.text")?.toString() ?: ""
    
    // Emit to React Native via Expo Module event emitter
    sendEvent("onBankNotification", mapOf(
      "packageName" to sbn.packageName,
      "title" to title,
      "text" to text,
      "postedAt" to sbn.postTime
    ))
  }
}
```

### Config Plugin (AndroidManifest.xml automation)

```typescript
// modules/sms-reader/plugin/withSmsReader.ts
import { ConfigPlugin, withAndroidManifest } from '@expo/config-plugins'

const withSmsReader: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults
    // Add <service android:name=".BankNotificationListenerService"
    //   android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">
    //   <intent-filter>
    //     <action android:name="android.service.notification.NotificationListenerService" />
    //   </intent-filter>
    // </service>
    addNotificationListenerService(manifest)
    return config
  })
}
export default withSmsReader
```

Register in `app.json`:
```json
{
  "plugins": ["./modules/sms-reader/plugin/withSmsReader"]
}
```

**User must grant Notification Access in Android Settings** (no Play Store special permission needed).

### Android 15 Sensitive Data Detection Risk

Google's Android 15 introduced on-device sensitive data screening for notifications. Financial transaction notifications (containing amounts in PHP, ₱ symbol, card numbers) may be classified as sensitive and **not passed** to `NotificationListenerService` on some OEM implementations.

**Mitigation strategy:**
1. Test on Samsung (One UI 7), Xiaomi (HyperOS), and stock Android (Pixel) — OEM behavior varies
2. Build SMS fallback via ML Kit SMS Retriever (limited but available)
3. Screenshot OCR path as final fallback
4. Document this limitation clearly in Phase 2 release notes

### Testing PH Bank Notifications

Build a test harness: a companion test app that fires mock notifications with real PH bank formats, then validates the regex parser output. Include fixtures for:
- BDO purchase notification
- BPI charge alert
- GCash send/receive
- Maya QR payment
- Metrobank transaction alert

---

## 9. Lists

**Recommended: `@shopify/flash-list`**

```
@shopify/flash-list    ^1.x
```

FlashList is a drop-in FlatList replacement with recycled cell rendering — measurably faster on mid-range Android devices (Samsung Galaxy A series, Realme, Xiaomi). Falcly's card list and Gantt timeline both benefit.

- New Architecture compatible
- Works in Expo CNG (no native config required beyond install)
- `estimatedItemSize` prop eliminates layout jank on first render
- Replace every `FlatList` with `FlashList` — same API surface

---

## 10. AI / ML (Phase 2–3)

### On-Device: Gemini Nano via ML Kit GenAI APIs

- Available on: Pixel 9+, Samsung Galaxy S25 series (via Android AICore)
- Integration: `com.google.android.gms:play-services-mlkit-genai` — Google Play Services, no model download by the app
- Access pattern: `GenerativeModel` from ML Kit GenAI APIs (GA: May 2025)
- Free, on-device, no API key needed
- **CNG:** Wrap in a local Expo module under `modules/gemini-nano/` — Kotlin code calls the GenAI API, TurboModule exposes it to JS. Config plugin registers any required permissions.

### On-Device: Regex Parser for PH Bank SMS/Notifications

No ML needed. TypeScript regex patterns per bank, unit-tested against real samples. This is Phase 2's first deliverable — faster, more reliable, and zero privacy risk vs any ML approach.

### ML Kit Text Recognition v2 (OCR)

For Phase 2 fallback (screenshot OCR):
```
// Android: Google ML Kit Text Recognition v2
// Wrap in local Expo module: modules/ocr-reader/
// Kotlin: TextRecognizer from ml-kit-text-recognition:16.0.1
// Expo module exposes recognizeFromUri(uri: string): Promise<string>
```

For iOS: Apple Vision Framework via the same local Expo module, Swift side. Both are on-device, free.

### Cloud LLM Fallback Comparison

| Model | Input ($/1M tok) | Output ($/1M tok) | Latency | Best for Falcly |
|-------|-----------------|------------------|---------|----------------|
| **Gemini 2.0 Flash** | ~$0.075 | ~$0.30 | Fast (~500ms) | Structured extraction, cheap |
| **Gemini 2.5 Flash** | ~$0.15 | ~$0.60 | Fast | Better reasoning, still cheap |
| **Claude Haiku 3.5** | $0.80 | $4.00 | Fast (~400ms) | Best instruction following |
| **GPT-4o-mini** | $0.15 | $0.60 | Medium (~600ms) | Good context, widely used |
| **Gemma 3 Flash** (projected 2026) | ~$0.03 | ~$0.12 | Fast | Emerging cheapest option |

**Recommendation:**
- **Phase 2 extraction (SMS/notification parsing when regex fails):** Gemini 2.0 Flash — cheapest, fast enough, good at structured JSON extraction from messy financial text
- **Phase 3 conversational NL queries:** Gemini 2.5 Flash (better reasoning) with on-device Gemini Nano first
- Implement a provider abstraction layer so you can swap LLM without refactoring

**Cost reality check:** At 1,000 Pro users, each making ~3 AI-assisted extractions/month with a 500-token average prompt → ~1.5M tokens/month → **~$0.11/month total** at Gemini 2.0 Flash pricing. Negligible.

**Privacy:** For cloud LLM calls, send only anonymized context — no card numbers, no full balances. Send relative values and cycle position only.

---

## 11. Analytics & Crash Reporting

### Crash Reporting: Firebase Crashlytics

**Replaces Sentry.** Already in the Firebase ecosystem — zero additional setup once `@react-native-firebase/crashlytics` is installed.

```bash
npx expo install @react-native-firebase/crashlytics
```

- Add `@react-native-firebase/crashlytics` to `plugins` in `app.json`
- Source maps uploaded via EAS Build hooks
- Real-time crash alerts in Firebase Console
- Android NDK crash support (catches native crashes, not just JS)
- `beforeSend` equivalent: use `crashlytics().setAttribute()` for context, never log PII

### Analytics: PostHog

**Keep PostHog** — better privacy posture than Firebase Analytics, EU data region, self-hostable if needed for RA 10173 compliance.

```
posthog-react-native    ^3.x
```

Use PostHog EU Cloud region. Free tier: 1M events/month.

**Events to track (same as before — no actual financial figures):**
```typescript
posthog.capture('card_added', { card_bank: 'BDO' })
posthog.capture('swipe_check_performed', { status: 'SAFE', amount_tier: '<1000' })
posthog.capture('pro_conversion_started', { source: 'card_limit_wall' })
posthog.capture('pro_trial_started', {})
posthog.capture('pro_converted', { plan: 'annual' })
```

**Never track:** card numbers, balances, actual peso amounts.

## 12. CI/CD & Distribution

### Pipeline: EAS Build + EAS Update + GitHub Actions

```
EAS Build    — Cloud builds for Android (AAB) and iOS (IPA). No Mac needed.
EAS Update   — OTA JS bundle updates. Skips app store review for JS-only changes.
GH Actions   — PR checks only: TypeScript, lint, Jest tests.
```

No Fastlane. No Xcode runners. No Ruby setup.

### EAS Build

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "autoIncrement": true
    }
  }
}
```

- **Android:** EAS builds the AAB and submits to Play internal track via `eas submit`
- **iOS:** EAS builds the IPA using Apple Silicon build servers, submits to TestFlight via `eas submit`
- **No Mac required** — EAS Build handles iOS compilation in the cloud

### EAS Update (OTA)

```bash
# Push a JS-only fix without going through app store review
eas update --branch production --message "Fix swipe impact calculation"
```

- Works for any change that doesn't touch native code (JS, assets, config that doesn't require prebuild)
- Instant delivery to users on the production build
- **When OTA is NOT enough:** Any change to `app.json` that triggers `npx expo prebuild` (new permissions, new native dependencies) requires a new EAS Build and app store release

### Code Signing

**Android:**
- Generate Keystore once, store in EAS Secrets (`ANDROID_KEYSTORE_BASE64`, `KEY_ALIAS`, `KEY_PASSWORD`)
- Use Google Play App Signing (recommended) — upload key to Play, Google manages distribution cert

**iOS:**
- EAS manages certificates and profiles automatically via `eas credentials`
- App Store Connect API key stored in EAS Secrets — no 2FA issues

### GitHub Actions (Linting + Tests Only)

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint .
      - run: npx jest --passWithNoTests
```

GitHub Actions never builds native code. EAS handles that.

---

## 13. Known Pitfalls

### CNG / Expo Gotchas (2025–2026)

1. **`npx expo prebuild` is destructive:** If you ever run prebuild locally, `ios/` and `android/` are regenerated. Never commit those folders — add them to `.gitignore`. EAS Build runs prebuild in the cloud before compiling.

2. **Config plugin order matters:** Plugins in `app.json` run in order. If plugin A modifies `AndroidManifest.xml` and plugin B also does, the second one wins. Test manifest output with `npx expo prebuild --no-install --dry-run`.

3. **New Architecture interop mode is silent:** If any library falls back to bridge mode, you won't know unless you enable strict interop validation. Add `"newArchEnabled": true` in `app.json` (already default in SDK 51+) and watch for warnings.

4. **Local Expo modules need `expo-module.config.json`:** Forgetting this file means the module won't auto-link. Check that `modules/sms-reader/expo-module.config.json` exists and references the Kotlin class correctly.

5. **EAS Update vs new native build:** JS changes → `eas update`. Any new native dep or config plugin change → `eas build`. Confusing these is a common mistake — if users don't see the update, they likely need a new binary, not an OTA push.

6. **Metro source maps for Sentry:** Configure `metro.config.js` and use `@sentry/react-native/metro` plugin. Don't skip this — symbolicated crash reports are essential. Upload source maps via the `sentry-expo` config plugin or EAS Build hook.

7. **Hermes + async/await:** Hermes supports modern JS, but some older polyfills conflict. Audit deps for `regenerator-runtime` — not needed with Hermes but sometimes pulled in transitively.

### Keychain / Keystore for Encryption Key

```typescript
import * as SecureStore from 'expo-secure-store'  // Expo SDK, no extra native setup

// Store DB encryption key
await SecureStore.setItemAsync('falcly_db_key', encryptionKey, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
})

// Retrieve on app start
const key = await SecureStore.getItemAsync('falcly_db_key')
```

**Android:** `expo-secure-store` uses Android Keystore (TEE) under the hood. On devices without TEE, falls back to software keystore — still acceptable.

**iOS:** Stored in iOS Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` — not backed up to iCloud.

### New Architecture Risks

- **Custom native modules (local Expo modules):** The `NotificationListenerService` bridge must use Expo Modules API (not the legacy `ReactContextBaseJavaModule`). Expo Modules API auto-generates the TurboModule glue — don't bypass it.
- **Libraries that haven't migrated:** Check `react-native-new-architecture` community tracker. Replace unmigrated libraries before launch, not after.
- **Bridged modules in strict mode:** If interop mode is required for any lib, isolate it early and plan a replacement.

### Performance Considerations for SQLite + Reactive Calculations

1. **SAFE/CAUTION/RISKY calculation is pure JS math** — runs in under 1ms even on mid-range Android. No optimization needed here.

2. **SQLite reads for small datasets are fine** (Falcly has at most ~20 cards, ~100 installments, ~50 subscriptions). Don't over-engineer async queries.

3. **FlashList + `estimatedItemSize`:** Set this correctly for the card list height to avoid the layout recalculation warning on first render.

4. **Balance snapshot table will grow:** Add a cleanup on app start: delete snapshots older than 90 days. Keep the pattern detection window at 60 days.

5. **Avoid re-running full calculations on every render.** Memoize `selectSwipeImpact` with `useMemo` keyed on card + cash + timestamp. This is where most accidental perf issues will come from.

---

## Library Versions Cheatsheet

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | `~54.0.x` | Expo SDK (CNG) |
| `react-native` | `0.81.x` | Core framework (managed by Expo) |
| `expo-router` | `~6.0.x` | File-based navigation |
| `@react-native-firebase/app` | `^22.x` | Firebase core (config plugin) |
| `@react-native-firebase/firestore` | `^22.x` | Local-first storage + optional sync |
| `@react-native-firebase/crashlytics` | `^22.x` | Crash reporting (replaces Sentry) |
| `@react-native-firebase/auth` | `^22.x` | Auth for Pro cloud sync (Phase 2) |
| `zustand` | `^5.x` | UI state management |
| `@shopify/flash-list` | `^1.x` | High-performance list rendering |
| `react-native-purchases` | `^8.x` | RevenueCat IAP (config plugin) |
| `@notifee/react-native` | `^9.x` | Local notifications (config plugin) |
| `posthog-react-native` | `^3.x` | Analytics (EU region) |
| `react-native-reanimated` | `~4.1.x` | Animations |
| `expo-local-authentication` | `^15.x` | Biometric lock (Expo SDK) |

**Removed from previous stack:**
- ~~`expo-sqlite`~~ → Firestore offline cache
- ~~`drizzle-orm` / `drizzle-kit`~~ → Firestore document model (no migrations)
- ~~`op-sqlite`~~ → not needed
- ~~`@supabase/supabase-js`~~ → Firestore handles sync
- ~~`react-native-url-polyfill`~~ → Supabase polyfill no longer needed
- ~~`react-native-quick-crypto`~~ → no manual E2E encryption pipeline
- ~~`expo-secure-store`~~ (for DB key) → not needed; keep if biometric auth requires it
- ~~`@sentry/react-native`~~ → Firebase Crashlytics

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| CNG over Expo bare workflow | No committed ios/android folders; native upgrades via `npx expo upgrade`; local Expo modules handle Phase 2 native code |
| Expo Router over React Navigation | Ships with CNG template; file-based routing; typed routes; deep linking automatic |
| Firebase (`@react-native-firebase`) over expo-sqlite + Supabase | One config plugin replaces 3-lib stack (SQLite + Drizzle + Supabase); true LevelDB offline persistence; Crashlytics included; less code |
| `@react-native-firebase` over Firebase JS SDK | Native SDK = true LevelDB persistence; JS SDK uses IndexedDB shim = weaker offline in RN |
| Firestore offline-first | Single-user, single-device — offline cache IS the database; cloud is optional backup |
| Snapshots never synced to cloud | Privacy: actual balance figures stay on-device only; enforced via Firestore security rules |
| Firebase Crashlytics over Sentry | Same ecosystem, zero extra setup, better Android NDK symbolication |
| PostHog over Firebase Analytics | Self-hostable, EU data region, RA 10173 friendly; Firebase Analytics has Google data concerns |
| Local Expo module in `modules/sms-reader/` | Clean CNG pattern for Phase 2 custom native; config plugin automates AndroidManifest.xml |
| New Architecture on from day 1 | All key libs support it; no legacy bridge tech debt |
| FlashList over FlatList | Measurably faster on mid-range Android; same API surface |
| Zustand over Redux | Low boilerplate, small bundle; SQLite is gone so Zustand holds derived state only |
| RevenueCat over native IAP | Play Billing v5+ compliant; cross-platform; receipt validation included; Expo config plugin |
| Notifee over expo-notifications | Best Android channel support; iOS critical alerts; Expo config plugin |
| EAS Build + EAS Update over Fastlane | No Mac required; OTA updates for JS changes; integrates natively with CNG |
| Gemini 2.0 Flash for cloud LLM (Phase 3) | Cheapest viable model for structured extraction |

---

*Sources: Expo CNG docs (docs.expo.dev), React Native Firebase docs (rnfirebase.io), Firebase Firestore offline docs, Expo Firebase guide (docs.expo.dev/guides/using-firebase), EAS Build docs, FlashList docs, Notifee docs, RevenueCat docs, PostHog docs.*
