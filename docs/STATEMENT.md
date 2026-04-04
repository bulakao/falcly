# STATEMENT.md — Statement Date Advisor + Card Overlay System

> Research + design doc for the Statement Date Optimizer feature and Card Overlay system.
> Goal: educate users on how to optimize their credit card portfolio through smart statement date awareness, delivered via a versatile card overlay system.

---

## Background & Research

### The Problem
Most credit card users don't think about statement dates strategically. They end up with:
- Multiple cards closing on the same or adjacent days
- "Dead zones" — stretches of 10–15+ days where no card has recently reset
- Due dates bunching up, creating cash flow pressure in a single week
- No card that's "safe to swipe" when they need it most

### Key Finding: PH Banks Don't Allow Date Changes
Research from r/PHCreditCards confirms that **most major Philippine banks do NOT allow statement date changes** — the date is fixed at card issuance.

| Bank | Changeable? | Notes |
|------|-------------|-------|
| BDO | ❌ No | Fixed at issuance |
| BPI | ❌ No | Fixed at issuance (confirmed 9+ year cardholders) |
| Metrobank | ❌ No | Fixed at issuance (confirmed 13+ year cardholders) |
| RCBC | ❌ No | Not allowed |
| Security Bank | ⚠️ Varies | May accommodate via hotline request |
| UnionBank | ⚠️ Varies | Digital-first, may be more flexible |
| EastWest | ⚠️ Varies | Call hotline |
| Citibank | ⚠️ Varies | Call hotline |
| Maya | 🔄 Likely flexible | Digital-first, no legacy systems |
| GCash | 🔄 Likely flexible | Digital-first |

**Implication:** The feature cannot be "change your date." It must be educational and strategic — teaching users how to work with what they have, and how to make smarter choices when getting a new card.

### Why Statement Dates Matter

1. **Cash flow spread** — evenly spaced statement dates mean evenly spaced due dates = no cash crunch week
2. **Always have a "fresh" card** — right after a statement closes, utilization resets and the card has its full grace period. You want a card that just reset available at all times.
3. **Payday alignment** — statement closing 2–5 days after payday = you have cash ready when the bill comes, and near-full month to spend interest-free
4. **Credit score** (secondary) — statement date = the day utilization is reported to credit bureaus. Multiple high-balance cards reporting on the same day hurts your score
5. **Grace period maximization** — a purchase made the day after statement close gets ~50 days interest-free (30-day cycle + 20-day grace). A purchase made the day before close gets ~20 days. Knowing this = free float.

---

## Card Overlay System

### What It Is
A dismissible layer that renders **on top of the credit card face** (`CreditCardFace`), temporarily replacing the card visual with a message, tip, alert, or promotion. Dismissing it reveals the card face underneath — content is never destroyed, just hidden.

### Design Principles
- **Non-blocking** — dismiss always available, card face always returns
- **Layered** — overlay sits above the card, content below is intact
- **Versatile** — same component, multiple content types
- **Configurable** — user controls what shows, how often, and can turn it off entirely
- **Targeted or global** — can target a specific card (e.g. BDO clustering alert) or show on all cards
- **Prioritized** — if multiple overlays are queued for a card, highest priority shows first

### Content Types
| Type | Description | Example |
|------|-------------|---------|
| `alert` | Urgent card-level warning | "Due in 2 days — minimum ₱3,500" |
| `advisory` | Optimization suggestion | "Best time to swipe BDO is today — just reset" |
| `tip` | Educational bite-size fact | "Swiping now gives you ~49 days interest-free" |
| `statement` | Statement date insight | "BDO and BPI are 2 days apart — here's why that matters" |
| `wiki` | In-app knowledge card | "What is a grace period?" |
| `promo` | App promotion / feature highlight | "New: Payoff Planner is live" |
| `affiliate` | Partner offer (future) | "Apply for Security Bank Cashback — 5% back on groceries" |

### Dismissal Behavior
- **Per-tip dismissal** — each overlay has its own dismissed state
- **Dismiss** — hide for current session + mark as seen (stored in AsyncStorage)
- **Reappear** — based on user-configured frequency (see Settings)
- **"View →"** — tap body to navigate to full detail (Statement Advisor, wiki article, etc.)
- **Not global dismiss** — dismissing one overlay doesn't silence all overlays

