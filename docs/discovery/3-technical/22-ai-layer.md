# Falcly — AI Layer

> **Date:** 2026-03-30
> **For:** Falcly discovery — AI strategy and implementation roadmap

---

## Executive Summary

Falcly's AI strategy is built on a simple principle: **AI serves the engine, never replaces it.** The deterministic SAFE/CAUTION/RISKY engine is always the source of truth — AI's job is to reduce manual data entry friction and add intelligent context on top of those outputs. In Phase 1 (MVP), there is zero AI — the entire product runs on pure math, building user trust before introducing any "magic." Starting Phase 2, AI enters as a data extractor: reading bank SMS notifications, email statements, and receipt photos so users don't have to type every transaction. In Phase 3, AI evolves into a decision enhancer — calculating a personalized safe spending ceiling, suggesting which card to use for maximum reward, and detecting subscription drift. Phase 4 introduces a conversational advisor — natural language queries like "Can I pay my Netflix today?" answered instantly, on-device if the hardware supports it. Privacy is non-negotiable throughout: all core data stays local (SQLite), AI processing runs on-device whenever possible, and every AI feature requires explicit user opt-in. The Philippines' Data Privacy Act (RA 10173) compliance is baked in, not bolted on.

---

## 1. Two-Layer Architecture

### Layer 1 — The Deterministic Engine (Always On)

The SAFE/CAUTION/RISKY engine is pure math. Given the same inputs, it always produces the same output. No probabilistic inference, no pattern matching, no model drift. It runs entirely offline.

```
Inputs: balance, credit limit, pending transactions, installments,
        subscriptions, statement day, due day, net available cash,
        income timing, payoff strategy

Output: SAFE / CAUTION / RISKY + reason + projected interest cost
```

This engine is what users trust. It's what they open the app for. It must never be wrong in a way that surprises them.

### Layer 2 — The AI Layer (Opt-In Augmentation)

AI enters the stack in two roles:

| Role | What it does | When it runs |
|------|-------------|--------------|
| **Data Extractor** | Reads SMS/notifications, emails, receipt photos → structured data | Phase 2 |
| **Decision Enhancer** | Contextual ceiling, cross-card optimization, timing advice, anomaly flags | Phase 2–3 |
| **Conversational Advisor** | Natural language Q&A, spending pattern recognition, payoff coaching | Phase 3–4 |

### Why the Separation Matters

**Trust:** Users must trust SAFE/CAUTION/RISKY completely. If an AI model occasionally outputs "SAFE" when it shouldn't, the product is broken. Deterministic math doesn't drift; ML models do.

**Predictability:** A user who enters their balance and checks status gets the same answer every time. No surprises, no hallucinations.

**Offline capability:** Core functionality must work without internet. PH users frequently have patchy connectivity. AI features gracefully degrade — the engine never does.

**Regulatory posture:** Under RA 10173, AI processing of financial data requires informed consent. By making Layer 1 AI-free, Falcly can comply fully for all users, with opt-in consent unlocking Layer 2 features.

### The Golden Rule

> **AI can suggest. Only math can decide.**

If AI-derived data (extracted balance, detected subscription) feeds into the engine, the user must confirm it before it affects the SAFE/CAUTION/RISKY output. AI pre-fills; humans approve.

---

## 2. Phase 1 — No AI (MVP)

The MVP is intentionally AI-free. This is a strategic choice, not a limitation.

**What the MVP does:**
- Manual card entry (balance, limit, statement day, due day)
- Manual installment entry
- Manual subscription tracking
- Deterministic SAFE/CAUTION/RISKY output
- Best card recommendation (pure scoring algorithm)
- Payoff timeline projections

**Why manual entry is acceptable at MVP:**
- PH users are accustomed to manual tracking (spreadsheets, notebooks, noting statements)
- No privacy permissions required — lowest friction onboarding
- Zero risk of extraction errors affecting the trust signal
- Establishes the core habit before introducing automation

**What MVP teaches:**
- Which data fields users actually update vs. ignore
- How often users check the app
- Whether SAFE/CAUTION/RISKY is the right framing (user research opportunity)
- Pain points around manual entry → informs Phase 2 priority

**Phase 1 success criteria before adding AI:** 1,000 active users, 60%+ weekly retention, consistent manual updates observed in analytics.

---

## 3. Phase 2 — AI as Data Extractor

### 3a. SMS/Notification Parsing (Android)

