# Falcly — Go-to-Market Strategy

> **Date:** 2026-04-05 (updated from 2026-03-30)
> **Changes:** Finalized pricing, 30-day trial, lean budget, review strategy, Tagalog emphasis

---

## Executive Summary

Falcly's GTM strategy centers on two markets: Philippines (primary, zero competition, high pain signal) and US/West (secondary, higher WTP, larger TAM). Distribution is organic-first: Reddit communities, TikTok finance creators, and app store search. The Mint shutdown created an unfilled vacuum that Falcly can exploit with targeted content marketing.

---

## 1. Finalized Pricing

| Plan | PH + Global | 🇺🇸 US | 🇪🇺 EU | 🇨🇦 CA | 🇦🇺 AU |
|------|------------|--------|--------|--------|--------|
| Monthly | $4.99 | $6.99 | €5.99 | CA$8.99 | A$10.99 |
| Annual | $47.99 | $55.99 | €47.99 | CA$71.99 | A$87.99 |
| Lifetime | $99.99 | $99.99 | €89.99 | CA$129.99 | A$149.99 |
| Trial | 30 days free | 30 days free | 30 days free | 30 days free | 30 days free |

**Annual saves ~20% vs monthly** (computed live from RevenueCat — no hardcoded label).
**Lifetime = ~16 months payback** at PH price, strong launch incentive.
**Prices set per-country in Play Console / App Store Connect** — RevenueCat reads them automatically, no app code changes needed for price updates.

---

## 2. Distribution Channels

### Philippines (Primary Market)

| Channel | Action | Priority | Timeline |
|---------|--------|----------|----------|
| **Google Play** | ASO for "credit card app Philippines," "cutoff date tracker," "billing cycle tracker" | P0 | Launch |
| **r/PHCreditCards** | Authentic engagement, answer cutoff date questions, soft product mentions | P0 | Pre-launch |
| **TikTok PH (Tagalog)** | Short-form tips in Filipino: "Safe ba mag-swipe ngayon?" format | P0 | Launch |
| **Facebook Groups** | PH credit card tips groups, financial literacy groups | P1 | Month 1 |
| **YouTube PH** | Partner with PH finance creators (1M+ sub channels exist) | P1 | Month 2 |
| **App Store (iOS)** | Secondary — 14% PH share but higher-income users | P2 | Post-Android |

### United States / West (Secondary Market)

| Channel | Action | Priority | Timeline |
|---------|--------|----------|----------|
| **r/CreditCards** | Organic engagement (3M+ members) | P0 | Pre-launch |
| **r/personalfinance** | Content about billing cycle management (18M+ members) | P1 | Launch |
| **App Store Search** | ASO for "credit card tracker," "billing cycle app," "Mint alternative" | P0 | Launch |
| **Content/SEO** | Blog targeting "Mint alternative," "credit card billing cycle" | P1 | Month 1 |
| **Product Hunt** | Launch for tech-savvy early adopters | P1 | Month 2 |
| **YouTube finance** | Partner with credit card review channels | P2 | Month 3 |
| **NerdWallet/TPG** | Affiliate/partnership with credit card review sites | P3 | Month 6 |

---

## 3. Content Strategy

### Tagalog Content — Biggest Untapped Advantage

Most PH finance content is in English. Tagalog content has significantly less competition in search and TikTok. This is Falcly's moat in the PH market.

**Core Tagalog content pieces (do these first):**

| Format | Topic | Channel |
|--------|-------|---------|
| TikTok 60s | "Safe ba mag-swipe ngayon?" — billing cycle explained visually | TikTok PH |
| TikTok 60s | "Bakit na-late charge ako kahit nagbayad na ako?" | TikTok PH |
| TikTok 60s | "Paano i-track ang tatlo mong credit cards" | TikTok PH |
| Blog | "Ano ang cutoff date ng credit card?" | SEO |
| Blog | "Kailan ang tamang oras mag-swipe para hindi masungkit sa next statement" | SEO |
| Blog | "BDO, BPI, Metrobank — kailan ang kanilang cutoff dates?" | SEO |
| YouTube | "Credit card billing cycle explained in Filipino" (10 min) | YouTube PH |

**Tone:** Kuya/Ate energy — helpful, no-judgment, assumes they're smart but just didn't know this. Not a financial advisor. Not a brand. A friend who knows credit cards.

