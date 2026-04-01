import PostHog from 'posthog-react-native';

// PostHog EU region for RA 10173 / GDPR compatibility
const POSTHOG_API_KEY = '__POSTHOG_API_KEY__'; // Replace with real key before production
const POSTHOG_HOST = 'https://eu.i.posthog.com';

let posthog: PostHog | null = null;

export function initAnalytics(): void {
  if (posthog) return;
  posthog = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    // Disable automatic screen capture — we track events manually
    captureAppLifecycleEvents: false,
  });
}

export function getPostHog(): PostHog | null {
  return posthog;
}

/** Opt out of analytics — stops all event capture */
export function setAnalyticsOptOut(optOut: boolean): void {
  if (!posthog) return;
  if (optOut) {
    posthog.optOut();
  } else {
    posthog.optIn();
  }
}

// --- Amount tier anonymization (no exact balances tracked) ---

function getAmountTier(amount: number): string {
  if (amount <= 500) return '0-500';
  if (amount <= 1000) return '501-1000';
  if (amount <= 2000) return '1001-2000';
  if (amount <= 5000) return '2001-5000';
  if (amount <= 10000) return '5001-10000';
  if (amount <= 25000) return '10001-25000';
  if (amount <= 50000) return '25001-50000';
  return '50000+';
}

// --- Event tracking functions ---

export function trackCardAdded(source: 'manual_add' | 'onboarding'): void {
  posthog?.capture('card_added', { source });
}

export function trackSwipeCheckPerformed(
  status: string,
  amount: number,
): void {
  posthog?.capture('swipe_check_performed', {
    status,
    amount_tier: getAmountTier(amount),
  });
}

export function trackProConversionStarted(
  source: 'card_limit' | 'paywall' | 'trial_cta',
): void {
  posthog?.capture('pro_conversion_started', { source });
}

export function trackProTrialStarted(): void {
  posthog?.capture('pro_trial_started');
}

export function trackProConverted(planType: 'pro_monthly' | 'pro_annual' | 'pro_plus_monthly' | 'pro_plus_annual'): void {
  posthog?.capture('pro_converted', { plan_type: planType });
}

export function trackDataStalenessWarningShown(
  level: 'warning' | 'stale',
): void {
  posthog?.capture('data_staleness_warning_shown', { level });
}
