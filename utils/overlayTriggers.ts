import { WIKI_CARDS } from '@/constants/wikiCards';
import { OVERLAY_PRIORITY } from '@/types/overlay';
import type { CardOverlayItem } from '@/types/overlay';
import type { Card } from '@/types/card';

interface TriggerContext {
  card: Card;
  today: Date;
  daysToStatement: number;
  utilization: number;
  justSwiped?: boolean;
  proposedAmount?: number;
}

function wikiToOverlay(wikiId: string, cardId?: string): CardOverlayItem {
  const wiki = WIKI_CARDS.find((w) => w.id === wikiId);
  if (!wiki) throw new Error(`Wiki ${wikiId} not found`);

  return {
    id: `wiki-${wikiId}-${cardId || 'portfolio'}-${Date.now()}`,
    type: 'wiki',
    title: wiki.title,
    body: wiki.body,
    cta: 'Learn more',
    cardId,
    priority: OVERLAY_PRIORITY.wiki,
    wikiId,
    actionRoute: '/statement-advisor',
  };
}

/**
 * Evaluate trigger conditions and return the highest-priority wiki overlay, if any.
 */
export function getContextualWikiOverlay(ctx: TriggerContext): CardOverlayItem | null {
  const { card, daysToStatement, utilization, justSwiped, proposedAmount } = ctx;

  // W-10: swiping within 2 days of statement close — highest priority wiki
  if (justSwiped && daysToStatement <= 2 && daysToStatement >= 0) {
    return wikiToOverlay('W-10', card.id);
  }

  // W-04: swiping within 5 days of statement close
  if (justSwiped && daysToStatement <= 5 && daysToStatement > 2) {
    return wikiToOverlay('W-04', card.id);
  }

  // W-11: utilization > 30%
  if (utilization > 0.3) {
    return wikiToOverlay('W-11', card.id);
  }

  // W-12: day after statement close (daysToStatement is negative or cycle just reset)
  // When daysToStatement equals totalDays-1 or is very high, we just passed the close
  // Use a heuristic: if daysToStatement > 25 (just entered new cycle), show optimal swipe tip
  if (daysToStatement >= 28) {
    return wikiToOverlay('W-12', card.id);
  }

  // W-06: payday context — skip for now (requires payday alignment check, handled at portfolio level)

  // W-03: first-time card viewing — can't track here, skip (would need view count)

  // W-05: portfolio context — skip (handled at portfolio level, not per-card)

  // Propose amount triggers
  if (proposedAmount && proposedAmount > 0 && daysToStatement <= 5) {
    return wikiToOverlay('W-04', card.id);
  }

  return null;
}
