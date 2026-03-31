# Falcly — Monetization Strategy

> **Date:** 2026-03-30
> **For:** Falcly discovery

---

## Executive Summary

Falcly's monetization is built on a single thesis: **one avoided late fee pays for the annual subscription**. The model is freemium-to-subscription with a hard paywall at card 3. Free tier is generous enough to hook users; Pro is compelling enough that multi-card users can't live without it.

Revenue stack: **RevenueCat** (free until $2.5K MRR) handles IAP complexity across both platforms. Annual plan is the primary CTA. AI features run on **Gemini 2.0 Flash** at ~$0.04/user/month — effectively free at launch scale, only becoming meaningful cost above ~$50K MRR. Unit economics are strong: ~83% net margin per Pro user after store fees and AI costs.

Key targets: $19.8K ARR at PH Year 1 baseline; $140K ARR combined at end of Year 2.

---

## 1. Pricing Architecture

### Confirmed Pricing

| Plan | US | PH | Cards |
|------|----|----|-------|
| Free | $0 | ₱0 | 2 |
| Pro Monthly | $4.99/mo | ₱149/mo | Unlimited |
| Pro Annual | $39.99/yr ($3.33/mo) | ₱999/yr (₱83/mo) | Unlimited |

### Free vs. Pro Feature Gating

**Free — Keep generous to drive adoption:**
- Up to 2 credit cards
- Safe-to-Swipe indicator (SAFE / CAUTION / RISKY)
- Billing cycle Gantt chart (current cycle only)
- Utilization tracker
- Statement & due date reminders (2 cards)
- Manual card entry
- Basic best-card recommendation
- Export data (CSV)
- Core decision logic (full algorithm, not degraded)

**Pro — Gate features that benefit multi-card users:**
- Unlimited cards (the primary trigger — 3rd card hits paywall)
- Full billing cycle timeline (all cards, multi-month horizon)
- Payment planning strategies (avalanche, snowball, custom)
- Installment tracking and schedule
- Subscription tracking across cards
- Annual fee reminders
- Cash-aware payoff projections
- SMS/notification parsing (Phase 2 AI)
- Conversational queries — "Can I buy this today?" (Phase 2 AI)
- Priority push notification timing
- Dark mode (optional future add — social signal)

**Recommendation: Payment planning and installment tracking → Pro.**
Rationale: These features are high-value for users with multiple cards and installment debt — exactly who needs Pro. Free users with 2 cards see teaser UI ("Set up payment plan") that surfaces on upgrade prompts without being usable. This creates *aspiration friction* — users want it before they have it.

**What NOT to gate:** Safe-to-swipe logic, utilization, reminders for 2 cards. The core promise must work on Free. Crippling core features kills word of mouth.

---

## 2. In-App Purchase Implementation

### Recommendation: RevenueCat ✅

**RevenueCat vs. Native (StoreKit 2 + Google Play Billing v5):**

| Criterion | RevenueCat | Native |
|-----------|-----------|--------|
| Setup time | ~1 day | 2–3 weeks |
| Cross-platform entitlements | ✅ Built-in | Manual sync required |
| Receipt validation | ✅ Server-side auto | Must build yourself |
| Analytics dashboard | ✅ Included | None — build yourself |
| A/B test paywalls | ✅ RevenueCat Experiments | None |
| Cost at <$2.5K MRR | **Free** | Dev time only |
| Cost at >$2.5K MRR | 1% of revenue | ~$0 + server costs |
| Bare React Native support | ✅ `react-native-purchases` | Separate native modules |

**RevenueCat pricing (2025/2026):** Free tier includes unlimited apps up to $2.5K Monthly Tracked Revenue (MTR). Above that: 1% of revenue. At $11.7K MRR (Year 2 target), RevenueCat costs ~$117/month — worth every dollar versus maintaining native billing infrastructure.

**Implementation:** `react-native-purchases` package. Bare React Native (no Expo) works natively. Configure products in App Store Connect and Google Play Console, set up entitlements in RevenueCat dashboard, check entitlement in app on launch.