### Priority System
```
Priority order (highest first):
1. alert      — always show, cannot be turned off
2. statement  — portfolio-level insight, per-card targeting
3. advisory   — timing/optimization tips
4. tip        — educational
5. wiki       — knowledge cards
6. promo      — app feature highlights
7. affiliate  — partner offers (lowest priority, opt-in only)
```

### Targeting
- **Card-specific** — overlay tied to a specific card (e.g. clustering alert for BDO)
- **Portfolio-level** — shown on first card in pager (e.g. spread score drop)
- **Global** — shown on all cards in rotation (e.g. wiki tips)

### Component: `CardOverlay`
```
Props:
  type: OverlayType
  title: string
  body: string
  cta?: string           // "View →", "Learn more", "Got it"
  onDismiss: () => void
  onAction?: () => void  // navigate or expand
  cardId?: string        // if card-specific
  priority: number
```

Renders as an animated overlay on top of `CreditCardFace`, matching card dimensions and border radius.

---

## Settings: Card Overlay Preferences

New section in Settings: **"Card Tips & Alerts"**

### Controls
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Show card overlays | Toggle | On | Master switch — turns off all non-alert overlays |
| Alerts | Toggle | On | Due date / high utilization alerts (always on recommended) |
| Statement tips | Toggle | On | Statement date insights |
| Educational tips | Toggle | On | Grace period, timing, wiki cards |
| Promotions | Toggle | Off | App feature highlights |
| Affiliate offers | Toggle | Off | Partner offers (future) |
| Tip frequency | Picker | Every 3 days | Options: Daily / Every 3 days / Weekly / Monthly |
| Reset dismissed tips | Button | — | Re-show all previously dismissed tips |

### Persistence
- All settings stored in `userStore` (persisted via AsyncStorage)
- `overlayPrefs: { enabled, alerts, statements, tips, promos, affiliates, frequencyDays }`
- Dismissed overlay IDs stored separately in AsyncStorage: `@falcly/dismissed_overlays`

---

## In-App Wiki

### Philosophy
Bite-sized. One concept per card. No walls of text. User can learn at their own pace by tapping through overlays. Think: flashcard meets contextual tooltip.

### Format
Each wiki entry:
- **Title** — 4–6 words max
- **Body** — 2–3 sentences max, plain language
- **Example** — one concrete example (numbers, dates)
- **Learn more** — link to full Statement Advisor or external article (future)

### Wiki Cards (initial set)

| ID | Title | Body | Example |
|----|-------|------|---------|
| W-01 | What is a statement date? | The day your billing cycle closes. All purchases before this date appear on your bill. After this date, a new cycle starts. | "Your BDO statement closes on the 15th — purchases on the 14th go on this month's bill." |
| W-02 | What is a due date? | The deadline to pay your bill without late fees. Usually 20–25 days after your statement date. | "Statement closes the 15th → bill due the 5th of next month." |
| W-03 | What is a grace period? | The interest-free window between your statement close and due date. Pay in full before the due date = zero interest. | "Close on the 15th, due on the 5th = 20 days to pay for free." |
| W-04 | Maximize your interest-free days | Swipe right after your statement closes to get the most interest-free time. Swipe just before it closes = shortest window. | "Swipe on the 16th (day after close) → ~49 days free. Swipe on the 14th → ~21 days." |
| W-05 | Why card spread matters | With multiple cards, evenly spaced statement dates mean no week where all bills are due at once. Always have a "fresh" card. | "Cards closing on 5th, 15th, 25th = one resets every 10 days." |
| W-06 | Align with your payday | A card that closes 2–5 days after payday = you have cash when the bill arrives + near full month to spend. | "Payday on the 15th → ideal card close on 18th–20th." |
| W-07 | Can I change my statement date? | Most PH banks don't allow it — BDO, BPI, Metrobank, RCBC all fix the date at issuance. Digital banks (Maya, GCash) may be more flexible. | "Your BDO date is locked. But you can choose a new card strategically." |
| W-08 | What to ask when applying | Banks rarely advertise statement dates. Ask: 'What statement date will my card have?' before or right after approval. | "Aim for a date that fills your biggest gap (e.g. if you have 5th and 15th, ask for around the 25th)." |
| W-09 | Statement date = credit score | Your statement date is when your balance is reported to credit bureaus. High balance on report day = high utilization = lower score. | "Pay down before your close date to improve your reported utilization." |
| W-10 | The 2-day buffer rule | Avoid swiping within 2 days of your statement close. The purchase may still land on the current bill, cutting your grace period short. | "BDO closes on the 15th → avoid swiping on the 13th or 14th." |
| W-11 | What is utilization? | Your credit utilization is how much of your limit you're using. Lower is better for your credit score. Under 30% is the common target. | "₱15,000 used on a ₱50,000 limit = 30% utilization." |
| W-12 | The sweet spot after close | The day after your statement closes is the best time to make big purchases — you get the full cycle + grace period interest-free. | "Close on the 15th → swipe on the 16th = ~49 days of free float." |

