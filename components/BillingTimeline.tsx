import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import type { Card } from '@/types/card';
import { getCycleDates } from '@/utils/decisionEngine';

function formatShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Single-card billing cycle timeline strip.
 * Shows: cycle start → today → statement close → due date
 * Statement close marker changes color at ≤7 days (amber) and ≤2 days (crimson).
 */
export function BillingTimeline({ card, today }: { card: Card; today?: Date }) {
  const cycle = getCycleDates(card, today);

  // Total span from cycle start to due date for positioning
  const totalSpanMs = cycle.dueDate.getTime() - cycle.cycleStart.getTime();
  if (totalSpanMs <= 0) return null;

  const todayPct = Math.max(0, Math.min(100, ((cycle.today.getTime() - cycle.cycleStart.getTime()) / totalSpanMs) * 100));
  const statementPct = ((cycle.statementClose.getTime() - cycle.cycleStart.getTime()) / totalSpanMs) * 100;

  // Statement close urgency color
  let statementColor = '#10b981'; // emerald (safe)
  if (cycle.daysToStatement <= 2) {
    statementColor = '#ef4444'; // crimson
  } else if (cycle.daysToStatement <= 7) {
    statementColor = '#f59e0b'; // amber
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Billing Cycle</Text>

      {/* Track */}
      <View style={styles.track}>
        {/* Progress fill up to today */}
        <View style={[styles.fill, { width: `${todayPct}%` }]} />

        {/* Statement close marker */}
        <View style={[styles.marker, styles.statementMarker, { left: `${statementPct}%`, backgroundColor: statementColor }]} />

        {/* Today marker */}
        <View style={[styles.marker, styles.todayMarker, { left: `${todayPct}%` }]} />
      </View>

      {/* Labels row */}
      <View style={styles.labels}>
        <View style={styles.labelStart}>
          <Text style={styles.labelDate}>{formatShortDate(cycle.cycleStart)}</Text>
          <Text style={styles.labelName}>Start</Text>
        </View>
        <View style={[styles.labelPositioned, { left: `${todayPct}%` }]}>
          <Text style={[styles.labelDate, styles.todayLabel]}>Today</Text>
        </View>
        <View style={[styles.labelPositioned, { left: `${statementPct}%` }]}>
          <Text style={[styles.labelDate, { color: statementColor }]}>{formatShortDate(cycle.statementClose)}</Text>
          <Text style={[styles.labelName, { color: statementColor }]}>Statement</Text>
        </View>
        <View style={styles.labelEnd}>
          <Text style={styles.labelDate}>{formatShortDate(cycle.dueDate)}</Text>
          <Text style={styles.labelName}>Due</Text>
        </View>
      </View>

      {/* Urgency message */}
      {cycle.daysToStatement <= 7 && (
        <Text style={[styles.urgency, { color: statementColor }]}>
          {cycle.daysToStatement <= 0
            ? 'Statement closes today!'
            : `Statement closes in ${cycle.daysToStatement} day${cycle.daysToStatement === 1 ? '' : 's'}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  track: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#10b981',
    borderRadius: 4,
    opacity: 0.3,
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  todayMarker: {
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  statementMarker: {
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#fff',
  },
  labels: {
    position: 'relative',
    height: 36,
    marginTop: 8,
  },
  labelStart: {
    position: 'absolute',
    left: 0,
  },
  labelEnd: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
  },
  labelPositioned: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -20 }],
  },
  labelDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  labelName: {
    fontSize: 10,
    color: '#999',
  },
  todayLabel: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  urgency: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});
