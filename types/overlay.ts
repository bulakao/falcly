export type OverlayType = 'alert' | 'advisory' | 'tip' | 'statement' | 'wiki' | 'promo' | 'affiliate';

export interface CardOverlayItem {
  id: string;
  type: OverlayType;
  title: string;
  body: string;
  cta?: string;
  cardId?: string;
  priority: number;
  wikiId?: string;
  actionRoute?: string;
}

export const OVERLAY_PRIORITY: Record<OverlayType, number> = {
  alert: 1,
  statement: 2,
  advisory: 3,
  tip: 4,
  wiki: 5,
  promo: 6,
  affiliate: 7,
};