**Why this matters:** PH banks are aggressive SMS notifiers. BDO, BPI, Metrobank, Maya, and GCash all send transaction SMS notifications on every debit. These contain everything Falcly needs: amount, merchant, card last 4 digits, transaction type.

#### Android API Options

| Approach | API | Play Store Policy | Feasibility |
|----------|-----|-------------------|-------------|
| **Notification Listener** | `NotificationListenerService` | ✅ Allowed — reads push notifications | **Recommended** |
| **SMS Reader** | `READ_SMS` permission | ⚠️ Restricted — requires default SMS app designation or Play approval for financial apps | Complex approval path |
| **SMS Retriever** | `SmsRetriever` API | ✅ Allowed — but for OTPs only (app-specific hash required) | Not applicable |

**Recommended approach: `NotificationListenerService`**
- Reads bank push notifications (not SMS body directly)
- No Play Store special permission declaration required
- User grants permission in Android Settings → Notification Access
- PH banks send both SMS and push notifications for transactions — notification listener captures both

**Android 15 caveat:** As of Android 15, the OS applies sensitive data detection to notifications — transactions containing amounts may be flagged as "sensitive" and blocked from delivery to `NotificationListenerService` for some devices. Testing on specific PH bank apps required. Fallback: prompt user to screenshot/photograph statement (see OCR below).

#### What Can Be Extracted from PH Bank Notifications

| Bank | Notification Format | Extractable Fields |
|------|--------------------|--------------------|
| **BDO** | "BDO: Your BDO Mastercard ending 1234 was used for PHP 2,500.00 at Mercury Drug..." | amount, card last 4, merchant, timestamp |
| **BPI** | "BPI: A purchase of PHP 1,850.00 was charged to your BPI card ending 5678 at SM Supermarket" | amount, card last 4, merchant |
| **Metrobank** | "Metrobank: PHP 3,200 deducted from card ending 9012 at Jollibee Ayala" | amount, card last 4, merchant |
| **Maya** | "Maya: Payment of PHP 450 sent to 7-Eleven" | amount, merchant, transaction type |
| **GCash** | "GCash: You sent PHP 1,200 to Juan Dela Cruz" | amount, recipient, transaction type |

**Extraction approach:** Regex-based parser per bank format (deterministic, not ML). Each bank has a consistent notification template. Library of regex patterns, one per bank, version-tracked as bank formats evolve.

**What can be inferred but not directly extracted:**
- Installment detection: amount exactly divisible by known installment terms → flag for user confirmation
- Transaction type (purchase vs. payment): keyword matching ("charged", "sent", "payment received")

**Privacy:** All parsing happens on-device. Notification text is never transmitted to any server. Extracted structured data (amount, merchant, card) stored in local SQLite only.

#### Recommended Libraries / Approach

- **React Native:** `react-native-notifications` or Expo Notifications for notification access
- **Custom native module** required for `NotificationListenerService` — not available via Expo Go
- **Parser:** Pure TypeScript regex patterns, bank-specific, unit-tested against real notification samples
- **Open-source reference:** `bank-sms-parser` (GitHub: various PH developers have shared BDO/BPI parsers) — validate and adapt

---

### 3b. Email/Statement Parsing

**Use case:** User connects Gmail → Falcly reads monthly credit card statements to extract balance, due date, minimum due, and installment details.

#### Integration Options

| Method | Auth | What's Accessible | Privacy |
|--------|------|-------------------|---------|
| **Gmail API (OAuth)** | Google OAuth 2.0 | Full email body, attachments | Cloud API — data leaves device |
| **Outlook/Microsoft Graph** | Microsoft OAuth | Same | Cloud API |
| **IMAP (direct)** | Email/password or OAuth | Full inbox | Can run server-side |

**What PH bank statement emails contain:**

| Field | BDO | BPI | Metrobank |
|-------|-----|-----|-----------|
| Statement balance | ✅ | ✅ | ✅ |
| Minimum amount due | ✅ | ✅ | ✅ |
| Due date | ✅ | ✅ | ✅ |
| Transaction list | ✅ (PDF attachment) | ✅ (inline + PDF) | ✅ (PDF) |
| Installment breakdown | ⚠️ Partial | ✅ | ⚠️ Partial |