```js
// Core check pattern
const customerInfo = await Purchases.getCustomerInfo();
const isPro = customerInfo.entitlements.active['pro'] !== undefined;
```

---

## 3. Free Trial Strategy

### Recommendation: 14-Day Free Trial, No Upfront Payment Required

**Platform implementation:**
- **iOS (StoreKit 2 via RevenueCat):** Set introductory offer in App Store Connect — "14-day free trial" on Pro Monthly. RevenueCat surfaces this automatically via `StoreProduct.introductoryDiscount`.
- **Android (Play Billing v5 via RevenueCat):** Set free trial in Play Console subscription editor. Same entitlement check in app — RevenueCat handles it.

**Payment method upfront vs. not:**
- **With payment method (standard subscription trial):** Higher conversion, 15–25% trial-to-paid. Users forget to cancel = good for revenue, potentially bad for trust.
- **Without payment method:** Lower conversion (8–12%), but lower refund requests.
- **Recommendation:** Go with standard subscription trial (payment method required). Finance app users are accustomed to this pattern. Clearly label "No charge for 14 days — cancel anytime."

**Trial-to-paid benchmarks (finance apps):**
- Industry average: 10–20% trial-to-paid
- Finance category (higher intent): 15–25%
- With hard paywall at card 3: expect 20–30% (users who hit paywall are already invested)

**Trial expiry — graceful degradation (CRITICAL):**
- On trial expiry: do NOT brick the app or hide existing data
- Cards 3+ become read-only (show data, disable editing, disable reminders)
- Show soft upgrade banner on locked cards: "Reactivate Pro to manage all cards"
- User can still use 2 cards fully on Free tier
- Keep data for 90 days post-expiry, then warn before deletion

---

## 4. PH App Store Pricing Tiers

### App Store Connect (iOS) — Philippines

Apple's 2023 global pricing update added granular PHP tiers. Current available tiers for Philippines:

| Amount | Tier | Notes |
|--------|------|-------|
| ₱99/mo | Tier 2 | Slightly below target |
| **₱149/mo** | **Tier 3** | ✅ Exact match for Falcly Pro |
| ₱199/mo | Tier 4 | Available if price increases |
| ₱999/yr | Tier 15 | ✅ Exact match for Falcly annual |

**Current currency conversion:** $4.99 USD ≈ ₱284 at market rate (₱57/$1). App Store tier ₱149 = ~$2.62 USD. This is intentional — PH pricing is a separate market with different willingness-to-pay, not a USD conversion.

### Google Play — Philippines

Google Play also supports direct PHP pricing:
- ₱149/mo → directly supported via Play Console subscription pricing (no tier constraints, enter exact amount)
- ₱999/yr → directly supported

Google Play's pricing tool accepts local currency amounts directly — no tier matching needed. Enter ₱149.00 exactly.

**Apple developer note:** In App Store Connect, set Philippines as a separate pricing region. Use "Manage Prices" to override the auto-converted price with the exact PHP tier.

---

## 5. Annual vs. Monthly Conversion

### Why Annual is the Primary CTA

| Plan | Monthly cost | Yearly cost | Savings |
|------|-------------|-------------|---------|
| Monthly | $4.99 | $59.88 | — |
| Annual | $3.33/mo | $39.99 | 33% ($19.89) |
| PH Monthly | ₱149 | ₱1,788 | — |
| PH Annual | ₱83/mo | ₱999 | 44% (₱789) |

**Annual churn is dramatically lower:** Monthly plans churn at 15–40% on first renewal; annual subscribers churn at ~5% on renewal (RevenueCat SOSA 2025). Annual subscribers also have 3–4x higher LTV.

**Paywall CTA strategy:**
1. **Lead with annual** — show annual price monthly-equivalent as headline ("₱83/month, billed yearly")
2. Monthly plan shown below, smaller
3. Savings badge: "Save 44%" or "2 months free"
4. Default selection: annual plan pre-selected

**Annual conversion benchmark:** 41.43% of all app subscriptions are annual (RevenueCat SOSA 2025). Target 35–45% annual mix for Falcly.

