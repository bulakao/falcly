**Review the "Cash on Hand" concept in the Falcly codebase and recommend a clearer user-facing term.**

Falcly is a credit card billing cycle intelligence app. It has a concept called "cash on hand" (`cashOnHand` in `store/userStore.ts`) that works alongside `monthlyIncome`, `payday`, and `committedExpenses` to determine if a user can afford their minimum card payments.

The core calculation lives in `utils/decisionEngine.ts` in `computeNetAvailableCash()`. It computes: cash on hand + (monthly income adjusted for payday timing) - committed expenses = net available cash. This net available cash is then compared against each card's minimum payment to determine SAFE/CAUTION/RISKY status.

**The problem:** "Cash on hand" is confusing. Users set monthly income, payday, and committed expenses — and in the end, what matters is simply: how much can they pay toward their cards? The current terminology doesn't make that clear.

**What I need you to do:**

1. Read through `utils/decisionEngine.ts` (especially `computeNetAvailableCash`, `calculateCardStatus`, `scoreCard`), `store/userStore.ts`, `types/card.ts`, and `app/settings.tsx` to understand how cash on hand flows through the system.
2. Review all user-facing labels — in settings, onboarding, the finance card (`components/molecules/FinanceCard.tsx`), swipe impact panel, and the status guide (`app/status-guide.tsx`).
3. Recommend a clearer term that captures what the user actually cares about: "how much do I have available to pay my cards?" Consider terms like "available to pay", "payment budget", "spending money", etc.
4. Identify whether the current split of inputs (cash on hand + monthly income + payday + committed expenses) is the right UX, or if it could be simplified. For example, should we just ask "How much can you put toward card payments this month?"
5. Flag any places where the internal variable names (`cashOnHand`, `netAvailableCash`) would benefit from renaming for code clarity, but keep this separate from the UI terminology recommendation.

Do NOT make changes. Research only. Report your findings and recommendations.
