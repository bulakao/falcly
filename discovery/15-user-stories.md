# Falcly — User Stories, Scenarios & Onboarding

> **Date:** 2026-03-31
> **Source:** Extracted from onboarding.md
> **For:** Product, design, and engineering reference

---

## Features Derived from User Stories and Personas

The following features are directly inferred from the user stories and personas below:

- **Credit Card Decision Engine:** Calculates SAFE/CAUTION/RISKY status per card and planned spend, factoring in utilization, timing, cash on hand, and installments.
- **Planned Purchase Simulation:** Input a planned spend → see projected balance, utilization, and bill impact before committing.
- **Multi-Card Comparison and Ranking:** All cards displayed and ranked by risk level, utilization, statement timing; sortable and filterable.
- **Best Card Recommendation:** Highlights optimal card considering utilization, payment window, foreign fees, and rewards.
- **Statement Cycle Awareness:** Calculates days to statement per card; flags timing risks near cutoff.
- **Installment Tracking:** Tracks monthly installment obligations per card; factors into risk calculation; shows total commitments.
- **AI-Assisted Statement Parsing:** Auto-detects installments and fees from SMS/email statements (Phase 2).
- **Affordability Checks:** Considers estimated cash on hand; escalates risk if projected balance exceeds cash.
- **Reminders and Notifications:** Proactive alerts before statement dates, utilization threshold changes, and risk escalations.
- **Simple, Actionable Advice:** Clear SAFE/CAUTION/RISKY with jargon-free language and icons.
- **Onboarding and Education:** Demo mode, onboarding tips, credit concept education for new users.
- **International Card Optimization:** Foreign fee tracking; recommends best card for international purchases.
- **Minimal Input for Quick Answers:** Instant advice with minimal data entry — for emergency/occasional users.
- **Personalization:** Notification preferences, primary card selection, personalized tips.
- **Scenario Testing and Edge Case Handling:** Zero balance, over-limit, multiple currencies, data gaps.
- **Fast Load and Response:** Optimized for instant answers at key user moments.
- **Analytics and Insights:** Spending trends, credit health summaries, anonymized usage to refine decision engine.
- **Pro/Pro+ Features:** Unlimited cards (Pro), advanced AI parsing (Pro+).

---

## Onboarding Principle

**Goal:** Show value in 60 seconds.

**Flow:**
1. Demo first
2. Simulate swipe
3. Show decision
4. Then ask to add card

Users must see the SAFE/CAUTION/RISKY output before being asked to set anything up.

---

## Scenario Testing

Seven core scenarios the engine must handle correctly:

| # | Scenario | Expected Output |
|---|----------|----------------|
| 1 | After statement (fresh cycle, low balance) | SAFE |
| 2 | Near statement date (within 2–5 days) | CAUTION or RISKY |
| 3 | High utilization (>80%) | RISKY |
| 4 | Low cash (projected balance exceeds estimated cash) | Escalate to RISKY |
| 5 | Multi-card — pick best | Rank by utilization + days to statement |
| 6 | Installment-heavy card | CAUTION |
| 7 | Pre-statement zero balance | CAUTION (timing risk even with no balance) |

---

## User Stories

Organized by persona. Each story includes acceptance criteria and an example scenario.

---

### Everyday Credit Card User

**Know when to use my card**
- *Context:* Users want to know if they should use their card right now to avoid high bills and payment stress.
- *Acceptance Criteria:*
  - User inputs planned spend and current card info.
  - App provides clear SAFE/CAUTION/RISKY status based on utilization and timing.
  - User understands the impact on their next bill.
- *Example:* Maria wants to buy a laptop. She enters the price and checks if using her card now is safe. The app shows CAUTION — close to statement date and utilization is high.

**Simulate purchases**
- *Context:* Users want to see the impact of a planned purchase before committing.
- *Acceptance Criteria:*
  - User inputs a planned spend amount.
  - App calculates projected balance and utilization.
  - Shows resulting status and bill impact.
- *Example:* Lisa simulates a $200 purchase. App shows updated balance and CAUTION status due to nearing statement date.

---

### Multi-Card Optimizer

**Know which card to use**
- *Context:* Users with multiple cards want to optimize timing and utilization.
- *Acceptance Criteria:*
  - User views all cards ranked by risk level.
  - App highlights best card given planned spend with rationale (utilization, payment window).