**Post-trial upsell:** After trial ends, offer annual at a discount for 24 hours — "Lock in 12 months at ₱999 before your trial ends." Creates urgency without being aggressive.

---

## 6. Paywall Design

### Paywall Placement — Where to Show It

| Trigger | Context | Type | Priority |
|---------|---------|------|----------|
| Add 3rd card | User clearly multi-card | Hard | #1 Primary |
| After 14-day trial | Time-based | Hard | #2 Always |
| Open payoff planner on Free | Feature-gated | Soft | #3 Discovery |
| 7-day engagement (daily user) | Behavioral | Soft | #4 Upsell |
| After onboarding (optional) | High intent moment | Soft | #5 Early try |

**Hard vs. soft paywalls:**
- **Hard paywall** (card 3, post-trial): Block the action, require upgrade to continue. Median 14-day revenue is 8x higher for hard paywalls vs. soft (RevenueCat SOSA 2025).
- **Soft paywall** (feature discovery): Show what they'd get, let them tap "Start Free Trial" or dismiss.

**What to show on the paywall:**

```
┌─────────────────────────────────┐
│  🃏 You've got 3+ cards          │
│  Upgrade to manage them all     │
│                                 │
│  ✅ Unlimited cards              │
│  ✅ Payment planning             │
│  ✅ Installment tracking         │
│  ✅ AI payment alerts            │
│                                 │
│  [Try Free for 14 Days] ← CTA1  │
│                                 │
│  ₱83/mo   ●──────────────────   │
│  billed as ₱999/year   SAVE 44% │
│                                 │
│  or ₱149/month                  │
│                                 │
│  Less than one late fee.        │
│  Cancel anytime.                │
└─────────────────────────────────┘
```

**PH-specific framing:**
- "Less than one late payment fee (₱500–₱1,500)"
- "₱149/month — about the price of one takeout meal"
- "Pays for itself with one avoided late fee per year"

**Trust signals:** "No hidden fees" + App Store badge showing "X ratings" once reviews are in. Add 1–2 testimonials after first 100 reviews.

---

## 7. AI Model Cost Analysis

### Model Pricing Comparison (March 2026)

| Model | Provider | Input/1M | Output/1M | Notes |
|-------|----------|----------|-----------|-------|
| **Gemini 2.0 Flash** | Google | $0.10 | $0.40 | ✅ Best value, proven |
| Gemini 2.5 Flash-Lite | Google | $0.10 | $0.40 | Similar to 2.0 Flash |
| Claude Haiku 4.5 | Anthropic | $1.00 | $5.00 | 10x pricier, better reasoning |
| GPT-4o-mini | OpenAI | $0.15 | $0.60 | Solid, mid-range cost |
| Llama 3.3 70B (Groq) | Groq | $0.59 | $0.99 | Fast inference, higher input cost |
| Mistral Small | Mistral | $0.20 | $0.60 | European, GDPR-friendly |

*Note: Claude 3 Haiku ($0.25/$1.25) retiring April 2026. Haiku 4.5 is the current small Anthropic model.*

### Falcly Usage Model Per Pro User/Month

**SMS extraction** (10 transactions/day × 30 days):
- 200 tokens input + 100 tokens output per transaction
- Monthly: 60,000 input tokens + 30,000 output tokens

**Conversational queries** (5 queries/day × 30 days):
- 500 tokens input + 300 tokens output per query
- Monthly: 75,000 input tokens + 45,000 output tokens

**Total per user/month: 135,000 input tokens + 75,000 output tokens (0.135M in / 0.075M out)**

### Monthly AI Cost Per Pro User

| Model | Input cost | Output cost | **Total/user/mo** |
|-------|-----------|-------------|-------------------|
| **Gemini 2.0 Flash** | $0.0135 | $0.0300 | **$0.044** |
| Gemini 2.5 Flash-Lite | $0.0135 | $0.0300 | $0.044 |
| GPT-4o-mini | $0.0203 | $0.0450 | $0.065 |
| Mistral Small | $0.0270 | $0.0450 | $0.072 |
| Llama 3.3 70B (Groq) | $0.0797 | $0.0743 | $0.154 |
| Claude Haiku 4.5 | $0.1350 | $0.3750 | $0.510 |