**Recommended approach:**
1. OAuth Gmail integration (Phase 2 P1 feature)
2. Email body parsing for key fields (statement balance, due date, minimum due)
3. PDF attachment parsing for transaction list (if user opts in to full statement import)
4. **Privacy model:** OAuth token stored encrypted locally; email bodies fetched on-demand, parsed on-device using string extraction, never stored raw

**Technical implementation:**
- Gmail API: `gmail.readonly` scope (minimum required)
- Parser: Bank-specific regex + LLM extraction fallback for unrecognized formats
- Library: `googleapis` (Node.js/React Native via bridge) or Expo native module

---

### 3c. Receipt/Screenshot OCR

**Use case:** User photographs a bank statement, receipt, or ATM slip. Falcly extracts structured data.

#### On-Device Options

| Library | Platform | Accuracy | Privacy | Cost |
|---------|----------|----------|---------|------|
| **Google ML Kit Text Recognition v2** | Android | High | ✅ On-device | Free |
| **Apple Vision Framework** | iOS | High | ✅ On-device | Free |
| **Tesseract (react-native-tesseract-ocr)** | Both | Medium | ✅ On-device | Free |
| **Google Cloud Vision API** | Both (cloud) | Very High | ❌ Cloud | $1.50/1K images |
| **AWS Textract** | Both (cloud) | Very High | ❌ Cloud | $1.50/1K pages |

**Recommendation:** ML Kit (Android) + Apple Vision (iOS) for on-device. Cloud OCR as fallback for complex statements only, with explicit user consent per scan.

**What OCR can extract from bank statements:**
- Current balance, available balance
- Statement date, due date
- Minimum amount due
- Transaction list (amount, date, merchant description)
- Installment summary lines

**Structured extraction pipeline:**
```
Photo → ML Kit OCR → Raw text → Bank-specific parser → Structured fields
                                      ↓
                              [Amount: ₱18,500]
                              [Due: April 20]
                              [Minimum: ₱950]
                              → User confirms → Updates engine input
```

**UX:** Present extracted fields as a review card — "We found this. Confirm?" — before any data enters the engine. Never auto-update without user approval.

---

## 4. Phase 2 — AI as Decision Enhancer

### 4a. Contextual Spend Ceiling

The deterministic engine outputs SAFE/CAUTION/RISKY but doesn't tell the user how much more they can spend safely. This is the AI enhancement.

**Calculation logic:**

```
days_left_in_cycle = statement_date - today
daily_safe_rate = (net_available_cash - current_projected_balance) / days_left_in_cycle
safe_ceiling = daily_safe_rate × days_left_in_cycle × safety_factor (0.8)

# Personalized adjustment:
if income_arrives_before_due: safe_ceiling += income_multiplier
if committed_expenses_high: safe_ceiling -= expense_buffer
```

**Output:** "You're SAFE. Based on your cash position and cycle timing, you can spend up to ₱4,200 more this cycle before risking a CAUTION status."

This is deterministic math dressed up as personalization — no ML required. The "AI" here is the combination of user-specific inputs producing a tailored number rather than a generic threshold.

---

### 4b. Cross-Card Optimization

**Reward category matching:**

| Card Type | Best Category | MCC Codes |
|-----------|--------------|-----------|
| Visa Signature (BPI) | Dining | 5812, 5813, 5814 |
| BDO Rewards | Supermarkets | 5411, 5912 |
| RCBC (cashback) | Everything | No restrictions |
| UnionBank Cashback | Fuel | 5541, 5542 |

**Implementation:** Maintain a local MCC category map. When user asks "which card?", match merchant category to each card's highest-earning category, then filter by SAFE status.

**0% installment opportunity detection:**
- Cross-reference transaction merchant against known BDO/BPI/RCBC partner merchant list
- Surface: "BDO has 0% installment at this merchant. You could convert this to 6 months for ₱833/month."
- Merchant list: maintained as a local JSON, updated with app updates

**Balance spreading logic:**
- When user has multiple SAFE cards, suggest spreading large purchases across cards to maintain lower utilization per card
- Rule: if single card would exceed 30% utilization, suggest splitting across 2 cards

---

### 4c. Timing Advice (Statement Date Arbitrage)

**The insight:** A purchase made 1 day before statement close lands on this month's bill. The same purchase made 1 day after statement close gives you a full month + grace period before it's due.

**Logic:**

