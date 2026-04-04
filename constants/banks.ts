export const PH_BANKS = [
  'BDO',
  'BPI',
  'Metrobank',
  'RCBC',
  'Security Bank',
  'UnionBank',
  'Citibank',
  'EastWest',
  'PNB',
  'Landbank',
  'DBP',
  'Robinsons Bank',
  'Maya',
  'GCash',
  'Other',
] as const;

export type PHBank = (typeof PH_BANKS)[number];