### Recommendation: Gemini 2.0 Flash

At $0.044/user/month, Gemini Flash keeps AI costs at <1% of Pro revenue per user. It also has a generous free tier (60 RPM, 1,500 requests/day) for development and testing. Financial text extraction (dates, amounts, merchants) is a structured task — Flash handles it accurately without needing a larger model.

**At 1,000 Pro users:** AI costs = ~$44/month  
**At 5,000 Pro users:** AI costs = ~$220/month  
**At 10,000 Pro users:** AI costs = ~$440/month  

---

## 8. Unit Economics

### Per Pro User — Monthly Model

**US Market:**
| Item | Amount |
|------|--------|
| Gross revenue | $4.99 |
| App Store / Play Store (15%) | −$0.75 |
| Net after store | $4.24 |
| RevenueCat (1% above $2.5K MRR) | −$0.04 |
| AI cost (Gemini Flash, Phase 2+) | −$0.04 |
| Supabase infrastructure | −$0.02 |
| **Net margin per US user** | **~$4.14 (~83%)** |

**PH Market:**
| Item | Amount |
|------|--------|
| Gross revenue | ₱149 (~$2.62) |
| App Store / Play Store (15%) | −$0.39 |
| Net after store | $2.23 |
| RevenueCat (1% above $2.5K MRR) | −$0.02 |
| AI cost (Gemini Flash, Phase 2+) | −$0.04 |
| Supabase infrastructure | −$0.02 |
| **Net margin per PH user** | **~$2.15 (~82%)** |

**Annual plan economics (higher LTV, same cost base):**
- US annual user: $39.99/year → $33.99 after 15% store cut → ~$33/yr net → **$2.75/mo effective net**
- Amortized AI is the same; annual users have lower churn → LTV is ~4x monthly users

**RevenueCat threshold note:** Below $2.5K MRR, RevenueCat is completely free. At $2.5K MRR (PH: ~953 Pro users, US: ~501 Pro users), the 1% fee kicks in — only $25/month at exactly $2.5K MRR. Not a meaningful cost until ~$10K+ MRR.

**AI cost threshold:** At Gemini Flash pricing, AI costs exceed 10% of net revenue when:
- US: 10% of $4.14 net = $0.41/user. At $0.044 AI cost, this never happens per-user.
- **Scale concern:** AI becomes >10% of total revenue only above ~50,000 Pro users ($220K+ MRR). Far beyond Year 2 projections. Watch at 10K users but no action needed.

---

## 9. Growth Levers

### Organic-First Strategy (No Paid Until $5K MRR)

**1. r/PHCreditCards — Primary launch channel**
- 261K members, active threads weekly on billing cycles, cutoff dates, statement timing
- Strategy: provide genuine value in threads for 4–6 weeks pre-launch, then announce app
- Post format: solve a real problem thread → mention "I built a tool for this"
- Do NOT spam. One well-timed post outperforms ten mediocre ones.
- Target: 100 signups from launch weekend post

**2. TikTok / Reels — Viral education**
- Content: "Why your credit card timing matters" explaining billing cycle
- Format: before/after (spreadsheet vs. Falcly) — 60 seconds
- PH TikTok finance niche is underserved
- One video per week minimum; optimize for shares over likes

**3. ProductHunt Launch**
- Time to 500+ organic users first (credibility)
- Launch on Tuesday–Thursday for max visibility
- Coordinate with PH dev/startup community for votes
- Target: Top 5 Product of the Day in Finance category

**4. Referral Program — "1 for 1"**
- "Give a friend 1 month free, you get 1 month free"
- Implementation: unique referral link, tracked via RevenueCat promotional offers
- RevenueCat supports promo codes natively → "FRIEND1MO"
- Trigger: show referral prompt after first 7 days of Pro usage (satisfied user)