```
if days_to_statement <= 2:
  advice = "Wait {days_to_statement + 1} days — this charge moves to next month's bill.
            You gain {grace_period_days} days before payment is due."
  estimated_float_value = proposed_amount × monthly_rate × (grace_period_days / 30)
  advice += "Interest-free float value: ₱{estimated_float_value}"
```

**Output example:** "Wait 2 days and this ₱8,000 charge lands on next month's bill — giving you 45 days before it's due instead of 13. Your interest-free float is worth ₱96 in liquidity."

This is a high-value insight that no competitor provides. Purely deterministic — just timing awareness.

---

### 4d. Anomaly Detection

**Approach:** Lightweight statistical detection, no ML required for Phase 2.

**Signals to detect:**

| Anomaly Type | Detection Method | Response |
|-------------|-----------------|----------|
| Balance spike | `new_balance > rolling_avg_balance × 1.5` | "Your BPI balance jumped ₱12,000 — unusual vs. your recent cycles. Verify?" |
| Unusual transaction amount | `amount > 2× avg_transaction` | "This ₱18,500 charge is larger than usual for this card. Confirm?" |
| Subscription price increase | `new_amount > last_amount × 1.05` | "Netflix charged ₱619 — up from ₱549 last month. Price increase detected." |
| Duplicate charge detection | Same amount + same merchant within 48h | "Possible duplicate: ₱2,500 at SM Supermarket charged twice in 24 hours." |

**What anomaly detection does NOT do:**
- Replace bank fraud detection (banks have far more signal)
- Take any action automatically
- Contact anyone on the user's behalf

All anomalies are surfaced as questions/confirmations, never as alarms.

---

## 5. Phase 3 — AI as Conversational Advisor

### 5a. Natural Language Queries

**Target queries:**
- "Can I use my BPI card for groceries today?"
- "Which card for a ₱20,000 appliance purchase?"
- "How long until I'm debt-free at ₱10,000/month?"
- "When's the best time to buy a new phone?"
- "Which card has the lowest balance right now?"

**On-Device LLM Options (2026 state):**

| Model | Size | Platform | Availability | Notes |
|-------|------|----------|-------------|-------|
| **Gemini Nano** | ~1.8B | Android | Pixel 9+, Samsung S25 (AICore) | Via ML Kit GenAI APIs; May 2025 GA |
| **Phi-3 Mini** | 3.8B | Both | Side-loadable | Microsoft; good instruction following |
| **Llama 3.2 (1B/3B)** | 1–3B | Both | Open source | Meta; needs local inference runtime |
| **Apple Foundation Models** | ~3B | iOS | iOS 18.1+ (Apple Intelligence) | Via Core ML / Swift tooling |

**Recommendation for Phase 3:**
- **Android:** Gemini Nano via ML Kit GenAI API — official, no model download needed, free
- **iOS:** Apple Foundation Models (Apple Intelligence) for iOS 18.1+
- **Fallback (older devices):** API call to Claude/GPT — small structured prompt, fast, cheap (~$0.001/query)

**Architecture:**

```
User query (natural language)
  ↓
Intent classifier (on-device, lightweight)
  ↓
[Query type: card selection / payoff / timing / status]
  ↓
Fetch relevant data from local SQLite
  ↓
Construct structured prompt with user data
  ↓
On-device LLM (Gemini Nano / Apple FM) → response
  ↓
Deterministic validation: if response contradicts engine output → override with engine
  ↓
Display response + SAFE/CAUTION/RISKY badge (always shown)
```

**Latency targets:**
- On-device LLM: 200–800ms (Gemini Nano benchmarks on Pixel 9)
- API fallback: 1–3s (acceptable for conversational use)

**Privacy:** All user financial data stays local. If API fallback is used, only the anonymized prompt is sent (no card numbers, no full balances — only relative figures and context). User must opt in to API fallback explicitly.

---

### 5b. Spending Pattern Recognition

**Signals to detect after 60+ days of data:**

| Pattern | Detection Method | Insight Surfaced |
|---------|-----------------|-----------------|
| End-of-month heavy spending | `spending[days 25–31] > spending[days 1–10] × 1.5` | "You typically spend 40% more in the last week of the month." |
| Cycle-over-cycle balance growth | `this_cycle_balance > last_cycle_balance × 1.1` | "Your balance has grown 3 cycles in a row. You're spending more than you're paying." |
| Category spending drift | `category_spend_this_month > rolling_avg × 1.3` | "Dining spend is up 35% this cycle vs. your average." |
| Income timing sensitivity | Correlate large purchases with payday +/- 3 days | "You tend to make big purchases right after payday — cycle awareness helps here." |