### Wiki Delivery
- Shown as `CardOverlay` with `type: 'wiki'`
- Rotates through wiki cards based on relevance (e.g. W-04 shown after user swipes close to statement date)
- Contextual delivery: W-07 shown when user has a clustered portfolio
- Can also be browsed manually in Statement Advisor → "Credit Card 101" section
- Future: `falcly.com/learn` for full web versions

---

## Statement Advisor Feature

### Philosophy
- **Educational first** — explain why, not just what
- **Non-judgmental** — not a debt shaming tool
- **Always available** — not a one-time wizard, accessible anytime
- **Versatile** — all 4 modes work independently, not a rigid wizard
- **Not prescriptive** — show options and tradeoffs, let user decide
- **No deep links** — bank app URLs change; we link to general guidance only

---

## Modes

### Mode 1 — Portfolio Analysis (2+ cards)
Analyze the current spread of statement dates across all active cards.

**What it shows:**
- Visual 30-day timeline with each card's statement date marked
- Gap analysis — which stretches have no statement reset
- Clustering alerts — cards within 7 days of each other
- Payday alignment check (if payday is set in profile)
- Portfolio spread score (0–100)

**What it recommends:**
- Timing tips: "Swipe on BDO right after the 15th for maximum ~50-day grace period"
- Payment optimization: "Your BPI and Metrobank are due in the same week — pay BPI first if you're tight"
- New card targeting: "Your next card should close around the 25th to fill your gap"

### Mode 2 — Single Card Guidance
User has one card (or is thinking about their first/next card).

**What it shows:**
- Payday alignment: "Your payday is the 15th — a card closing on the 18th–20th gives you max grace"
- Grace period explainer: how to maximize interest-free days
- What to ask for when applying for a new card

### Mode 3 — New Card Planner
User is planning to apply for a new card and wants to know what statement date to aim for.

**What it shows:**
- Current gaps in their portfolio (days with no statement reset)
- Target date range: "Aim for a card closing between the 22nd–28th"
- What to ask during application: "Can you tell me what statement date this card will have?"

### Mode 4 — Timing Advisor (Swipe Intelligence)
User is about to make a purchase and wants to know which card + when to swipe for max benefit.

**What it shows:**
- For each card: days until next statement close, effective grace period remaining
- "Best card to use today" ranked by days of interest-free float available
- Warning if a card is about to close (next 3 days) — swipe will get shortest grace period
- Post-close sweet spot: "BDO just closed yesterday — you have ~49 days interest-free if you swipe now"

> Note: Mode 4 overlaps with the existing Swipe Impact panel. This mode is a dedicated educational explainer, not a replacement.

---

## Detection & Scoring Algorithm

### Input
- `cards: Card[]` — active cards with `statementDay`
- `payday?: number` — day of month (from userStore)
- `payday2?: number` — second payday if bi-monthly

### Spread Score (0–100)
```
score = 100
- deduct 15 per clustered pair (gap < 7 days)
- deduct 10 per dead zone > 14 days
- deduct 10 if no card aligns with payday (+/-5 days)
- deduct 5 per dead zone > 7 days (minor)
minimum score: 0
```

### Gap Analysis (Circular Month)
```
Treat month as days 1–30 (normalize 31-day months)
Sort statement days
Gaps = differences between consecutive days (circular: last → first wraps around)
Ideal gap = 30 / N cards
Dead zone threshold = 14 days (no card for 2 weeks)
Cluster threshold = 7 days (cards too close)
```

### Payday Alignment
```
Optimal range: payday + 2 to payday + 5 days
If any card falls in this range → aligned ✅
If none → misaligned, suggest targeting this range for next card
```

### Next Card Target Date
```
Find largest gap in current spread
Target = midpoint of largest gap
If gap < 10 days → "Your spread is already good"
```

---

## Recommendations Engine

