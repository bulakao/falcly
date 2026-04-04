import * as Localization from 'expo-localization';

// Map ISO 3166-1 region codes to ISO 4217 currency codes
const REGION_TO_CURRENCY: Record<string, string> = {
  PH: 'PHP', US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD',
  EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', HK: 'HKD', SG: 'SGD',
  MY: 'MYR', TH: 'THB', ID: 'IDR', VN: 'VND', IN: 'INR',
  NZ: 'NZD', CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK',
  MX: 'MXN', BR: 'BRL', AE: 'AED', SA: 'SAR', ZA: 'ZAR',
};

// Map ISO 4217 currency codes to display symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱', USD: '$', GBP: '£', AUD: 'A$', CAD: 'C$',
  EUR: '€', JPY: '¥', KRW: '₩', CNY: '¥', HKD: 'HK$',
  SGD: 'S$', MYR: 'RM', THB: '฿', IDR: 'Rp', VND: '₫',
  INR: '₹', NZD: 'NZ$', CHF: 'Fr', NOK: 'kr', SEK: 'kr',
  DKK: 'kr', MXN: 'MX$', BRL: 'R$', AED: 'د.إ', SAR: '﷼',
  ZAR: 'R',
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

export function detectLocaleCurrency(): string {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const region = locales[0].regionCode;
      if (region && REGION_TO_CURRENCY[region]) {
        return REGION_TO_CURRENCY[region];
      }
    }
  } catch {}
  return 'USD';
}

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
}

export function formatAmount(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const rounded = Math.round(amount);
  return `${symbol}${rounded.toLocaleString()}`;
}