- *Example:* John has three cards. App ranks them and recommends the one with lowest utilization and longest payment window.

**Compare all my cards instantly**
- *Context:* Users want to quickly see all cards' statuses without manual calculations.
- *Acceptance Criteria:*
  - App displays all cards with SAFE/CAUTION/RISKY status in one view.
  - Allows sorting by utilization or days to statement.
- *Example:* Alex opens the app and sees all his cards ranked for quick choice.

**Avoid bad timing**
- *Context:* Users want to avoid using cards near statement dates.
- *Acceptance Criteria:*
  - App calculates days to statement per card.
  - Flags CAUTION within 5 days, RISKY within 2 days.
- *Example:* Nina's statement date is in 1 day. App marks the card as RISKY.

---

### Budget-Conscious User

**Know if I can afford this purchase**
- *Context:* Users want to ensure they can pay their bill to avoid debt.
- *Acceptance Criteria:*
  - App considers estimated cash on hand.
  - Escalates risk if projected balance exceeds cash.
  - Provides affordability warning.
- *Example:* Mark's projected balance after planned spend exceeds his cash. App flags RISKY and warns about potential debt.

**Avoid high utilization**
- *Context:* Users want to keep utilization within safe limits.
- *Acceptance Criteria:*
  - App calculates utilization percentage.
  - Warns at >60% (CAUTION), >80% (RISKY).
  - Suggests alternative cards if available.
- *Example:* Sarah's purchase would push utilization to 85%. App marks RISKY and suggests switching cards.

---

### Installment User

**Track my installments**
- *Context:* Users want to know their monthly installment obligations to avoid overcommitting.
- *Acceptance Criteria:*
  - App sums monthly installment amounts per card.
  - Displays total obligations.
  - Factors installments into risk calculation.
- *Example:* Tom has ongoing installments totaling $150/month. App shows this amount and adjusts risk accordingly.

**Detect hidden installment commitments**
- *Context:* Users want automatic installment detection from statements.
- *Acceptance Criteria:*
  - App parses SMS/email statements for installment info using AI.
  - Updates installment obligations automatically.
- *Example:* Emma receives an SMS statement. App detects a new 6-month installment plan and updates her obligations. *(Phase 2)*

---

### Passive / Busy User

**Remind me when it matters**
- *Context:* Users want reminders before statement dates or risky usage without constantly checking the app.
- *Acceptance Criteria:*
  - App sends reminders before statement dates.
  - Alerts when utilization or risk status changes to CAUTION or RISKY.
- *Example:* Daniel receives a notification 3 days before statement date warning about high utilization.

**Just tell me what to do**
- *Context:* Users want a clear, simple answer without analyzing numbers.
- *Acceptance Criteria:*
  - App provides clear SAFE/CAUTION/RISKY using simple language and icons.
- *Example:* Olivia opens app and sees a big green checkmark: "You're good to use this card."

---

### Frequent Traveler

**Know best card for international use**
- *Context:* Travelers want to identify cards with lowest foreign transaction fees.
- *Acceptance Criteria:*
  - App includes foreign fee attributes per card.
  - Recommends best card for international spend.
- *Example:* Raj plans a trip abroad. App suggests his no-foreign-fee card with highest credit limit.

**Track foreign transaction fees**
- *Context:* Users want to monitor fees incurred on foreign purchases.
- *Acceptance Criteria:*
  - App tracks and reports foreign transaction fees per card.
- *Example:* Mia reviews last month's foreign fees and decides to switch cards.

---

### New Credit User

**Understand credit limits and bills**
- *Context:* New users need education on how credit limits and billing cycles work.
- *Acceptance Criteria:*
  - App provides onboarding tips explaining credit terms.
  - Shows impact of purchases on bills clearly.
- *Example:* Kevin, a new cardholder, uses the demo to learn how statements and payments work.

**Learn safe usage habits**
- *Context:* Users want to build good credit habits from the start.
- *Acceptance Criteria:*
  - App encourages usage within safe limits.
  - Provides tips for avoiding debt.
- *Example:* Anna receives a CAUTION alert with a tip to keep utilization below 60%.

---

### High Spend Planner