### Issue Types
| Type | Trigger | Message |
|------|---------|---------|
| `CLUSTERED` | Two cards within 7 days | "Your [Bank A] (Xth) and [Bank B] (Yth) are only Z days apart" |
| `DEAD_ZONE` | Gap > 14 days | "No card resets between the Xth and Yth (N days)" |
| `PAYDAY_MISALIGNED` | No card 2–7 days after payday | "No card aligns with your payday on the Xth" |
| `SINGLE_CARD` | Only 1 card | "With one card, here's how to maximize your grace period" |
| `ALL_GOOD` | Score > 80 | "Your card spread is well optimized" |

### Tip Types
| Type | When | Example |
|------|------|---------|
| `TIMING_TIP` | Always | "Swipe on BDO right after the 15th — you get ~49 days interest-free" |
| `NEW_CARD_TARGET` | Score < 70 or dead zone | "Your next card should close around the 25th" |
| `PAYDAY_TIP` | Payday misaligned | "A card closing on the 18th would align with your payday on the 15th" |
| `CLUSTER_WORKAROUND` | Clustered cards | "Since BDO and BPI close together, alternate which card you prioritize each month" |
| `GRACE_EXPLAINER` | Always available | "A purchase on day 1 of your cycle gets ~50 days interest-free. On day 29 — only ~21 days." |
| `BANK_CHANGE_INFO` | On request | "Most PH banks don't allow date changes — here's what you can do instead" |

---

## UI Design

### Entry Points
- **CardPager** — `CardOverlay` on card face (per-card or portfolio-level)
- **Settings** — "Statement Advisor" menu item, always accessible
- **Swipe Impact panel** — "Is now a good time?" link

### Screen: `app/statement-advisor.tsx`

**Sections:**
1. **Spread Score** — ring visualization, score out of 100, one-line summary
2. **30-day Timeline** — horizontal strip, each card's statement day marked, dead zones shaded
3. **Issues** — list of detected problems with explanation
4. **Recommendations** — actionable tips, each expandable
5. **Timing Guide** — per-card: "Best time to swipe [Bank] is days X–Y"
6. **New Card Target** — "If you get a new card, aim for the [Xth]" (conditional)
7. **Bank Reference** — "Can I change my statement date?" collapsible table
8. **Credit Card 101** — browsable wiki cards (all W-01 through W-12)

### Card Overlay — Visual

```
┌─────────────────────────────────────┐
│ [icon]  Statement Tip          [✕]  │  ← type + dismiss
│                                     │
│ BDO and BPI close 2 days apart.     │  ← body (2–3 lines max)
│ Here's how to work with it.         │
│                                     │
│                         [View →]    │  ← CTA
└─────────────────────────────────────┘
```

Rendered over `CreditCardFace`, matching card dimensions and border radius. Animated fade-in.

---

## User Stories

| ID | Title | Notes |
|----|-------|-------|
| SD-01 | `analyzeSpread()` engine in `utils/statementAdvisor.ts` | Core algorithm |
| SD-02 | Statement Advisor screen — score + timeline | Visual |
| SD-03 | Issues list + recommendations section | Logic display |
| SD-04 | Timing guide + bank reference + Credit Card 101 wiki | Educational |
| SD-05 | `CardOverlay` component + overlay queue system | Infrastructure |
| SD-06 | Overlay preferences in Settings | User control |
| SD-07 | Contextual wiki delivery via `CardOverlay` | W-01 through W-12 |

---

## Constraints & Non-Goals

- ❌ No "Change my statement date" button — can't do it for most PH banks
- ❌ No bank deep links — URLs change, we'd have to maintain them
- ❌ No persistent nag — spaced out per user preference, always dismissible
- ❌ Not a debt advisor — we don't tell people whether to pay minimum or full
- ✅ Educational — explain why, not just what
- ✅ Versatile — all 4 modes work independently
- ✅ Always accessible — not just a one-time prompt
- ✅ User-controlled — full overlay settings in preferences
- ✅ Generic — algorithm is pure date math, works for any market
- ✅ In-app wiki — bite-sized, browsable, contextually delivered

---

## Future / Website

`falcly.com/learn` — public knowledge base (post-launch):
- Full versions of in-app wiki cards (W-01 through W-12+)
- SEO: "How to choose a credit card statement date Philippines"
- "Why your credit card statement date matters more than you think"
- "The best time of the month to swipe your credit card"
- Link from in-app "Learn more →" to web articles
- Builds brand authority + organic traffic before wider launch

---

*Last updated: 2026-04-04*
*Status: Design complete — ready for SD-01 implementation*