### English Blog Strategy (2 posts/week after Tagalog foundation)

| Cluster | Topics | Market |
|---------|--------|--------|
| **Credit card basics** | Cutoff date vs due date, grace period, billing cycle explained | Both |
| **PH-specific** | BDO cutoff dates, BPI billing cycle, RCBC statement dates | PH |
| **Utilization** | When to pay for best utilization, how utilization affects score | US |
| **Multi-card** | How to track multiple credit cards, spreadsheet templates | Both |
| **Post-Mint** | Mint alternative for credit cards, what's missing from Monarch | US |
| **Product** | Falcly vs YNAB, vs CardPointers (comparison pages) | US |

---

## 4. Reddit Strategy (Primary Acquisition Channel)

### Target Subreddits

| Subreddit | Members | Pain Signal | Strategy |
|-----------|---------|-------------|----------|
| r/PHCreditCards | ~261K | Cutoff date confusion, billing cycle questions | Answer questions with expertise, become trusted voice |
| r/CreditCards | 3M+ | Utilization timing, multi-card management | Educational content, link to free tool |
| r/personalfinance | 18M+ | Post-Mint migration, credit card management | "How I track my billing cycles" posts |
| r/YNAB | 300K+ | YNAB doesn't track billing cycles | Complementary tool positioning |
| r/churning | 500K+ | Multi-card cycle management | Power user acquisition |

### Approach
- **Don't advertise.** Provide genuine value. Answer questions about cutoff dates, utilization timing, payment strategies.
- **Build authority first.** Post educational content for 4–6 weeks before mentioning Falcly.
- **One well-timed launch post** outperforms ten mediocre ones. Time it to a real pain thread.

---

## 5. App Store Review Strategy

Reviews are critical — they directly impact Play Store search ranking and conversion from listing page. This is often neglected until too late.

**In-app review prompt triggers:**
- After 7 days of active use (not just installs)
- After user avoids a CAUTION/RISKY status and checks back in (positive outcome moment)
- After successful payoff planner calculation
- **Never** on first open, never after an error, never more than once per 30 days

**Implementation:** Use `expo-store-review` (already in Expo ecosystem). Call `StoreReview.requestReview()` at the right moment — iOS uses native prompt, Android opens Play Store. **Status: pending implementation (TODO tracked in TODO.md).**

**Review seeding (first 100 users):**
- Personally message early adopters from r/PHCreditCards launch thread
- "Hey, loving your feedback — if you have 30 seconds, a review on Play Store really helps other PH credit card users find the app"
- Target: 50 reviews before US launch. Reviews with keywords (billing cycle, credit card, Philippines) improve ASO.

**Responding to reviews:**
- Reply to every 1-star within 24 hours
- Reply to 5-stars with a short, personal note (not copy-paste)
- Reviews with replies rank better and convert better

---

## 6. Social Media

| Platform | Audience | Content | Priority |
|----------|----------|---------|----------|
| **TikTok PH (Tagalog)** | Gen Z + Millennial first-time cardholders | 60s tips in Filipino | P0 |
| **TikTok US** | Young credit card users | Billing cycle explainers, utilization tips | P1 |
| **Instagram** | Millennial multi-card users | Carousel: "5 things your credit card app doesn't tell you" | P2 |
| **Twitter/X** | Finance Twitter, fintech community | Product updates, credit card tips | P3 |

---

## 7. Influencer Strategy

### Tier 1: Micro-Influencers (PH, 10K–100K followers)
- PH finance TikTokers and YouTubers
- $100–$300 per sponsored post or barter (free Pro lifetime)
- Focus: authentic use — "Here's how I track my 4 credit cards"

### Tier 2: Mid-Tier (US, 50K–500K followers)
- Credit card review YouTubers
- $500–$2,000 per integration
- Focus: "tool that fills the gap YNAB and CardPointers don't cover"

---

## 8. Phased Launch Timeline

### Pre-Launch (Weeks −4 to 0)
- Start posting on r/PHCreditCards and r/CreditCards (building credibility)
- Publish 5 Tagalog SEO blog posts
- Create TikTok account, post 10 Tagalog short-form videos
- Set up ASO for both app stores
- Enroll in Apple Small Business Program (15% store cut instead of 30%)