**5. App Store Optimization (tied to file 05)**
- Title: "Falcly: Credit Card Timing" 
- Subtitle: "Safe to Swipe? Know Before You Swipe"
- PH keywords: zero competition, high volume (see file 05)
- US keywords: "credit card billing cycle" — low competition, high intent

**6. When to turn on paid acquisition**
- Threshold: $5,000 MRR (~1,000 US Pro users or equivalent)
- Channel: Google UAC (Android) + ASA (iOS)
- Budget: 20% of MRR ($1K/month at $5K MRR)
- Target CAC: < 3-month payback ($15 CAC for $4.99/mo user)
- Do NOT acquire before product-market fit signal: >40% "very disappointed" on Sean Ellis survey, and <10% monthly churn

---

## 10. Revenue Projections vs. Costs

### AI Cost Overlay (Phase 2 — Month 7+ estimate)

Using financial projections from file 12:

**Baseline Scenario:**

| Month | Pro Users | Gross MRR | Store Cut (15%) | RevenueCat | AI Costs | Net MRR |
|-------|-----------|-----------|-----------------|------------|---------|---------|
| M6 | 180 PH | $471 | −$71 | $0 | ~$0* | ~$400 |
| M9 | 330 PH | $864 | −$130 | $0 | ~$0* | ~$734 |
| M12 | 630 PH | $1,650 | −$248 | $0 | ~$0* | ~$1,402 |
| PH M18/US M6 | ~600 total | $4,397 | −$660 | −$19 | ~$26 | ~$3,692 |
| PH M24/US M12 | ~2,000 total | $11,685 | −$1,753 | −$92 | ~$88 | ~$9,752 |

*AI features are Phase 2 (Month 7+). Costs near zero until then.

**Viral Scenario (PH M12):**
- 1,530 Pro users × ₱149 = ₱227,970 (~$4,000 MRR)
- After 15% store cut: ~$3,400
- RevenueCat (1%): −$34
- AI costs (1,530 users × $0.044): −$67
- **Net MRR viral M12: ~$3,299**

**Break-even analysis:**
- Fixed costs at launch: Domain ($11/yr), Apple Developer ($99/yr), Google Play ($25 one-time), RevenueCat (free), Supabase free tier
- **Total fixed cost Year 1: ~$135/yr (~$11/month)**
- Break-even: **1 paying Pro user in PH covers monthly costs**. Revenue is essentially pure profit from month 1.

**When AI costs become significant:**
- 10% of net revenue threshold: ~$390/month in AI costs = ~8,900 Pro users
- That's well beyond Year 2 targets
- If AI usage spikes (>15 queries/day/user), switch highest-volume users to cached responses or throttle at 50 queries/day

### Summary: Net Profit Per Scenario

| Scenario | ARR (Gross) | Net ARR (after all costs) | Margin |
|----------|------------|--------------------------|--------|
| PH Baseline M12 | $19,800 | ~$16,800 | 85% |
| PH Viral M12 | $48,000 | ~$40,700 | 85% |
| Combined Y2 End | $140,220 | ~$117,000 | 83% |

---

## Implementation Priority

1. **Week 1–2:** Set up RevenueCat, configure App Store Connect (iOS) and Play Console (Android) products — monthly + annual for both markets
2. **Week 2–3:** Implement paywall at card 3 trigger (hard paywall)
3. **Week 3–4:** Add 14-day free trial flow and graceful degradation on expiry
4. **Month 2:** Add soft paywall triggers (payoff planner, installments)
5. **Month 7+:** Add Gemini Flash API for SMS extraction (Phase 2)
6. **Month 9+:** Add conversational query (Phase 2, more complex)
7. **At $5K MRR:** Evaluate paid acquisition

---

*Sources: RevenueCat docs (revenuecat.com/pricing, SOSA 2025 Report), TLDL LLM API Pricing March 2026, Groq pricing page (Llama 3.3 70B SpeedDec $0.59/$0.99), Mistral pricing (prompthub.us: $0.20/$0.60 Small), App Store Connect developer docs, Google Play Console docs, RevenueCat State of Subscription Apps 2025, Adapty in-app subscriptions 2025, alimertgulec.com mobile monetization 2025.*
