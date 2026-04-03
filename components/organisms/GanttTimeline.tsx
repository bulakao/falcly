import { StyleSheet, Pressable, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import type { Card, CardStatus } from '@/types/card';
import { getCycleDates, calculateCardStatus } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import type { SemanticTokens } from '@/theme';
import { fonts } from '@/theme/fonts';

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '✓',
  CAUTION: '⚠',
  RISKY: '✕',
};

function getStatusColors(t: SemanticTokens): Record<CardStatus, string> {
  return {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };
}

function formatShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Multi-card Gantt view showing all cards stacked vertically.
 * Sorted by urgency (closest statement close first), color-coded by status.
 */
interface GanttTimelineProps {
  cards: Card[];
  today?: Date;
  onCardPress?: (cardId: string) => void;
}

export function GanttTimeline({ cards, today, onCardPress }: GanttTimelineProps) {
  const t = useAppTheme();
  const STATUS_COLORS = getStatusColors(t);
  const now = today ?? new Date();

  if (cards.length === 0) return null;

  // Build card data with cycle info and status, sorted by urgency
  const cardData = cards
    .map((card) => ({
      card,
      cycle: getCycleDates(card, now),
      status: calculateCardStatus(card, now),
    }))
    .sort((a, b) => a.cycle.daysToStatement - b.cycle.daysToStatement);

  // Find the global date range across all cards for alignment
  const allDates = cardData.flatMap((d) => [d.cycle.cycleStart, d.cycle.dueDate]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const totalSpanMs = maxDate.getTime() - minDate.getTime();

  if (totalSpanMs <= 0) return null;

  const toPct = (date: Date) =>
    Math.max(0, Math.min(100, ((date.getTime() - minDate.getTime()) / totalSpanMs) * 100));

  const todayPct = toPct(now);

  return (
    <RNView style={styles.container}>
      {/* Card rows */}
      {cardData.map(({ card, cycle, status }, idx) => {
        const color = STATUS_COLORS[status.status];
        const barLeft = toPct(cycle.cycleStart);
        const barRight = toPct(cycle.statementClose);
        const barWidth = barRight - barLeft;
        const duePct = toPct(cycle.dueDate);

        // Statement close urgency color
        let stmtColor = t.safe;
        if (cycle.daysToStatement <= 2) stmtColor = t.risky;
        else if (cycle.daysToStatement <= 7) stmtColor = t.caution;

        return (
          <RNView key={card.id}>
            {idx > 0 && <RNView style={[styles.divider, { backgroundColor: t.border }]} />}
            <Pressable
              style={({ pressed }) => [styles.row, pressed && onCardPress && styles.rowPressed]}
              onPress={() => onCardPress?.(card.id)}
              disabled={!onCardPress}
            >
            {/* Card name with status icon prefix */}
            <RNView style={styles.nameRow}>
              <Text style={[styles.statusIcon, { color }]}>{STATUS_ICONS[status.status]}</Text>
              <Text style={[styles.bankName, { color: t.textPrimary }]} numberOfLines={1}>{card.bankName}</Text>
            </RNView>

            {/* Full-width Gantt bar */}
            <RNView style={styles.chartArea}>
              {/* Today vertical line */}
              <RNView style={[styles.todayLine, { left: `${todayPct}%`, backgroundColor: t.accent }]} />

              {/* Cycle bar (start → statement close) */}
              <RNView style={[styles.bar, { left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: color }]}>
                {/* Statement close marker */}
                <RNView style={[styles.stmtDot, { backgroundColor: stmtColor, borderColor: t.textInverse }]} />
              </RNView>

              {/* Due date marker */}
              <RNView style={[styles.dueDot, { left: `${duePct}%`, backgroundColor: t.textSecondary, borderColor: t.textInverse }]} />

              {/* Date labels below bar */}
              <RNView style={styles.barLabels}>
                <Text style={[styles.barDate, { left: `${barLeft}%`, color: t.textMuted }]}>{formatShortDate(cycle.cycleStart)}</Text>
                <Text style={[styles.barDate, styles.barDateRight, { left: `${barRight}%`, color: stmtColor }]}>
                  {formatShortDate(cycle.statementClose)}
                </Text>
                <Text style={[styles.barDate, { left: `${duePct}%`, color: t.textMuted }]}>{formatShortDate(cycle.dueDate)}</Text>
              </RNView>
            </RNView>
          </Pressable>
          </RNView>
        );
      })}

      {/* Today indicator below bars */}
      <RNView style={styles.todayRow}>
        <RNView style={[styles.todayMarker, { left: `${todayPct}%` }]}>
          <RNView style={[styles.todayDot, { backgroundColor: t.accent }]} />
          <Text style={[styles.todayText, { color: t.accent }]}>Today</Text>
        </RNView>
      </RNView>

      {/* Legend */}
      <RNView style={styles.legend}>
        <RNView style={styles.legendItem}>
          <RNView style={[styles.legendBar, { backgroundColor: t.border }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Cycle</Text>
        </RNView>
        <RNView style={styles.legendItem}>
          <RNView style={[styles.legendDot, { backgroundColor: t.textSecondary }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Due</Text>
        </RNView>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  row: {
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  rowPressed: {
    opacity: 0.6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  bankName: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    flexShrink: 1,
  },
  statusIcon: {
    fontSize: 11,
  },
  chartArea: {
    height: 40,
    position: 'relative',
  },
  todayLine: {
    position: 'absolute',
    top: -4,
    bottom: -8,
    width: 1.5,
    zIndex: 2,
  },
  bar: {
    position: 'absolute',
    top: 4,
    height: 16,
    borderRadius: 4,
    opacity: 0.6,
    justifyContent: 'center',
  },
  stmtDot: {
    position: 'absolute',
    right: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  dueDot: {
    position: 'absolute',
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    borderWidth: 1.5,
    zIndex: 1,
  },
  barLabels: {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
    height: 14,
  },
  barDate: {
    position: 'absolute',
    fontSize: 9,
    transform: [{ translateX: -14 }],
  },
  barDateRight: {
    fontFamily: fonts.interSemiBold,
  },
  todayRow: {
    position: 'relative',
    height: 20,
    marginTop: -8,
  },
  todayMarker: {
    position: 'absolute',
    alignItems: 'center',
    width: 40,
    marginLeft: -20,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  todayText: {
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendBar: {
    width: 16,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
  },
});
