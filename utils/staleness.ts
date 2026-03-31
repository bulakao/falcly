/**
 * Data freshness/staleness helpers.
 * Used across home screen cards and card detail (swipe-impact) screen.
 */

export type StalenessLevel = 'fresh' | 'warning' | 'stale';

const STALENESS_WARNING_DAYS = 5;
const STALENESS_STALE_DAYS = 10;

/**
 * Format a timestamp into a human-readable relative time string.
 */
export function formatUpdatedAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Get the number of days since a timestamp.
 */
export function daysSinceUpdate(timestamp: number): number {
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

/**
 * Determine staleness level from a balance update timestamp.
 * - fresh: < 5 days
 * - warning: 5–9 days (amber inline warning)
 * - stale: 10+ days (badge replaced by staleness indicator)
 */
export function getStalenessLevel(balanceUpdatedAt: number): StalenessLevel {
  const days = daysSinceUpdate(balanceUpdatedAt);
  if (days >= STALENESS_STALE_DAYS) return 'stale';
  if (days >= STALENESS_WARNING_DAYS) return 'warning';
  return 'fresh';
}
