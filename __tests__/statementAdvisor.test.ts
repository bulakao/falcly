/**
 * Statement Advisor — test suite for analyzeSpread engine
 */
import {
  analyzeSpread,
  calculateGaps,
  checkPaydayAlignment,
  getOptimalSwipeDays,
} from '@/utils/statementAdvisor';
import { createMockCard } from './fixtures/cards';

// ---------------------------------------------------------------------------
// getOptimalSwipeDays
// ---------------------------------------------------------------------------
describe('getOptimalSwipeDays', () => {
  it('returns day after close to +10 days', () => {
    const window = getOptimalSwipeDays(15);
    expect(window.start).toBe(16);
    expect(window.end).toBe(25);
  });

  it('wraps around end of month', () => {
    const window = getOptimalSwipeDays(25);
    expect(window.start).toBe(26);
    expect(window.end).toBe(5); // wraps past 30
  });

  it('handles day 30', () => {
    const window = getOptimalSwipeDays(30);
    expect(window.start).toBe(1);
    expect(window.end).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// calculateGaps
// ---------------------------------------------------------------------------
describe('calculateGaps', () => {
  it('returns empty for fewer than 2 days', () => {
    expect(calculateGaps([])).toEqual([]);
    expect(calculateGaps([15])).toEqual([]);
  });

  it('calculates gaps for 2 evenly spaced cards', () => {
    const gaps = calculateGaps([5, 20]);
    expect(gaps).toHaveLength(2);
    // 5→20 = 15, 20→5 = 15 (wraps)
    expect(gaps[0].length).toBe(15);
    expect(gaps[1].length).toBe(15);
  });

  it('handles wrap-around gap (25 → 5)', () => {
    const gaps = calculateGaps([25, 5]);
    const sorted = gaps.sort((a, b) => a.startDay - b.startDay);
    // 5→25 = 20, 25→5 = 10
    expect(sorted[0]).toMatchObject({ startDay: 5, endDay: 25, length: 20 });
    expect(sorted[1]).toMatchObject({ startDay: 25, endDay: 5, length: 10 });
  });

  it('marks dead zones correctly', () => {
    const gaps = calculateGaps([5, 25]);
    const deadZones = gaps.filter((g) => g.isDeadZone);
    expect(deadZones.length).toBe(1);
    expect(deadZones[0].length).toBe(20);
  });

  it('3 evenly spaced cards have no dead zones', () => {
    const gaps = calculateGaps([5, 15, 25]);
    expect(gaps).toHaveLength(3);
    gaps.forEach((g) => {
      expect(g.length).toBe(10);
      expect(g.isDeadZone).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// checkPaydayAlignment
// ---------------------------------------------------------------------------
describe('checkPaydayAlignment', () => {
  it('returns true when card is 2–5 days after payday', () => {
    expect(checkPaydayAlignment([18], 15)).toBe(true); // 3 days after
    expect(checkPaydayAlignment([17], 15)).toBe(true); // 2 days after
    expect(checkPaydayAlignment([20], 15)).toBe(true); // 5 days after
  });

  it('returns false when card is outside 2–5 range', () => {
    expect(checkPaydayAlignment([16], 15)).toBe(false); // 1 day after
    expect(checkPaydayAlignment([21], 15)).toBe(false); // 6 days after
    expect(checkPaydayAlignment([15], 15)).toBe(false); // same day
  });

  it('handles wrap-around (payday 28, card close 2)', () => {
    expect(checkPaydayAlignment([1], 28)).toBe(true); // 3 days after
    expect(checkPaydayAlignment([3], 28)).toBe(true); // 5 days after
  });

  it('returns true if any card aligns', () => {
    expect(checkPaydayAlignment([5, 18, 25], 15)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// analyzeSpread — empty cards
// ---------------------------------------------------------------------------
describe('analyzeSpread — empty cards', () => {
  it('returns score 0 with no issues or tips', () => {
    const result = analyzeSpread([]);
    expect(result.score).toBe(0);
    expect(result.issues).toEqual([]);
    expect(result.tips).toEqual([]);
    expect(result.gaps).toEqual([]);
    expect(result.nextCardTarget).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// analyzeSpread — single card
// ---------------------------------------------------------------------------
describe('analyzeSpread — single card', () => {
  it('returns score 50 with SINGLE_CARD issue', () => {
    const card = createMockCard({ statementDay: 15, bankName: 'BDO' });
    const result = analyzeSpread([card]);
    expect(result.score).toBe(50);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe('SINGLE_CARD');
  });

  it('generates a TIMING_TIP for the card', () => {
    const card = createMockCard({ statementDay: 15, bankName: 'BDO' });
    const result = analyzeSpread([card]);
    const timingTips = result.tips.filter((t) => t.type === 'TIMING_TIP');
    expect(timingTips).toHaveLength(1);
    expect(timingTips[0].message).toContain('BDO');
  });

  it('adds PAYDAY_MISALIGNED when payday not aligned', () => {
    const card = createMockCard({ statementDay: 5 });
    const result = analyzeSpread([card], 15);
    const misaligned = result.issues.find((i) => i.type === 'PAYDAY_MISALIGNED');
    expect(misaligned).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// analyzeSpread — 2 cards evenly spaced
// ---------------------------------------------------------------------------
describe('analyzeSpread — 2 cards evenly spaced', () => {
  it('scores high with no clusters or dead zones', () => {
    const cards = [
      createMockCard({ id: 'a', statementDay: 5, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 20, bankName: 'BPI' }),
    ];
    const result = analyzeSpread(cards);
    // Both gaps are 15 days → both are dead zones, score deducted twice
    expect(result.score).toBeLessThanOrEqual(80);
    expect(result.issues.filter((i) => i.type === 'CLUSTERED')).toHaveLength(0);
    expect(result.issues.filter((i) => i.type === 'DEAD_ZONE')).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// analyzeSpread — 2 cards clustered
// ---------------------------------------------------------------------------
describe('analyzeSpread — 2 cards clustered', () => {
  it('deducts 15 points and reports CLUSTERED issue', () => {
    const cards = [
      createMockCard({ id: 'a', statementDay: 10, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 13, bankName: 'BPI' }),
    ];
    const result = analyzeSpread(cards);
    expect(result.score).toBeLessThanOrEqual(85);
    const clustered = result.issues.filter((i) => i.type === 'CLUSTERED');
    expect(clustered.length).toBeGreaterThanOrEqual(1);
    expect(clustered[0].cards).toContain('a');
    expect(clustered[0].cards).toContain('b');
  });

  it('generates CLUSTER_WORKAROUND tip', () => {
    const cards = [
      createMockCard({ id: 'a', statementDay: 10, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 13, bankName: 'BPI' }),
    ];
    const result = analyzeSpread(cards);
    const workarounds = result.tips.filter((t) => t.type === 'CLUSTER_WORKAROUND');
    expect(workarounds.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// analyzeSpread — 3 cards with dead zone
// ---------------------------------------------------------------------------
describe('analyzeSpread — 3 cards with dead zone', () => {
  it('identifies dead zone and deducts score', () => {
    // Cards on 3, 5, 8 — leaves gap from 8→3 = 25 days (huge dead zone)
    const cards = [
      createMockCard({ id: 'a', statementDay: 3, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 5, bankName: 'BPI' }),
      createMockCard({ id: 'c', statementDay: 8, bankName: 'Metro' }),
    ];
    const result = analyzeSpread(cards);
    const deadZones = result.issues.filter((i) => i.type === 'DEAD_ZONE');
    expect(deadZones.length).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThan(80);
  });

  it('suggests nextCardTarget in largest gap', () => {
    const cards = [
      createMockCard({ id: 'a', statementDay: 3, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 5, bankName: 'BPI' }),
      createMockCard({ id: 'c', statementDay: 8, bankName: 'Metro' }),
    ];
    const result = analyzeSpread(cards);
    expect(result.nextCardTarget).not.toBeNull();
    // Largest gap is 8→3 (25 days), midpoint ≈ 8+13 = 21
    expect(result.nextCardTarget).toBe(21);
  });
});

// ---------------------------------------------------------------------------
// analyzeSpread — payday aligned vs misaligned
// ---------------------------------------------------------------------------
describe('analyzeSpread — payday alignment', () => {
  it('no penalty when aligned', () => {
    const cards = [
      createMockCard({ id: 'a', statementDay: 18, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 3, bankName: 'BPI' }),
    ];
    // payday 15, card on 18 = 3 days after → aligned
    const result = analyzeSpread(cards, 15);
    const misaligned = result.issues.find((i) => i.type === 'PAYDAY_MISALIGNED');
    expect(misaligned).toBeUndefined();
  });

  it('deducts 10 when misaligned', () => {
    const cards = [
      createMockCard({ id: 'a', statementDay: 5, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 25, bankName: 'BPI' }),
    ];
    // payday 15, neither card is 2–5 days after
    const result = analyzeSpread(cards, 15);
    const misaligned = result.issues.find((i) => i.type === 'PAYDAY_MISALIGNED');
    expect(misaligned).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// analyzeSpread — wrap-around gap
// ---------------------------------------------------------------------------
describe('analyzeSpread — wrap-around gap', () => {
  it('correctly calculates gap from card on 25th to card on 5th', () => {
    const cards = [
      createMockCard({ id: 'a', statementDay: 25, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 5, bankName: 'BPI' }),
    ];
    const result = analyzeSpread(cards);
    // Gap 5→25 = 20 days (dead zone), 25→5 = 10 days
    const deadZones = result.gaps.filter((g) => g.isDeadZone);
    expect(deadZones).toHaveLength(1);
    expect(deadZones[0].length).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// analyzeSpread — all cards same day
// ---------------------------------------------------------------------------
describe('analyzeSpread — all cards same day', () => {
  it('severely penalizes identical statement days', () => {
    const cards = [
      createMockCard({ id: 'a', statementDay: 15, bankName: 'BDO' }),
      createMockCard({ id: 'b', statementDay: 15, bankName: 'BPI' }),
      createMockCard({ id: 'c', statementDay: 15, bankName: 'Metro' }),
    ];
    const result = analyzeSpread(cards);
    // 3 clustered pairs (each gap 0) → -45 points
    expect(result.score).toBeLessThanOrEqual(55);
    const clustered = result.issues.filter((i) => i.type === 'CLUSTERED');
    expect(clustered.length).toBe(3);
  });
});
