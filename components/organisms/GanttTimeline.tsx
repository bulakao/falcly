import { StyleSheet, Pressable } from 'react-native';
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
    <View style={styles.container}>
      {/* Today line header */}
      <View style={styles.headerRow}>
        <View style={styles.labelCol} />
        <View style={styles.chartCol}>
          <View style={[styles.todayHeaderMarker, { left: `${todayPct}%` }]}>
            <Text style={[styles.todayHeaderText, { color: t.accent }]}>Today</Text>
          </View>
        </View>
      </View>

      {/* Card rows */}
      {cardData.map(({ card, cycle, status }) => {
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
          <Pressable
            key={card.id}
            style={({ pressed }) => [styles.row, pressed && onCardPress && styles.rowPressed]}
            onPress={() => onCardPress?.(card.id)}
            disabled={!onCardPress}
          >
            {/* Card label */}
            <View style={styles.labelCol}>
              <Text style={styles.bankName} numberOfLines={1}>{card.bankName}</Text>
              <View style={styles.statusRow}>
                <Text style={[styles.statusIcon, { color }]}>{STATUS_ICONS[status.status]}</Text>
                <Text style={[styles.statusText, { color }]}>{status.status}</Text>
              </View>
            </View>

            {/* Gantt bar */}
            <View style={styles.chartCol}>
              {/* Today vertical line */}
              <View style={[styles.todayLine, { left: `${todayPct}%`, backgroundColor: t.accent }]} />

              {/* Cycle bar (start → statement close) */}
              <View style={[styles.bar, { left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: color }]}>
                {/* Statement close marker */}
                <View style={[styles.stmtDot, { backgroundColor: stmtColor, borderColor: t.textInverse }]} />
              </View>

              {/* Due date marker */}
              <View style={[styles.dueDot, { left: `${duePct}%`, backgroundColor: t.textSecondary, borderColor: t.textInverse }]} />

              {/* Date labels below bar */}
              <View style={styles.barLabels}>
                <Text style={[styles.barDate, { left: `${barLeft}%`, color: t.textMuted }]}>{formatShortDate(cycle.cycleStart)}</Text>
                <Text style={[styles.barDate, styles.barDateRight, { left: `${barRight}%`, color: stmtColor }]}>
                  {formatShortDate(cycle.statementClose)}
                </Text>
                <Text style={[styles.barDate, { left: `${duePct}%`, color: t.textMuted }]}>{formatShortDate(cycle.dueDate)}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: t.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: t.accent }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBar, { backgroundColor: t.border }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Cycle</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: t.textSecondary }]} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Due</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    height: 20,
    marginBottom: 4,
  },
  labelCol: {
    width: 80,
    paddingRight: 8,
    justifyContent: 'center',
  },
  chartCol: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  todayHeaderMarker: {
    position: 'absolute',
    transform: [{ translateX: -16 }],
  },
  todayHeaderText: {
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
    minHeight: 40,
  },
  rowPressed: {
    opacity: 0.6,
  },
  bankName: {
    fontSize: 13,
    fontFamily: fonts.interBold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusIcon: {
    fontSize: 11,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.interSemiBold,
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
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