**Plan large purchases without risk**
- *Context:* Users planning big expenses want to avoid triggering risky status.
- *Acceptance Criteria:*
  - App allows input of large planned spend.
  - Suggests best timing and card to minimize risk.
- *Example:* Brian plans to buy a TV. App suggests waiting until after statement date to avoid high utilization.

**Manage installment plans carefully**
- *Context:* Users want to distribute large payments over installments safely.
- *Acceptance Criteria:*
  - App tracks installment schedules and totals.
  - Warns if combined installments exceed safe limits.
- *Example:* Chloe plans two installment purchases. App flags combined obligations exceeding 50% utilization.

---

### Emergency / Occasional User

**Get quick advice for rare usage**
- *Context:* Users who rarely use credit cards want fast, simple advice when needed.
- *Acceptance Criteria:*
  - App provides instant risk status with minimal input.
  - Does not require setup or complex data entry.
- *Example:* Sam needs to use his card once. He opens the app, inputs amount, and immediately sees SAFE or RISKY.

**Avoid risk when funds are low**
- *Context:* Users want to prevent overspending when cash is limited.
- *Acceptance Criteria:*
  - App considers user's cash and flags risky usage.
- *Example:* Lily has little cash. App warns against a planned purchase that would lead to debt.

---

## Anti-Stories (What Users Do NOT Want)

- Manual expense tracking
- Complex financial dashboards
- Inputting every transaction
- Delayed value (setup-heavy apps)
- Generic, vague advice

**Implication:** Must feel instant, simple, and actionable.

---

## Key Moments (User Triggers)

These are the exact moments when users will open the app:

1. Before making a purchase
2. When bill feels unexpectedly high
3. Near statement date
4. After receiving salary
5. When choosing between cards

**Implication:** App must load fast and answer immediately.

---

## Edge Cases by Persona

### Everyday Credit Card User
- Planned purchase exactly at 60% threshold → CAUTION with explanation
- Planned purchase on statement date (0 days) → RISKY, immediate billing impact warning
- Spend pushes utilization >80% but user has high cash → CAUTION (not RISKY); cash buffer acknowledged

### Multi-Card Optimizer
- Multiple cards with identical utilization and timing → break tie by lowest foreign fee or highest limit
- One card near statement but low utilization; another far from statement but high utilization → rank lower-utilization card higher, flag timing trade-off
- Planned spend exceeds credit limit on all cards → RISKY on all; suggest reducing spend or splitting payment

### Budget-Conscious User
- Cash is zero or negative → RISKY with critical affordability warning
- Planned spend jumps from SAFE to RISKY in one step → RISKY with clear utilization impact explanation
- All alternative cards also have high utilization → suggest waiting or reducing spend rather than switching

### Installment User
- New installment pushes monthly total above 50% of credit limit → CAUTION or RISKY with overload warning
- Installment plans with varying end dates → forecast installment impact over coming months, highlight risk periods
- Statement parsing fails to detect an installment → allow manual input, flag missing data for user review

### Passive / Busy User
- User ignores reminders and risk worsens from CAUTION to RISKY → escalate notification urgency, offer quick action
- User opens infrequently but inputs large spend → immediate clear status, simple guidance
- User wants alerts for primary card only → respect notification preferences, filter alerts

### Frequent Traveler
- International purchase near statement date with foreign fees → CAUTION/RISKY, fee impact highlighted
- Multiple cards with varying foreign fees but similar utilization → recommend lowest-fee card even if utilization slightly higher (within SAFE)
- Foreign fee data missing or outdated → flag data gap, advise user to verify card details

### New Credit User
- No credit history or zero balance → SAFE with credit-building tips
- Planned spend exceeds credit limit due to misunderstanding → RISKY with clear credit limit explanation
- Repeated CAUTION alerts without understanding → jargon-free explanation and actionable tips

### High Spend Planner
- Large purchase spanning multiple billing cycles → suggest optimal timing and installment options
- Combined installments plus new spend exceed safe utilization → RISKY, recommend delay or split
- Multiple large installment plans simultaneously → flag cumulative risk, suggest prioritization

### Emergency / Occasional User
- Minimal data input (amount only) → instant status based on defaults or last known data
- Limited cash, emergency purchase → RISKY with urgent warning and alternatives
- Stale data (infrequent user) → prompt for quick refresh before decision
