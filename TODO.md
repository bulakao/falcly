# Falcly — TODO

> Last updated: 2026-04-05
> Status: 97/99 stories passing · Launch Ready

---

## 🚀 Pre-Launch (Blockers)

- [ ] Set up products in Google Play Console
  - `falcly_pro_monthly` — $4.99/month
  - `falcly_pro_yearly` — $39.99/year
  - `falcly_pro_lifetime` — one-time (price TBD)
- [ ] Link Play Console to RevenueCat dashboard
  - Create entitlement: `Falcly Pro`
  - Create offering: `default` (monthly + yearly + lifetime packages)
  - Attach products to entitlement
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