**Data requirements:**
- 60 days minimum for basic patterns
- 90 days for reliable cycle-over-cycle comparisons
- All computed from local transaction history — no ML model required, just rolling statistics

---

### 5c. Subscription Auto-Detection

**From notification/SMS history, detect recurring charges:**

**Algorithm:**
```
1. Group transactions by merchant name (fuzzy match)
2. For each merchant with 2+ transactions:
   - Calculate inter-transaction intervals
   - If interval is consistent (±3 days) within 28–35 day or 364–366 day range:
     → Flag as probable monthly/annual subscription
   - Compute confidence score:
     confidence = consistency_score × recency_score × amount_stability_score
3. Surface to user only if confidence > 0.75
4. User confirms → added to subscription tracker
```

**Confidence scoring:**

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| Transaction count | 2 | 3–4 | 5+ |
| Interval consistency | ±7 days | ±5 days | ±2 days |
| Amount stability | >20% variation | 5–20% | <5% |

**Never auto-add.** Always: "We noticed Netflix appears to charge your BPI card monthly (₱619). Add to subscriptions?" — user taps confirm.

---

### 5d. Payoff Coaching

**Personalized debt payoff that adapts to actual cash situation:**

```
coaching_inputs = {
  total_balance: sum of all card balances,
  monthly_interest: sum of projected interest across cards,
  available_after_minimums: net_cash - sum(minimum_payments),
  payoff_strategy: user preference (avalanche/snowball/fixed),
  income_timing: payday relative to due dates
}
```

**Coaching outputs:**
- "At your current minimum payments, you'll be debt-free in 4 years and pay ₱48,000 in interest."
- "If you redirect ₱2,000/month from dining to your BDO card (highest rate), you save ₱18,000 and finish 18 months earlier."
- "Your BPI card closes in 6 days. Paying ₱5,000 now vs. after statement saves ₱150 in interest this cycle."

**Adaptation:** If user's cash situation changes (they update liquid cash), recalculate recommendations immediately. No static advice — the coaching is always current-state.

---

## 6. Privacy & Trust Architecture

### Data Residency

| Data Type | Phase 1 | Phase 2 | Phase 3 |
|-----------|---------|---------|---------|
| Card balances, limits | Local SQLite | Local SQLite | Local SQLite |
| Installments, subscriptions | Local SQLite | Local SQLite | Local SQLite |
| Notification text | N/A | Parsed on-device, raw text discarded | Same |
| Email statement body | N/A | Fetched + parsed on-device | Same |
| OCR images | N/A | Processed on-device, image discarded | Same |
| LLM queries (Phase 3) | N/A | N/A | On-device preferred; anonymized API fallback with opt-in |
| Aggregated/anonymized analytics | Optional opt-in | Optional opt-in | Optional opt-in |

### Consent Model

Every AI feature requires explicit opt-in:

1. **Notification listener:** System permission prompt + in-app explanation ("We read bank notifications to auto-update your balance. Nothing leaves your phone.")
2. **Gmail/email access:** OAuth consent screen + clear scope explanation
3. **OCR scanning:** Per-scan confirmation ("Scan this statement to extract your balance?")
4. **AI conversational advisor:** One-time opt-in with clear explanation of on-device vs. API fallback
5. **Analytics:** Separate opt-in, clearly optional, never bundled with core permissions

### PH Data Privacy Act (RA 10173) Compliance

| Requirement | Falcly Approach |
|-------------|----------------|
| Lawful basis for processing | Consent — explicit opt-in per feature |
| Data minimization | Extract only what's needed; discard raw source (SMS text, email body) |
| Purpose limitation | Financial tracking only; no advertising profiling |
| Data subject rights (access, correction, deletion) | Full data export + account deletion wipes all local data |
| NPC registration | Required for cloud features; Phase 1 (local-only) has lighter burden |
| Security safeguards | SQLite encrypted at rest (SQLCipher); biometric auth for app access |
| Third-party processors (if cloud AI used) | DPA with cloud AI provider required; included in privacy policy |

---

## 7. What AI Should Never Do

These are hard constraints, not guidelines:

1. **Override SAFE/CAUTION/RISKY.** The deterministic engine's output is final. AI can add context ("you have ₱4,200 of safe ceiling remaining") but cannot change the status badge.