### Month 1: PH Launch
- Google Play launch
- r/PHCreditCards launch post (after credibility built)
- TikTok PH micro-influencer partnerships (3–5 creators)
- Facebook group engagement
- **Goal:** 500 installs, 50 trial starts, 20 paid

### Month 2–3: Growth + US Soft Launch
- Product Hunt launch
- r/CreditCards, r/personalfinance engagement
- Blog content ramp (2/week)
- App store review push (target 50 PH reviews)
- **Goal:** 2,000 total installs, 200 active, 80 paid

### Month 4–6: Scale
- YouTube partnerships (PH + US)
- Referral program: "Give 1 month, get 1 month"
- iOS App Store launch (US)
- **Goal:** 10K installs, 1K active, 200–300 paid, ~$1.5K MRR

### Month 7–12: Independence Push
- Consistent content cadence (2 blog/week, 3 TikTok/week)
- US paid search at $5K MRR threshold
- NerdWallet/TPG partnership exploration
- **Goal:** 500+ paid, $2.5K–$5K MRR

### Month 13–24: US Expansion
- Full US marketing push
- Localized US content (billing cycle, Mint replacement angle)
- Paid acquisition: Google UAC + Apple Search Ads
- **Goal:** ~$10K MRR by end of Month 24

---

## 9. Budget

### Lean Version (Bootstrapped, <$5K Year 1)

| Category | Monthly | Annual | Notes |
|----------|---------|--------|-------|
| Apple Developer | — | $99 | One-time/year |
| Google Play | — | $25 | One-time |
| Domain + hosting | $10 | $120 | Vercel free tier for blog |
| SEO tools | $10 | $120 | Ahrefs Lite or free alternatives |
| TikTok micro-influencers | $100–300 | $1,200–$3,600 | 1 per month at launch |
| **Total** | **~$120–$430** | **~$1,600–$3,900** | |

> RevenueCat free until $2.5K MRR. Supabase free tier covers early scale. No paid ads until $5K MRR.

### Growth Version (At $5K MRR, reinvest 20%)

| Category | Monthly | Notes |
|----------|---------|-------|
| Paid search (Google UAC + ASA) | $1,000 | Target CAC < 3-month payback |
| Content creators | $500 | 2–3 mid-tier |
| SEO tools | $50 | Ahrefs |
| RevenueCat | ~$50 | 1% of MRR |
| **Total** | **~$1,600** | 32% of $5K MRR |

---

## 10. Key Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| Install → trial start | >15% | Paywall placement working |
| Trial → paid | >25% | 30-day trial + hard card gate |
| Monthly churn | <5% | Utility apps retain well |
| Annual mix | >35% | Higher LTV, lower churn |
| Reviews (Play Store) | 50 before US launch | ASO + trust signal |
| DAU/MAU | >40% | Healthy retention |

---

---

## 11. App Store Assets (Pending)

> **Status:** To be written. Tracked in TODO.md under "Code — Ready to Implement."

### Play Store Listing Copy
- **Title** (30 chars): TBD — keyword-optimized for "credit card billing cycle Philippines"
- **Short description** (80 chars): TBD
- **Full description** (4,000 chars): TBD — cover core value prop, PH-specific framing, feature list
- **Keywords** (see `docs/discovery/5-launch/40-keywords-seo-aso.md`)

### Screenshot Captions (8 screens)
Each screenshot needs a headline + sub-caption that sells the feature:
1. Dashboard — SAFE/CAUTION/RISKY status
2. Swipe impact — "See the effect before you spend"
3. Billing timeline — "Know exactly which cycle it lands on"
4. Multi-card — "All your cards, one view"
5. Payoff planner — "Avalanche vs snowball, side by side"
6. Statement advisor — "Spread your spending, protect your score"
7. Onboarding — "Set up in 30 seconds"
8. Paywall — "Try free for 30 days"

### ASO Notes
- Screenshots in Tagalog/Filipino for PH Play Store listing (separate listing locale)
- English screenshots for US/global
- Feature graphic: falcon mascot + "Know before you swipe" tagline

---

*Sources: Reddit community sizes, TikTok PH finance community, Google Play/App Store data, r/PHCreditCards topic analysis, RevenueCat SOSA 2025, Apple Small Business Program docs.*
