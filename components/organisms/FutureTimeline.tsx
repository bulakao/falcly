import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import type { Card, CardStatus, FutureCycleProjection } from '@/types/card';
import { projectFutureCycles } from '@/utils/decisionEngine';
import { useAppTheme } from '@/theme';
import type { SemanticTokens } from '@/theme';

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '✓',
  CAUTION: '⚠',
  RISKY: '✕',
};

const SIGNAL_ICONS: Record<string, string> = {
  'On Track': '✓',
  'At Risk': '⚠',
  'Unknown': '?',
};

function getStatusColors(t: SemanticTokens): Record<CardStatus, string> {
  return {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };
}

function getSignalColors(t: SemanticTokens): Record<string, string> {
  return {
    'On Track': t.safe,
    'At Risk': t.risky,
    'Unknown': t.textMuted,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

function formatCycleLabel(cycle: FutureCycleProjection): string {
  const month = MONTHS[cycle.statementClose.getMonth()];
  const year = cycle.statementClose.getFullYear();
  if (cycle.cycleNumber === 0) return `Current (${month} ${year})`;
  return `${month} ${year}`;
}

/**
 * Renders future cycle projections for a single card.
 * Shows committed items per cycle with SAFE/CAUTION/RISKY signals.
 * Cycles beyond the last known fixed event show signal only.
 */
export function FutureTimeline({
  card,
  netAvailableCash,
  today,
}: {
  card: Card;
  netAvailableCash?: number | null;
  today?: Date;
}) {
  const t = useAppTheme();
  const STATUS_COLORS = getStatusColors(t);
  const SIGNAL_COLORS = getSignalColors(t);
  const now = today ?? new Date();
  const projections = projectFutureCycles(card, netAvailableCash ?? null, now);

  if (projections.length === 0) return null;

  return (
    <View style={styles.container}>
      {projections.map((cycle) => (
        <View key={cycle.cycleNumber} style={[styles.cycleCard, { borderColor: t.border }]}>
          {/* Header: cycle label + status badge */}
          <View style={styles.cycleHeader}>
            <Text style={styles.cycleLabel}>{formatCycleLabel(cycle)}</Text>
            {cycle.isKnown ? (
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[cycle.status.status] }]}>
                <Text style={[styles.badgeText, { color: t.textInverse }]}>
                  {STATUS_ICONS[cycle.status.status]} {cycle.status.status}
                </Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: SIGNAL_COLORS[cycle.signal ?? 'Unknown'] }]}>
                <Text style={[styles.badgeText, { color: t.textInverse }]}>
                  {SIGNAL_ICONS[cycle.signal ?? 'Unknown']} {cycle.signal}
                </Text>
              </View>
            )}
          </View>

          {cycle.isKnown ? (
            <>
              {/* Opening balance for current cycle */}
              {cycle.cycleNumber === 0 && (
                <View style={styles.itemRow}>
                  <Text style={[styles.itemLabel, { color: t.textSecondary }]}>Projected balance</Text>
                  <Text style={[styles.itemValue, { color: t.textPrimary }]}>{formatPeso(cycle.projectedBalance)}</Text>
                </View>
              )}

              {/* Committed items for future cycles */}
              {cycle.cycleNumber > 0 && (
                <>
                  {cycle.committedItems.installments > 0 && (
                    <View style={styles.itemRow}>
                      <Text style={[styles.itemLabel, { color: t.textSecondary }]}>Installments</Text>
                      <Text style={[styles.itemValue, { color: t.textPrimary }]}>{formatPeso(cycle.committedItems.installments)}</Text>
                    </View>
                  )}
                  {cycle.committedItems.subscriptions > 0 && (
                    <View style={styles.itemRow}>
                      <Text style={[styles.itemLabel, { color: t.textSecondary }]}>Subscriptions</Text>
                      <Text style={[styles.itemValue, { color: t.textPrimary }]}>{formatPeso(cycle.committedItems.subscriptions)}</Text>
                    </View>
                  )}
                  {cycle.committedItems.annualFee > 0 && (
                    <View style={styles.itemRow}>
                      <Text style={[styles.itemLabel, { color: t.textSecondary }]}>Annual fee</Text>
                      <Text style={[styles.itemValue, { color: t.textPrimary }]}>{formatPeso(cycle.committedItems.annualFee)}</Text>
                    </View>
                  )}
                  <View style={[styles.totalRow, { borderTopColor: t.surface }]}>
                    <Text style={[styles.totalLabel, { color: t.textPrimary }]}>Known charges</Text>
                    <Text style={[styles.totalValue, { color: t.textPrimary }]}>{formatPeso(cycle.projectedBalance)}</Text>
                  </View>
                </>
              )}

              {/* Status reason */}
              {cycle.status.reason ? (
                <Text style={[styles.reason, { color: t.textMuted }]}>{cycle.status.reason}</Text>
              ) : null}
            </>
          ) : (
            <Text style={[styles.signalNote, { color: t.textMuted }]}>
              No fixed events scheduled beyond this point
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  cycleCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cycleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 13,
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  reason: {
    fontSize: 12,
    marginTop: 4,
  },
  signalNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