2. **Make payment decisions automatically.** No auto-payments, no auto-confirmations, no "I went ahead and..." The user confirms every action.

3. **Require internet for core functionality.** SAFE/CAUTION/RISKY must work offline. AI features degrade gracefully — they disappear or show a "connect to enable" nudge, but never block the core.

4. **Access financial data without explicit, per-feature consent.** No blanket "allow all" onboarding that buries permissions. Each AI data source is a separate consent moment.

5. **Store raw sensitive data beyond parsing.** SMS text, email bodies, and receipt images are processed and discarded. Only the extracted structured fields are stored.

6. **Hallucinate financial figures.** If the AI advisor generates a number (e.g., interest projection), it must be derived from the deterministic engine's calculations, not generated by the LLM. LLM provides language; math provides numbers.

---

## 8. Competitive Landscape — AI in Personal Finance

### What Competitors Are Doing

| App | AI Features (2025–2026) | On-Device? | Billing Cycle AI? |
|-----|------------------------|------------|-------------------|
| **Monarch Money** | AI Assistant (GPT-based), AI Insights, Weekly Recap, receipt scanning, enhanced transaction categorization | ❌ Cloud | ❌ None |
| **Copilot** | AI transaction categorization (ML), adaptive budgets, spending intelligence (cloud ML) | ❌ Cloud | ❌ None |
| **YNAB** | No native AI in product; community-built MCP server for AI budget management; support chatbot (Forethought, 70% deflection) | N/A | ❌ None |
| **Rocket Money** | Subscription auto-detection (proprietary algorithm), bill negotiation AI | ❌ Cloud | ❌ None |
| **Cleo** | Conversational AI assistant, roast mode, spending personality | ❌ Cloud | ❌ None |
| **CardPointers** | Reward category optimization, card recommendations | ❌ Cloud | ❌ None |

### Key Observations

1. **No competitor uses AI for billing cycle intelligence.** Zero. None of the above apps understand statement dates, billing cycles, or cycle timing — which means their AI advice can be actively harmful (recommend spending when statement closes tomorrow).

2. **All competitor AI is cloud-dependent.** Monarch, Copilot, and Cleo send data to external servers. Falcly's on-device AI architecture is a genuine privacy differentiator.

3. **Monarch's AI assistant** (launched Dec 2025) answers budgeting questions but has no awareness of credit card cycles, statement timing, or installment commitments.

4. **Copilot's ML** excels at transaction categorization but has no payment intelligence layer.

5. **No PH-specific fintech app uses ML/AI meaningfully** for credit card intelligence. GCash and Maya have basic spend summaries; bank apps have zero AI.

6. **The gap Falcly owns:** Cycle-aware AI. Any advice that doesn't know what day of the billing cycle it is cannot be trusted for credit card timing decisions. Falcly's AI is built on top of the engine that knows exactly where you are in the cycle.

### The Falcly AI Differentiator

| Capability | Monarch | Copilot | Cleo | Falcly |
|-----------|---------|---------|------|--------|
| Billing cycle awareness | ❌ | ❌ | ❌ | ✅ |
| On-device AI option | ❌ | ❌ | ❌ | ✅ |
| SAFE/CAUTION/RISKY grounding | ❌ | ❌ | ❌ | ✅ |
| PH bank SMS/notification parsing | ❌ | ❌ | ❌ | ✅ |
| Installment intelligence | ❌ | ❌ | ❌ | ✅ |
| Local-first data | ❌ | ❌ | ❌ | ✅ |

---

## 9. Implementation Roadmap

### Phase Summary

| Phase | Timeline | AI Role | Key Features |
|-------|----------|---------|-------------|
| **1 — MVP** | Month 0–6 | None | Deterministic engine only, manual entry |
| **2 — Extractor** | Month 6–12 | Data extraction | Notification listener, email parsing, OCR |
| **3 — Enhancer** | Month 12–18 | Decision enhancement | Spend ceiling, pattern recognition, subscription auto-detection |
| **4 — Advisor** | Month 18+ | Conversational | NL queries, payoff coaching, on-device LLM |

### Detailed Phase 2 (Month 6–12): Notification Listener + Basic Extraction

