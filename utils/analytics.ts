import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const isConfigured = !!(apiKey && host);

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host,
  disabled: !isConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
});

/** @deprecated Use posthog instance directly. Kept for opt-out restoration. */
export function initAnalytics(): void {
  // Instance is created at module load. This is a no-op kept for call-site compat.
}

export function getPostHog(): PostHog {
  return posthog;
}

/** Opt out of analytics — stops all event capture */
export function setAnalyticsOptOut(optOut: boolean): void {
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

// --- Auth events ---

export function trackUserSignedIn(method: 'email' | 'google'): void {
  posthog.capture('user_signed_in', { method });
}

export function trackUserSignedUp(method: 'email'): void {
  posthog.capture('user_signed_up', { method });
}

export function trackUserSignedOut(): void {
  posthog.capture('user_signed_out');
}

// --- Pro paywall events ---

export function trackProPaywallViewed(): void {
  posthog.capture('pro_paywall_viewed');
}

export function trackProPaywallDismissed(): void {
  posthog.capture('pro_paywall_dismissed');
}

export function trackProPaywallPurchased(): void {
  posthog.capture('pro_paywall_purchased');
}

export function trackProPurchaseCompleted(planType: string): void {
  posthog.capture('pro_purchase_completed', { plan_type: planType });
}

// --- Event tracking functions ---

export function trackCardAdded(source: 'manual_add' | 'onboarding'): void {
  posthog.capture('card_added', { source });
}

export function trackSwipeCheckPerformed(
  status: string,
  amount: number,
): void {
  posthog.capture('swipe_check_performed', {
    status,
    amount_tier: getAmountTier(amount),
  });
}

export function trackProConversionStarted(
  source: 'card_limit' | 'paywall' | 'trial_cta',
): void {
  posthog.capture('pro_conversion_started', { source });
}

export function trackProTrialStarted(): void {
  posthog.capture('pro_trial_started');
}

export function trackProConverted(planType: 'pro_monthly' | 'pro_yearly' | 'pro_lifetime'): void {
  posthog.capture('pro_converted', { plan_type: planType });
}

export function trackDataStalenessWarningShown(
  level: 'warning' | 'stale',
): void {
  posthog.capture('data_staleness_warning_shown', { level });
}

// --- Onboarding funnel events ---

export function trackOnboardingWelcomeViewed(): void {
  posthog.capture('onboarding_welcome_viewed');
}

export function trackOnboardingGetStartedTapped(): void {
  posthog.capture('onboarding_get_started_tapped');
}

export function trackOnboardingSignupCompleted(method: 'email' | 'google'): void {
  posthog.capture('onboarding_signup_completed', { method });
}

export function trackOnboardingCardEntryCompleted(bankName: string, hasBalance: boolean): void {
  posthog.capture('onboarding_card_entry_completed', { bank_name: bankName, has_balance: hasBalance });
}

export function trackOnboardingFirstStatusViewed(status: 'SAFE' | 'CAUTION' | 'RISKY'): void {
  posthog.capture('onboarding_first_status_viewed', { status });
}

export function trackOnboardingEnrichmentCompleted(hasCash: boolean, hasPayday: boolean): void {
  posthog.capture('onboarding_enrichment_completed', { has_cash: hasCash, has_payday: hasPayday });
}

export function trackOnboardingEnrichmentSkipped(): void {
  posthog.capture('onboarding_enrichment_skipped');
}

export function trackOnboardingPaywallViewed(): void {
  posthog.capture('onboarding_paywall_viewed');
}

export function trackOnboardingTrialStarted(): void {
  posthog.capture('onboarding_trial_started');
}

export function trackOnboardingPaywallDismissed(): void {
  posthog.capture('onboarding_paywall_dismissed');
}

export function trackOnboardingNotificationsGranted(): void {
  posthog.capture('onboarding_notifications_granted');
}

export function trackOnboardingNotificationsDeclined(): void {
  posthog.capture('onboarding_notifications_declined');
}
