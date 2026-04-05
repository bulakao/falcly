# Falcly — TODO

> Last updated: 2026-04-05
> Status: 97/99 stories passing · Launch Ready

---

## ❓ Open Questions

- [ ] **Trial reset on reinstall** — Users who uninstall/reinstall could reset their trial. RevenueCat tracks trial state server-side per Apple ID / Google account, but anonymous users (no sign-in) are vulnerable. Need to decide: require sign-in to start trial, or accept the risk at launch?

---

## 🚀 Pre-Launch (Blockers)

- [ ] **[IMPORTANT] Enroll in Apple Small Business Program** — cuts App Store commission from 30% → 15% (free, apply at developer.apple.com/app-store/small-business-program/)
- [ ] Set up products in Google Play Console with localized pricing
  - `falcly_pro_monthly`:
    - 🇵🇭 PH + global default: $4.99
    - 🇺🇸 US: $6.99 · 🇪🇺 EU: €5.99 · 🇨🇦 CA: CA$8.99 · 🇦🇺 AU: A$10.99
  - `falcly_pro_yearly`:
    - 🇵🇭 PH + global default: $47.99
    - 🇺🇸 US: $55.99 · 🇪🇺 EU: €47.99 · 🇨🇦 CA: CA$71.99 · 🇦🇺 AU: A$87.99
  - `falcly_pro_lifetime`:
    - 🇵🇭 PH + global default: $99.99
    - 🇺🇸 US: $99.99 · 🇪🇺 EU: €89.99 · 🇨🇦 CA: CA$129.99 · 🇦🇺 AU: A$149.99
  - Set each market manually; use store auto-convert for remaining markets
  - RevenueCat reads localized prices automatically — no app code changes needed
- [ ] Link Play Console to RevenueCat dashboard
  - Create entitlement: `Falcly Pro`
  - Create offering: `default` (monthly + yearly + lifetime packages)
  - Attach products to entitlement
- [ ] Create RevenueCat production API key + swap in `.env`
  1. RevenueCat dashboard → API Keys → + New → Google Play → name "Production"
  2. Copy key (starts with `goog_`)
  3. Upload Play Store service credentials JSON (Google Cloud → Service Accounts)
  4. Replace in `.env`: `REVENUECAT_API_KEY=goog_xxxxxxxxxxxx`
  5. Code already reads from `Constants.expoConfig.extra.revenuecatApiKey` — no code changes
- [ ] Run `npx expo prebuild --clean` to regenerate native code
- [ ] `eas build --platform android --profile development` — build dev client
- [ ] Test sandbox purchases on real device
- [ ] Create RevenueCat paywall template in dashboard
- [ ] Upload app to Play Console (internal testing track)
- [ ] App store listing copy + screenshots
- [ ] Google Play launch (PH)

---

## 📋 Phase 2 (Post-Launch)

- [ ] P2-01: SMS/notification listener (Android auto-detect transactions) — requires Kotlin native module
- [ ] PostHog analytics integration (parked)
- [ ] iOS App Store launch
- [ ] US market expansion

---

## 🅿️ Parked Indefinitely

- P2-03: NL queries / AI advisor — revisit when user demand signals readiness
- Pro+ tier — revisit when AI features ship
- Credit Score Optimized payoff strategy — overlays already handle utilization nudges

---

## ✅ Done

- [x] Core decision engine (SAFE/CAUTION/RISKY)
- [x] Swipe impact analysis
- [x] Multi-card management
- [x] Cash flow awareness (multi-payday)
- [x] Transaction logging
- [x] Cloud sync (Supabase)
- [x] Statement Advisor (SD-01–07)
- [x] Card Overlay System (SD-05–07)
- [x] Onboarding flow
- [x] RevenueCat IAP integration (PK-01)
- [x] Payoff Planner — Avalanche + Snowball (P2-02)
- [x] Drop Pro+ tier — Free/Pro only with monthly/yearly/lifetime
- [x] Accessibility audit
- [x] All docs updated


- from status page to login, it should be account creation. if they reach status page, it means they might be new.
- from status page to sign in, there is extra back button. it's weird that it says welcom back if i am new. 
- revisit pricing so we dont get hurt by store's cut ✅ revised: $4.99/mo · $47.99/yr · $79.99 lifetime