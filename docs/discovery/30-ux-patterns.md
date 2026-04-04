# Falcly — UX Patterns

> **Date:** 2026-03-30
> **For:** Falcly design and engineering

---

## Executive Summary

Falcly's UX is built on a single, uncompromising principle: **one answer per screen, instantly scannable, zero ambiguity.** Where most finance apps bury the user in dashboards, graphs, and toggles, Falcly opens to a status — SAFE, CAUTION, or RISKY — and gets out of the way. Every screen earns its existence by answering one question. Detail is available, but never imposed. The design language is black-forward and premium — closer to Robinhood and Cash App than GCash — with status colors that become instinctive after a week of use. On a crowded jeepney, with one thumb, in 3 seconds: you should know whether it's safe to swipe.

---

## 1. Core UX Principles

### One Answer Per Screen
Every primary screen has a hero element — the status. Everything else is context. No screen should require reading to get the gist. The hierarchy is: status badge → key number → explanation → detail (on tap).

### Progressive Disclosure
- **Layer 1 (glance):** SAFE / CAUTION / RISKY + one-line reason
- **Layer 2 (tap):** Projected statement, days to close, utilization, cash coverage
- **Layer 3 (deep dive):** Full breakdown — installments, subscriptions, payoff math, cycle history

Never show Layer 3 by default. Users who want it will find it. Users who don't will not be scared away.

### Confidence Transparency
Data freshness is trust. Every status that depends on a balance more than 48 hours old gets a `⚠️ Updated X days ago` footnote. A stale SAFE is worse than no answer — it creates false confidence. Show the uncertainty; don't hide it.

### Deterministic, Not Probabilistic
Falcly never says "may" or "might." Every output is either computed (authoritative) or clearly labeled as an estimate. The voice is `"RISKY. Statement closes in 2 days."` — not `"You might want to be careful about swiping today."`

---

## 2. Onboarding

