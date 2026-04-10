import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import type { Card } from '@/types/card';
import { getCycleDates } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';

function formatShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Single-card billing cycle timeline strip.
 * Shows: cycle start → today → statement close → due date
 * Statement close marker changes color at ≤7 days (amber) and ≤2 days (crimson).
 */
/**
 * BillingTimeline — single-card horizontal progress bar.
 * Shows today's position within one card's billing cycle (cycle start → statement close → due date).
 * Use this for per-card detail views (SwipeImpactPanel, onboarding-result).
 *
 * For a multi-card aligned timeline, see GanttTimeline.
 */
export function BillingTimeline({ card, today }: { card: Card; today?: Date }) {
  const t = useAppTheme();
  const cycle = getCycleDates(card, today);

  // Total span from cycle start to due date for positioning
  const totalSpanMs = cycle.dueDate.getTime() - cycle.cycleStart.getTime();
  if (totalSpanMs <= 0) return null;

  const todayPct = Math.max(0, Math.min(100, ((cycle.today.getTime() - cycle.cycleStart.getTime()) / totalSpanMs) * 100));
  const statementPct = ((cycle.statementClose.getTime() - cycle.cycleStart.getTime()) / totalSpanMs) * 100;

  // Statement close urgency color
  let statementColor = t.safe;
  if (cycle.daysToStatement <= 2) {
    statementColor = t.risky;
  } else if (cycle.daysToStatement <= 7) {
    statementColor = t.caution;
  }

  return (
    <View style={styles.container} accessible accessibilityLabel={`Billing cycle: statement closes in ${cycle.daysToStatement} days, due ${formatShortDate(cycle.dueDate)}`}>
      <Text style={[styles.title, { color: t.textMuted }]}>Billing Cycle</Text>

      {/* Today label above track */}
      <View style={styles.todayLabelRow}>
        <View style={[styles.labelPositioned, { left: `${todayPct}%` }]}>
          <Text style={[styles.labelDate, styles.todayLabel, { color: t.accent }]}>Today</Text>
        </View>
      </View>

      {/* Track */}
      <View style={[styles.track, { backgroundColor: t.border }]}>
        {/* Progress fill up to today */}
        <View style={[styles.fill, { width: `${todayPct}%`, backgroundColor: t.safe }]} />

        {/* Statement close marker */}
        <View style={[styles.marker, styles.statementMarker, { left: `${statementPct}%`, backgroundColor: statementColor, borderColor: t.textInverse }]} />

        {/* Today marker */}
        <View style={[styles.marker, styles.todayMarker, { left: `${todayPct}%`, backgroundColor: t.accent, borderColor: t.textInverse }]} />
      </View>

      {/* Labels row below track */}
      <View style={styles.labels}>
        <View style={styles.labelStart}>
          <Text style={[styles.labelDate, { color: t.textSecondary }]}>{formatShortDate(cycle.cycleStart)}</Text>
          <Text style={[styles.labelName, { color: t.textMuted }]}>Start</Text>
        </View>
        <View style={[styles.labelPositioned, { left: `${statementPct}%` }]}>
          <Text style={[styles.labelDate, { color: statementColor }]}>{formatShortDate(cycle.statementClose)}</Text>
          <Text style={[styles.labelName, { color: statementColor }]}>Statement</Text>
        </View>
        <View style={styles.labelEnd}>
          <Text style={[styles.labelDate, { color: t.textSecondary }]}>{formatShortDate(cycle.dueDate)}</Text>
          <Text style={[styles.labelName, { color: t.textMuted }]}>Due</Text>
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
  container: {},
  title: {
    fontSize: typeScale.body,
    fontFamily: fonts.interMedium,
    marginBottom: 12,
  },
  todayLabelRow: {
    position: 'relative',
    height: 18,
    marginBottom: 4,
  },
  track: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
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
    borderWidth: 2,
    zIndex: 2,
  },
  statementMarker: {
    zIndex: 1,
    borderWidth: 2,
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
    fontSize: typeScale.caption,
    fontFamily: fonts.interSemiBold,
  },
  labelName: {
    fontSize: typeScale.micro,
  },
  todayLabel: {
    fontFamily: fonts.interBold,
  },
  urgency: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interSemiBold,
    textAlign: 'center',
    marginTop: 4,
  },
});
