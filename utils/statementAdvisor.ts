/**
 * Statement Advisor — spread analysis engine
 *
 * Analyzes how a user's credit card statement dates are distributed
 * across the month, identifies clustering / dead zones, and generates
 * actionable tips for optimizing their portfolio.
 */
import type { Card } from '@/types/card';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SpreadAnalysis {
  score: number; // 0–100
  issues: SpreadIssue[];
  tips: SpreadTip[];
  gaps: GapInfo[];
  nextCardTarget: number | null; // suggested statement day for next card
}

export interface SpreadIssue {
  type: 'CLUSTERED' | 'DEAD_ZONE' | 'PAYDAY_MISALIGNED' | 'SINGLE_CARD';
  severity: 'high' | 'medium' | 'low';
  message: string;
  cards?: string[]; // card IDs involved
  gap?: GapInfo;
}

export interface SpreadTip {
  type: 'TIMING_TIP' | 'NEW_CARD_TARGET' | 'PAYDAY_TIP' | 'CLUSTER_WORKAROUND' | 'GRACE_EXPLAINER';
  message: string;
  cardId?: string;
}

export interface GapInfo {
  startDay: number;
  endDay: number;
  length: number;
  isDeadZone: boolean; // length > 14
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Wrap a day number into 1–30 range (circular month). */
function wrapDay(day: number): number {
  const d = ((day - 1) % 30) + 1;
  return d <= 0 ? d + 30 : d;
}

/** Circular distance from dayA to dayB going forward in a 30-day month. */
function circularDistance(from: number, to: number): number {
  const a = wrapDay(from);
  const b = wrapDay(to);
  return a <= b ? b - a : 30 - a + b;
}

/**
 * Returns the ideal swipe window: day after statement close to ~10 days after.
 */
export function getOptimalSwipeDays(statementDay: number): { start: number; end: number } {
  const norm = wrapDay(statementDay);
  return {
    start: wrapDay(norm + 1),
    end: wrapDay(norm + 10),
  };
}

/**
 * Calculate gaps between sorted statement days on a circular 30-day month.
 */
export function calculateGaps(statementDays: number[]): GapInfo[] {
  if (statementDays.length < 2) return [];

  const sorted = [...statementDays].map(wrapDay).sort((a, b) => a - b);
  const gaps: GapInfo[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const startDay = sorted[i];
    const endDay = sorted[(i + 1) % sorted.length];
    const length = circularDistance(startDay, endDay);
    gaps.push({ startDay, endDay, length, isDeadZone: length > 14 });
  }

  return gaps;
}

/**
 * True if any card's statement day falls 2–5 days after the given payday.
 */
export function checkPaydayAlignment(statementDays: number[], payday: number): boolean {
  const p = wrapDay(payday);
  return statementDays.some((day) => {
    const dist = circularDistance(p, wrapDay(day));
    return dist >= 2 && dist <= 5;
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function analyzeSpread(
  cards: Card[],
  payday?: number,
  payday2?: number,
): SpreadAnalysis {
  const issues: SpreadIssue[] = [];
  const tips: SpreadTip[] = [];

  // ── Edge: 0 cards ──
  if (cards.length === 0) {
    return { score: 0, issues: [], tips: [], gaps: [], nextCardTarget: null };
  }

  // ── Edge: 1 card ──
  if (cards.length === 1) {
    const card = cards[0];
    const window = getOptimalSwipeDays(card.statementDay);
    issues.push({
      type: 'SINGLE_CARD',
      severity: 'low',
      message: 'With one card, here\u2019s how to maximize your grace period',
    });
    tips.push({
      type: 'TIMING_TIP',
      message: `Best time to swipe ${card.bankName} is days ${window.start}\u2013${window.end}`,
      cardId: card.id,
    });
    tips.push({
      type: 'GRACE_EXPLAINER',
      message: 'A purchase on day 1 of your cycle gets ~50 days interest-free. On day 29 \u2014 only ~21 days.',
    });

    if (payday != null && !checkPaydayAlignment([card.statementDay], payday)) {
      const target = wrapDay(payday + 3);
      issues.push({
        type: 'PAYDAY_MISALIGNED',
        severity: 'medium',
        message: `No card aligns with your payday on the ${ordinal(payday)}`,
      });
      tips.push({
        type: 'PAYDAY_TIP',
        message: `A card closing on the ${ordinal(target)} would align with your payday on the ${ordinal(payday)}`,
      });
    }

    return { score: 50, issues, tips, gaps: [], nextCardTarget: null };
  }

  // ── Multi-card analysis ──
  const statementDays = cards.map((c) => c.statementDay);
  const gaps = calculateGaps(statementDays);
  const sorted = [...cards].sort((a, b) => wrapDay(a.statementDay) - wrapDay(b.statementDay));

  let score = 100;

  // Identify clustered pairs (gap < 7)
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    const gap = circularDistance(wrapDay(sorted[i].statementDay), wrapDay(next.statementDay));
    if (gap < 7) {
      score -= 15;
      issues.push({
        type: 'CLUSTERED',
        severity: 'high',
        message: `Your ${sorted[i].bankName} (${ordinal(wrapDay(sorted[i].statementDay))}) and ${next.bankName} (${ordinal(wrapDay(next.statementDay))}) are only ${gap} days apart`,
        cards: [sorted[i].id, next.id],
      });
      tips.push({
        type: 'CLUSTER_WORKAROUND',
        message: `Since ${sorted[i].bankName} and ${next.bankName} close together, alternate which card you prioritize each month`,
      });
    }
  }

  // Dead zones & minor gaps
  for (const gap of gaps) {
    if (gap.length > 14) {
      score -= 10;
      issues.push({
        type: 'DEAD_ZONE',
        severity: 'high',
        message: `No card resets between the ${ordinal(gap.startDay)} and ${ordinal(gap.endDay)} (${gap.length} days)`,
        gap,
      });
    } else if (gap.length > 7) {
      score -= 5;
    }
  }

  // Payday alignment
  const paydays: number[] = [];
  if (payday != null) paydays.push(payday);
  if (payday2 != null) paydays.push(payday2);

  let paydayAligned = paydays.length === 0; // no payday = skip check
  for (const pd of paydays) {
    if (checkPaydayAlignment(statementDays, pd)) {
      paydayAligned = true;
      break;
    }
  }
  if (!paydayAligned) {
    score -= 10;
    const pdLabel = paydays.map((d) => ordinal(d)).join(' and ');
    issues.push({
      type: 'PAYDAY_MISALIGNED',
      severity: 'medium',
      message: `No card aligns with your payday on the ${pdLabel}`,
    });
    const target = wrapDay(paydays[0] + 3);
    tips.push({
      type: 'PAYDAY_TIP',
      message: `A card closing on the ${ordinal(target)} would align with your payday on the ${ordinal(paydays[0])}`,
    });
  }

  score = Math.max(0, score);

  // Timing tips per card
  for (const card of cards) {
    const window = getOptimalSwipeDays(card.statementDay);
    tips.push({
      type: 'TIMING_TIP',
      message: `Best time to swipe ${card.bankName} is days ${window.start}\u2013${window.end}`,
      cardId: card.id,
    });
  }

  // Grace explainer (always)
  tips.push({
    type: 'GRACE_EXPLAINER',
    message: 'A purchase on day 1 of your cycle gets ~50 days interest-free. On day 29 \u2014 only ~21 days.',
  });

  // Next card target = midpoint of largest gap (null if < 10 days)
  let nextCardTarget: number | null = null;
  if (gaps.length > 0) {
    const largestGap = gaps.reduce((a, b) => (b.length > a.length ? b : a));
    if (largestGap.length >= 10) {
      const mid = Math.round(largestGap.length / 2);
      nextCardTarget = wrapDay(largestGap.startDay + mid);
      tips.push({
        type: 'NEW_CARD_TARGET',
        message: `Your next card should close around the ${ordinal(nextCardTarget)}`,
      });
    }
  }

  // If score >= 80 and no major issues, no need for extra tips
  if (score >= 80 && issues.length === 0) {
    // No issues to report — analysis is clean
  }

  return { score, issues, tips, gaps, nextCardTarget };
}

// ─── Util ───────────────────────────────────────────────────────────────────

function ordinal(day: number): string {
  const d = wrapDay(day);
  const s = ['th', 'st', 'nd', 'rd'];
  const v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}