### Minimum Viable Onboarding (MVO)
To get a useful answer, Falcly needs exactly **3 fields per card:**
1. Statement day (what day does the cycle close?)
2. Credit limit
3. Outstanding balance (today's approximate balance)

That's it. The user gets their first SAFE/CAUTION/RISKY result immediately. Everything else — due date offset, interest rate, installments, subscriptions, cash on hand — is captured progressively over the next sessions.

**Design principle:** Ask for what delivers immediate value. Defer the rest.

### Onboarding Flow (5 screens max)
```
1. Splash: "Know before you swipe." → [Get Started]
2. Card Entry: Bank name (picker) + last 4 digits (optional) + statement day + credit limit
3. Balance: "What's your current balance?" (approximate is fine) → estimated from outstanding + pending
4. First Answer: Full-screen SAFE/CAUTION/RISKY result — "Here's where you stand."
5. Optional enrichment: "Add cash on hand for a more accurate picture" (skippable)
```

The paywall **does not appear during onboarding.** Users see it naturally when they attempt to add a 3rd card or access a Pro feature. The value moment must come first.

### Paywall Placement: Value-First
- **Trigger 1:** Adding card #3 — soft gate with "Upgrade to Pro: ₱149/mo for unlimited cards"
- **Trigger 2:** Tapping "Payoff Timeline" or "Snowball/Avalanche" strategy — feature-gated
- **Trigger 3:** After 7 days of use — contextual prompt on home screen
- **Never:** Paywall on first launch, before any card is added, or blocking access to cards already entered

### Onboarding References
- **Monzo:** Single-field-per-screen, no friction, progress bar, warm illustration style — Falcly borrows the single-field cadence but strips the illustration warmth for a premium black aesthetic
- **Revolut:** Feature showcase during onboarding → Falcly avoids this, go straight to value
- **N26:** Minimal, fast, no tutorial required — closest to Falcly's intended experience

---

## 3. Home Screen / Dashboard

### Layout Architecture
```
[Header: "Good morning, Med"]
[BEST CARD TODAY] — prominent hero card with bank name + SAFE badge
[Card 1] — compact row or mini card
[Card 2] — compact row or mini card
[+ Add Card]
```

### Best Card Today: Hero Element
The "Best card to use today" recommendation is the most prominent element on home. It gets:
- Full-width card with bank name, network logo, last 4 digits
- Large SAFE badge (color-coded)
- One-line reason: "18 days to statement · 28% utilization"
- Tap → full Swipe Impact screen for that card

### Multi-Card Status List
Below the hero: all cards in a compact list/row format. Each card shows:
- Bank name + last 4
- Status badge (SAFE / CAUTION / RISKY) — color + icon + text
- Days to statement close
- Current utilization %

**Cards as cards vs. list rows:**
- **Visual card (physical card layout):** High recall, satisfying, works well for 1-2 cards — but at 4+ cards, scrolling a horizontal card carousel becomes cumbersome
- **List rows:** Scannable, space-efficient, works at 4-6 cards — but feels generic
- **Recommendation:** Hybrid — hero card as full visual representation, rest as compact list rows. As users add more cards, the hero promotes the best card; rows show the rest.

### Status Indicator Design
SAFE / CAUTION / RISKY must be scannable in peripheral vision:
- **Color** (primary signal): Emerald / Amber / Crimson — full saturation in both modes
- **Icon** (secondary signal): ✓ checkmark / ⚠ triangle / ✕ stop circle
- **Text label** (tertiary signal): "SAFE" / "CAUTION" / "RISKY" in DM Sans Bold, tight tracking

Never color alone. Always icon + color + text.

### Stale Data on Dashboard
If any card's balance is 5+ days old: show amber `⚠️` inline on that card row. If >10 days: override the status badge to show a staleness warning instead of SAFE/CAUTION/RISKY.

---

## 4. Swipe Impact Screen (Core Differentiator)

### Input: Amount Entry
The amount field should feel fast and tactile:
- **Numeric keyboard** auto-opens on screen entry (no tap-to-activate)
- **Big centered number:** ₱0 → user types → number grows in real time
- **Quick amounts:** Row of chips below input — ₱500 / ₱1,000 / ₱2,000 / ₱5,000 (context-sensitive, based on card limit)
- **Instant recalculation:** Status updates live as user types — no submit button
- The amount field is the hero; everything else is output

### Output: Impact Summary
```
[STATUS BADGE — full width, bold]

If you swipe ₱5,000 today:

Next statement      ₱18,500
You can pay         ₱15,000
Carried             ₱3,500 → ₱70 interest (2%/mo)
Payoff timeline     2 months at ₱1,750/mo

[Use a different card ↓]
```

- Negative impacts (carried balance, interest) shown in amber or crimson — not neutral gray
- Positive outcomes (fully covered, zero interest) shown in emerald
- "Update my cash" link inline if net cash is the limiting factor

### Cross-Card Comparison
Below the impact summary, if user has multiple cards: collapsed section `"Compare cards →"`
On expand:
```
BPI Petron  [SAFE]      ₱12,000 projected · 18 days left
UB Rewards  [CAUTION]   ₱18,500 projected · 4 days left  ← current
RCBC Gold   [RISKY]     ₱22,000 projected · 1 day left
```

Each row is tappable to switch the active card for the same amount.

### Design References
- **Venmo / PayPal send flow:** Amount-first, large numpad, instant feedback — borrow the instant feedback principle
- **Splitwise:** Clean number presentation without calculator-app coldness
- Avoid: Calculator-style keypads (confusing UX on mobile), sliders for amount (imprecise)

---

## 5. Billing Cycle Timeline

### Single-Card View
Horizontal timeline strip showing:
```
[Cycle start] ————[TODAY]———————[Statement close] · · · [Due date]
    Mar 1         Mar 18            Apr 1               Apr 21
```
- Colored segments: past (muted), present (active), future-known (solid), future-uncertain (dashed/faded)
- Today marker: vertical line + "Today" label
- Statement close: Red/amber marker (proximity-aware — turns amber at 7 days, crimson at 2 days)
- Due date: shown in the tail section with days countdown

### Multi-Card Gantt View
Inspired by the existing HTML prototype. Vertical stack of cards, each with their horizontal timeline. This is the "cycle pressure at a glance" view — useful for power users managing 4-6 cards.

```
BPI Petron   [====|========|---···]  Apr 1 close  SAFE
UB Rewards   [====|=====|--·······]  Mar 24 close CAUTION
RCBC Gold    [====|========|=====|]  Mar 19 close RISKY
```

- Color-coded bars by status
- Sorted by urgency: closest statement first
- Tappable rows → full single-card detail

### Future Cycle Projection
Beyond the current cycle: show projected cycles as faded rows, certainty decreasing with visual fade. Use dashed borders and muted color to communicate "this is projection territory." Add explicit label: `"Projection — based on known installments only."`

### References
- **Google Calendar:** Timeline clarity, today marker convention
- **Jira roadmap / Gantt tools:** Multi-row parallel timelines — borrow the visual logic, not the complexity

---

## 6. Payment Planning Screen

### Strategy Selector
Horizontal pill selector — not a dropdown. Six options:
`Full` · `Minimum` · `Fixed` · `Aggressive` · `Avalanche` · `Snowball`

On tap: brief tooltip explains the strategy in one line (e.g., "Avalanche — highest interest first. Saves the most money long-term."). No modal needed.

### Payoff Timeline Visual
Below strategy selector:
- Bar or step chart: "Debt-free in X months"
- Each bar = one month's payment, shrinking toward zero
- Months labeled on x-axis (Mar, Apr, May...)
- Total interest cost shown prominently in amber: "You'll pay ₱840 in interest at this rate"
- If strategy = Full: "₱0 interest. Paid in full this cycle." in emerald

### Multi-Card Debt View
Horizontal card rows sorted by attack order:
- Avalanche: highest APR first
- Snowball: lowest balance first
- Visual progress bar per card: "₱8,500 of ₱18,000 paid (47%)"
- "Pay this one next →" CTA on the priority card

### Interest Cost Honesty
Show the true cost of carrying:
```
Current balance:    ₱18,000
Interest per month: ₱360 (2%)
If minimum only:    Paid off in 11 months · ₱3,960 total interest
If full pay:        ₱0 interest
```
This is the moment users feel the app's value. Make it legible, not alarming.

---

## 7. Card Management

### Add Card Flow
**Required fields (3):**
1. Bank name → searchable picker with PH bank list (BPI, Metrobank, BDO, RCBC, UnionBank, Security Bank, Citibank, HSBC...)
2. Credit limit
3. Statement day

**Optional fields (shown in "More details" expandable):**
- Last 4 digits (for identification only)
- Due date offset (default: 20 days after statement)
- Monthly interest rate (default: 2%)
- Min payment % (default: 5% or ₱500)
- Annual fee + month due
- Network (Visa / Mastercard / JCB / Amex) — for logo display only

### Visual Card Representation
Each card displayed as a stylized card tile with:
- Bank name (prominent)
- Network logo (top right corner)
- Last 4 digits (if entered)
- Card background: bank-associated gradient or solid color (BPI = dark teal, BDO = navy, UB = dark blue, etc.)
- Status badge overlaid on card corner

On dark mode: cards appear as elevated dark surfaces with subtle border — the bank color appears as a thin accent strip at the card top.

### Per-Card Detail Screen
Tabs or scroll sections:
1. **Status** — current SAFE/CAUTION/RISKY with full breakdown
2. **Installments** — list of active installments with months remaining, monthly amount
3. **Subscriptions** — list of recurring charges, billing day, next hit
4. **Settings** — edit card fields, data freshness control, delete

### Data Freshness
- Below card name: `"Balance updated 3 days ago"` in secondary text
- At 5+ days: amber `⚠️ May be outdated — tap to update`
- At 10+ days: status badge replaced by `"Data stale — update before trusting this status"`
- Tap to update → prompts user to enter new balance (single field, instant)

---

## 8. Dark Mode / Premium Feel

### Design Philosophy
Falcly's default design surface is **dark mode.** Not as an option — as the primary identity. Light mode is clean and functional but dark mode is where the brand lives.

- Background: `#0A0A0A` (true black, not charcoal)
- Surface: `#141414` with `#1C1C1C` elevation
- Cards and tiles: `#1C1C1C` with `#2A2A2A` border
- Text: `#F0F0F0` primary, `#888888` secondary

### What Makes Premium Dark Work
- **No pure white surfaces** — everything is layered dark with subtle elevation
- **Sparse use of color** — only the status colors (SAFE/CAUTION/RISKY) and the falcon amber accent break from monochrome
- **Typography contrast** — DM Sans Bold headlines on true black create a sharp, crisp feel
- **No heavy drop shadows** — use elevation via background color difference, not shadows
- **Subtle borders** — `#2A2A2A` border on cards and surfaces; not chunky borders

### Status Colors on Dark Backgrounds
SAFE (`#2ECC71`), CAUTION (`#F39C12`), RISKY (`#E74C3C`) are fully saturated — intentionally so. They need to pop on `#0A0A0A`. Do not mute or soften status colors in dark mode.

On light backgrounds: same hex values remain legible but add a 10% opacity background tint in the corresponding status color for the badge container (e.g., emerald badge on light emerald background pill).

### References
- **Cash App:** True black background, minimal color, white text hierarchy — closest to Falcly's intended aesthetic
- **Robinhood:** Premium dark with green as the signature status color — reinforces that a single accent color can become brand identity
- **Revolut:** Layered dark surfaces, micro-animations on data load — borrow the surface elevation; avoid the animation complexity

### Light Mode
- Background: `#F8F9FA` (off-white, not pure white — reduces eye strain)
- Surface: `#FFFFFF`
- Primary text: `#0D0D0D`
- Same status colors — fully saturated, legible on white

---

## 9. Notifications & Alerts

### Notification Hierarchy
Notifications must earn their place. Users get maximum 2 per day unless something is genuinely urgent.

| Event | Timing | Copy |
|-------|--------|------|
| Statement approaching | 7 days before | "BPI Petron closes in 7 days. ₱14,200 projected." |
| Statement approaching | 2 days before | "CAUTION: BPI Petron closes in 2 days. Review before swiping." |
| Due date reminder | 5 days before | "BPI Petron due in 5 days. ₱14,200 to pay." |
| Due date reminder | 1 day before | "BPI Petron due tomorrow. Don't forget to pay." |
| Data stale | 5 days no update | "Your BPI balance is 5 days old. Update for accurate status." |
| Payoff milestone | On crossing 50% | "You're halfway through paying off UB Rewards. ₱9,000 to go." |
| Subscription incoming | 2 days before | "Netflix ₱619 hits your BPI card in 2 days." |

### Copy Rules
- Lead with the card name — users with 4+ cards need context immediately
- Include the key number — don't make them open the app to find out what the number is
- No emoji in notification bodies (use sparingly in titles at most)
- Actionable: if there's something to do, say it. "Review before swiping" > "Be careful today"
- Never push a SAFE status — only push when there's a reason to act

### Notification Settings (in-app)
Single toggle list per card:
- Statement reminders: On/Off + timing (7 days / 3 days / 1 day)
- Due date reminders: On/Off + timing
- Subscription alerts: On/Off
- Staleness warnings: On/Off
- Milestones: On/Off

---

## 10. Empty States & Error States

### No Cards Added
Full-screen empty state — not a sad illustration, a clear invitation:
```
[Falcon icon — amber on black]
"No cards yet."
"Add your first card to see if it's safe to swipe."
[+ Add Card — primary CTA button]
```
No tutorial, no tour, no lengthy explanation. The CTA is clear.

### Stale Data Warning
Inline, not full-screen. Amber banner below the status card:
```
⚠️ Balance last updated 6 days ago.
This status may not reflect recent charges. [Update now]
```

### RISKY State (All Cards Red)
When every card is RISKY: don't hide it, don't soften it. Show:
```
[Full crimson accent header strip]
"All cards are RISKY right now."
[Card 1: RISKY — 1 day to statement]
[Card 2: RISKY — over 80% utilization]
[Card 3: RISKY — can't cover minimum payment]

"Consider waiting, or using cash for this purchase."
```
No panicking tone. Direct, factual, actionable.

### No Internet / Offline State
Falcly is local-first. All core calculations run on device. Offline state **never blocks the home screen or status views.** The only features requiring connectivity:
- Account sync (if implemented)
- Cloud backup restore

Offline indicator: small `📵 Offline` chip in the header — non-blocking, informational only. App continues to function fully.

### Loading States
Because all math is local, screens should load near-instantly. If async operations occur (e.g., fetching bank logos): use skeleton screens — not spinners. Skeleton placeholders should match the exact layout of the loaded state.

---

## 11. PH-Specific UX Considerations

### Currency Formatting
- Symbol: `₱` (Philippine Peso sign, U+20B1) — prefix, no space: `₱5,000`
- Thousands separator: comma — `₱1,500` not `₱1500` not `₱1.500`
- Decimals: omit unless necessary — `₱1,500` not `₱1,500.00`
- Large amounts: `₱1.2M` shorthand acceptable in compact views; full number in detail screens
- Negative/carried amounts: `−₱3,500` (use minus, not hyphen)

### Multiple Cards Culture
PH users often carry 4-6 cards (gasoline card, grocery card, travel card, main card). Design for this reality:
- Home screen must be legible with 5+ cards — the list view scales, the hero carousel does not
- Card naming should support nicknames: "BPI Petron" > "BPI credit card ending in 4521"
- Sorting: by urgency (closest statement) by default, not by date added

### Android-First (85% of PH)
- Use **Material Design 3** components as the foundation — familiar patterns reduce cognitive load
- Custom design language sits on top of MD3 — branding is applied through color tokens and typography, not by rebuilding components from scratch
- Bottom navigation bar (Android convention) not tab bar (iOS convention)
- Back button behavior must conform to Android system back — no iOS-only swipe-back patterns
- Test on mid-range devices: Samsung Galaxy A series, Realme, Xiaomi — these are the actual PH market

### Performance on Low-End Devices
- No heavy physics-based animations — use simple fade/translate, 200ms max
- No lottie files on the critical path (home screen) — SVG or static assets only
- Lazy-load card detail screens — home screen must render in <300ms
- Gantt/timeline view: render visible range only, virtualize off-screen items
- Images: use WebP with fallback, lazy load bank logos

---

## 12. Accessibility

### Status Indicators: Never Color Alone
SAFE / CAUTION / RISKY must convey meaning through **three channels simultaneously:**
1. **Color** — Emerald / Amber / Crimson (primary)
2. **Icon** — ✓ check / ⚠ warning triangle / ✕ stop (secondary)
3. **Text label** — "SAFE" / "CAUTION" / "RISKY" in DM Sans Bold (tertiary)

Users with deuteranopia (red-green colorblindness, ~8% of males) cannot reliably distinguish the green/amber pair without the icon and text.

### Tap Target Sizes
- Minimum tap target: 48×48dp (Android Material minimum)
- Preferred: 56×56dp for primary actions (status card tap, CTA buttons)
- List rows: minimum 56dp height
- Inline links (e.g., "Update now"): extend tap target to full row width

### Text Sizing
- Body text minimum: 14sp — do not go smaller
- Caption/label text: 12sp minimum, only for non-critical information
- Respect system font scaling — do not lock font sizes; use `sp` units throughout

### Screen Reader Support
- All status badges: accessibility label includes status + reason: `"SAFE — 18 days to statement, 28% utilization"`
- Card rows: accessible name includes bank + status + key metric: `"BPI Petron credit card, CAUTION, 4 days to statement"`
- Charts and timelines: provide text equivalents for all visual-only data
- Interactive elements: role and state described (`role="button"`, `state="disabled"` when appropriate)

### Reduce Motion
Respect the system `Reduce Motion` setting. When enabled: disable all transitions except instant fade (no slide, no spring animations).

---

## 13. Design System Summary

| Element | Spec |
|---------|------|
| Primary font | DM Sans (headlines) / Inter (body) |
| Data font | JetBrains Mono (numbers, amounts) |
| Status colors | Emerald `#2ECC71` / Amber `#F39C12` / Crimson `#E74C3C` |
| Accent | Falcon amber `#F5A623` |
| Dark bg | `#0A0A0A` (true black) |
| Dark surface | `#141414` / `#1C1C1C` |
| Light bg | `#F8F9FA` |
| Light surface | `#FFFFFF` |
| Border radius | 12dp (cards) / 8dp (inputs) / 24dp (badges/pills) |
| Min tap target | 48dp |
| Animation max | 200ms, ease-out |
| Currency format | ₱X,XXX (no decimals in compact views) |
| Status indicator | Color + Icon + Text always |
| Component base | Material Design 3 tokens, custom skin |

---

*Sources: Falcly discovery documents (00-BRIEF, 11-BRANDING, 13-DECISION-LOGIC), competitive analysis of Monzo / Revolut / N26 / Cash App / Robinhood / Revolut, Android Material Design 3 guidelines, WCAG 2.1 AA accessibility standards, PH fintech market context.*
