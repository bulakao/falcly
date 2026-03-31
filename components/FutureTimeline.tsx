import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import type { Card, CardStatus, FutureCycleProjection } from '@/types/card';
import { projectFutureCycles } from '@/utils/decisionEngine';

const STATUS_COLORS: Record<CardStatus, string> = {
  SAFE: '#10b981',
  CAUTION: '#f59e0b',
  RISKY: '#ef4444',
};

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '✓',
  CAUTION: '⚠',
  RISKY: '✕',
};

const SIGNAL_COLORS: Record<string, string> = {
  'On Track': '#10b981',
  'At Risk': '#ef4444',
  'Unknown': '#6b7280',
};

const SIGNAL_ICONS: Record<string, string> = {
  'On Track': '✓',
  'At Risk': '⚠',
  'Unknown': '?',
};

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
  const now = today ?? new Date();
  const projections = projectFutureCycles(card, netAvailableCash ?? null, now);

  if (projections.length === 0) return null;

  return (
    <View style={styles.container}>
      {projections.map((cycle) => (
        <View key={cycle.cycleNumber} style={styles.cycleCard}>
          {/* Header: cycle label + status badge */}
          <View style={styles.cycleHeader}>
            <Text style={styles.cycleLabel}>{formatCycleLabel(cycle)}</Text>
            {cycle.isKnown ? (
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[cycle.status.status] }]}>
                <Text style={styles.badgeText}>
                  {STATUS_ICONS[cycle.status.status]} {cycle.status.status}
                </Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: SIGNAL_COLORS[cycle.signal ?? 'Unknown'] }]}>
                <Text style={styles.badgeText}>
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
                  <Text style={styles.itemLabel}>Projected balance</Text>
                  <Text style={styles.itemValue}>{formatPeso(cycle.projectedBalance)}</Text>
                </View>
              )}

              {/* Committed items for future cycles */}
              {cycle.cycleNumber > 0 && (
                <>
                  {cycle.committedItems.installments > 0 && (
                    <View style={styles.itemRow}>
                      <Text style={styles.itemLabel}>Installments</Text>
                      <Text style={styles.itemValue}>{formatPeso(cycle.committedItems.installments)}</Text>
                    </View>
                  )}
                  {cycle.committedItems.subscriptions > 0 && (
                    <View style={styles.itemRow}>
                      <Text style={styles.itemLabel}>Subscriptions</Text>
                      <Text style={styles.itemValue}>{formatPeso(cycle.committedItems.subscriptions)}</Text>
                    </View>
                  )}
                  {cycle.committedItems.annualFee > 0 && (
                    <View style={styles.itemRow}>
                      <Text style={styles.itemLabel}>Annual fee</Text>
                      <Text style={styles.itemValue}>{formatPeso(cycle.committedItems.annualFee)}</Text>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Known charges</Text>
                    <Text style={styles.totalValue}>{formatPeso(cycle.projectedBalance)}</Text>
                  </View>
                </>
              )}

              {/* Status reason */}
              {cycle.status.reason ? (
                <Text style={styles.reason}>{cycle.status.reason}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.signalNote}>
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
    borderColor: '#e5e7eb',
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
    color: '#fff',
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
    color: '#666',
  },
  itemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  reason: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  signalNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