| Feature | Effort | Privacy Level | Prerequisites |
|---------|--------|---------------|--------------|
| Android `NotificationListenerService` | Medium | ✅ On-device | Native module development |
| Bank notification regex parsers (BDO, BPI, Metrobank, Maya, GCash) | Medium | ✅ On-device | Notification listener |
| User confirmation UI for extracted data | Low | N/A | Notification listener |
| Gmail OAuth integration | High | ⚠️ Cloud auth | OAuth setup, email parser |
| Statement email parser | Medium | ✅ On-device parse | Gmail integration |
| ML Kit OCR receipt scanner | Medium | ✅ On-device | React Native native module |
| Subscription auto-detection (from notification history) | Medium | ✅ On-device | 60+ days of notification data |
| Balance spike anomaly detection | Low | ✅ On-device | Historical balance data |

### Detailed Phase 3 (Month 12–18): Pattern Recognition + Conversational

| Feature | Effort | Privacy Level | Prerequisites |
|---------|--------|---------------|--------------|
| Spending pattern analysis (rolling stats) | Medium | ✅ On-device | 60+ days transaction data |
| Contextual spend ceiling calculator | Low | ✅ On-device | Phase 1 engine |
| Cross-card reward optimization | Medium | ✅ On-device | MCC code database |
| Statement date arbitrage (timing advice) | Low | ✅ On-device | Phase 1 engine |
| Gemini Nano integration (Android) | High | ✅ On-device | ML Kit GenAI API |
| Apple Foundation Models integration (iOS) | High | ✅ On-device | iOS 18.1+, Apple Intelligence |
| API fallback for NL queries (Claude/GPT) | Medium | ⚠️ Anonymized cloud | User opt-in |
| Payoff coaching advisor | Medium | ✅ On-device | Phase 1 payoff engine |

### Phase 4 (Month 18+): Full Advisory Layer

| Feature | Effort | Notes |
|---------|--------|-------|
| Persistent conversational memory (on-device) | High | Local conversation history |
| Proactive nudges (cycle-aware) | Medium | "Statement closes in 2 days — check before you swipe" |
| Household/family card management AI | High | Multi-user, shared view |
| Bank API integration (when available in PH) | High | BSP Open Finance framework (pending) |
| iOS/Android widget with AI-powered status | Medium | On-device inference for widget |

---

## Actionable Recommendations

1. **Start Phase 2 with Android notification listener** — highest impact, lowest privacy friction, covers 85% of Falcly's target market (PH Android users).

2. **Build regex parsers per bank, not a universal ML parser** — PH bank formats are consistent enough that deterministic regex outperforms ML and never hallucinates transaction amounts.

3. **Use Gemini Nano via ML Kit GenAI API** for Phase 3 conversational features on Android — it's free, official, on-device, and Google is clearly investing in this path (May 2025 GA, August 2025 Pixel 10 update).

4. **Gate every AI feature behind an explicit in-app consent screen** — not just OS permissions. Users should understand what each AI feature does before enabling it. This is a trust differentiator, not a friction point.

5. **Make AI extraction non-blocking** — if notification listener isn't granted, the app still works perfectly. AI features are "nice to have" upgrades, never "must have" for core functionality.

6. **Validate extracted data before it touches the engine** — every AI-extracted field (balance, transaction amount, due date) is shown to the user as a draft before it enters SQLite and affects SAFE/CAUTION/RISKY.

7. **Monitor Android 15 notification sensitivity changes** — Google's sensitive data detection for financial notifications is an active issue (confirmed October 2024 developer reports). Build SMS fallback or screenshot OCR as backup.

8. **Defer LLM conversational advisor until 1,000+ active users** — the marginal value of "which card should I use?" NL query is lower than ensuring the core engine is trusted and used daily. Don't add complexity before depth.

---

*Sources: Android Developers Blog (Gemini Nano ML Kit GenAI APIs, May 2025, Aug 2025), developer.android.com (NotificationListenerService, Gemini Nano), r/androiddev (Android 15 notification sensitivity issue, Oct 2024), Google ML Kit Text Recognition v2, firebase.google.com (ML Kit text recognition), Monarch Money Help Center (AI Features, Feb 2026), Monarch Winter Release Blog (Dec 2025), Copilot Money Help Center (Intelligence for Spending), copilot.money (AI categorization), YNAB forethought.ai case study (2025), mcpmarket.com (YNAB MCP server), Rocket Money (subscription detection), arxiv.org (FinTech LLM differential privacy, Sep 2025), NimbleEdge (Gemini Nano on-device, 2025).*
