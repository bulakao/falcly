import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  Image,
  View as RNView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CreditCard, Zap, LayoutDashboard, ShieldCheck, Infinity } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/authStore';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import type { PurchasesPackage } from 'react-native-purchases';
import { trackProPurchaseCompleted } from '@/utils/analytics';

const falclyLogo = require('@/assets/images/icon.png');

// ─── Feature list ─────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: CreditCard, label: 'Unlimited cards', sub: 'Track as many cards as you need' },
  { icon: Zap,        label: 'Swipe impact analysis', sub: 'See the effect before you spend' },
  { icon: LayoutDashboard, label: 'Payoff planner', sub: 'Clear your balances faster' },
  { icon: ShieldCheck, label: 'Card overlays', sub: 'Smart alerts at a glance' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManualPaywallScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const { fromOnboarding } = useLocalSearchParams<{ fromOnboarding?: string }>();
  const { offerings, isLoading, error, loadOfferings, purchase, restore, tier } =
    useSubscriptionStore();
  const user = useAuthStore((s) => s.user);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select annual on load
  useEffect(() => {
    if (offerings && !selectedPackage) {
      const annual = offerings.availablePackages.find((p) => p.packageType === 'ANNUAL');
      if (annual) setSelectedPackage(annual);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerings]);

  const initialTierRef = useRef(tier);
  useEffect(() => {
    // Only dismiss if tier changed after mount (purchase/restore happened)
    if (tier !== 'free' && tier !== initialTierRef.current) {
      router.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router is stable, tier is the trigger
  }, [tier]);

  async function handlePurchase() {
    if (!selectedPackage) return;
    setIsPurchasing(true);
    const success = await purchase(selectedPackage);
    setIsPurchasing(false);
    if (success) {
      trackProPurchaseCompleted(selectedPackage.packageType);
      if (!user) {
        Alert.alert(
          'You\'re in! 🎉',
          'Create your account to save your Pro access and sync across devices.',
          [{ text: 'Create Account', onPress: () => router.replace('/sign-in?mode=signup&fromPaywall=true') }],
        );
      } else {
        Alert.alert('Welcome to Falcly Pro! 🎉', 'All features are now unlocked.', [
          { text: 'Let\'s go', onPress: () => router.replace('/') },
        ]);
      }
    }
  }

  async function handleRestore() {
    setIsPurchasing(true);
    const success = await restore();
    setIsPurchasing(false);
    if (success) {
      Alert.alert('Restored!', 'Your purchases have been restored.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } else {
      Alert.alert('No Purchases Found', 'No previous purchases were found for this account.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }

  if (isLoading && !offerings) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  const packages = offerings?.availablePackages ?? [];
  const monthlyPkg = packages.find((p) => p.packageType === 'MONTHLY');
  const annualPkg = packages.find((p) => p.packageType === 'ANNUAL');
  const lifetimePkg = packages.find((p) => p.packageType === 'LIFETIME');

  const annualSavingsPct = (() => {
    if (!monthlyPkg || !annualPkg) return null;
    const pct = Math.round((1 - annualPkg.product.price / (monthlyPkg.product.price * 12)) * 100);
    return pct > 0 ? pct : null;
  })();

  const trialLabel = (() => {
    if (!selectedPackage || selectedPackage.packageType === 'LIFETIME') return null;
    const intro = selectedPackage.product.introPrice;
    if (!intro || intro.price !== 0) return null;
    const { periodUnit, periodNumberOfUnits } = intro;
    const unit = periodUnit?.toLowerCase() ?? 'day';
    const unitLabel = periodNumberOfUnits === 1 ? unit : `${unit}s`;
    return `${periodNumberOfUnits}-${unitLabel} free trial · Cancel anytime`;
  })();

  const ctaLabel = () => {
    if (!selectedPackage) return 'Select a Plan';
    if (selectedPackage.packageType === 'LIFETIME') return 'Get Lifetime Access';
    if (trialLabel) return 'Start Free Trial';
    return 'Subscribe Now';
  };

  function renderPackageCard(pkg: PurchasesPackage, isAnnual = false, isLifetime = false) {
    const isSelected = selectedPackage?.identifier === pkg.identifier;
    return (
      <TouchableOpacity
        key={pkg.identifier}
        activeOpacity={0.8}
        style={[
          styles.packageCard,
          !isLifetime && styles.packageCardHalf,
          { borderColor: isSelected ? t.primary : t.border, backgroundColor: t.surface },
          isSelected && { borderColor: t.primary, backgroundColor: t.accentBg },
        ]}
        onPress={() => setSelectedPackage(pkg)}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${pkg.packageType} plan, ${pkg.product.priceString}`}
      >
        {isAnnual && (
          <RNView style={[styles.badge, { backgroundColor: t.primary }]}>
            <Text style={[styles.badgeText, { color: t.primaryText }]}>BEST VALUE</Text>
          </RNView>
        )}

        {isLifetime ? (
          <RNView style={styles.lifetimeContent}>
            <RNView style={styles.lifetimeLogo}>
              <Image source={falclyLogo} style={styles.lifetimeLogoImg} resizeMode="contain" />
            </RNView>
            <RNView style={styles.lifetimeInfo}>
              <Text style={[styles.packageTitle, { color: t.textPrimary }]}>Lifetime</Text>
              <RNView style={styles.lifetimeRow}>
                <Infinity size={12} color={t.textSecondary} strokeWidth={2} />
                <Text style={[styles.lifetimeSub, { color: t.textSecondary }]}> One-time payment</Text>
              </RNView>
            </RNView>
            <Text style={[styles.packagePrice, { color: isSelected ? t.primary : t.textPrimary }]}>
              {pkg.product.priceString}
            </Text>
          </RNView>
        ) : (
          <>
            <Text style={[styles.packageTitle, { color: t.textPrimary }]}>
              {isAnnual ? 'Yearly' : 'Monthly'}
            </Text>
            <Text style={[styles.packagePrice, { color: isSelected ? t.primary : t.textPrimary }]}>
              {pkg.product.priceString}
            </Text>
            <Text style={[styles.packagePeriod, { color: t.textSecondary }]}>
              /{isAnnual ? 'yr' : 'mo'}
            </Text>
            {isAnnual && annualSavingsPct !== null && (
              <Text style={[styles.savings, { color: t.safe }]}>Save {annualSavingsPct}%</Text>
            )}
          </>
        )}

        {isSelected && (
          <RNView style={[styles.selectedDot, { backgroundColor: t.primary }]} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Features ── */}
      <View style={[styles.featuresCard, { backgroundColor: t.surface }]}>
        {FEATURES.map(({ icon: Icon, label, sub }, i) => (
          <RNView key={label}>
            {i > 0 && <RNView style={[styles.featureRowDivider, { backgroundColor: t.border }]} />}
            <RNView style={styles.featureRow}>
              <RNView style={[styles.featureIcon, { backgroundColor: t.accentBg }]}>
                <Icon size={18} color={t.accent} strokeWidth={2} />
              </RNView>
              <RNView style={styles.featureText}>
                <Text style={[styles.featureLabel, { color: t.textPrimary }]}>{label}</Text>
                <Text style={[styles.featureSub, { color: t.textSecondary }]}>{sub}</Text>
              </RNView>
            </RNView>
          </RNView>
        ))}
      </View>

      {/* ── Packages ── */}
      <View style={styles.packages}>
        <RNView style={styles.packagesRow}>
          {monthlyPkg && renderPackageCard(monthlyPkg)}
          {annualPkg && renderPackageCard(annualPkg, true)}
        </RNView>
        {lifetimePkg && renderPackageCard(lifetimePkg, false, true)}
      </View>

      {/* ── CTA ── */}
      <TouchableOpacity
        style={[
          styles.purchaseButton,
          { backgroundColor: selectedPackage ? t.primary : t.border },
        ]}
        onPress={handlePurchase}
        disabled={!selectedPackage || isPurchasing}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel()}
      >
        {isPurchasing ? (
          <ActivityIndicator color={t.primaryText} />
        ) : (
          <Text style={[styles.purchaseButtonText, { color: t.primaryText }]}>
            {ctaLabel()}
          </Text>
        )}
      </TouchableOpacity>

      {trialLabel && (
        <Text style={[styles.trialNote, { color: t.textSecondary }]}>
          {trialLabel}
        </Text>
      )}

      {/* ── Footer ── */}
      <TouchableOpacity
        onPress={handleRestore}
        disabled={isPurchasing}
        accessibilityRole="button"
        accessibilityLabel="Restore purchases"
      >
        <Text style={[styles.restoreText, { color: t.primary }]}>Restore Purchases</Text>
      </TouchableOpacity>

      {fromOnboarding === 'true' && (
        <TouchableOpacity
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="Skip for now and continue free"
        >
          <Text style={[styles.skipText, { color: t.textMuted }]}>Maybe later — continue free</Text>
        </TouchableOpacity>
      )}

      {error && <Text style={[styles.error, { color: t.risky }]}>{error}</Text>}

      <Text style={[styles.terms, { color: t.textMuted }]}>
        Payment charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play account'} at
        confirmation. Subscription renews automatically unless cancelled at least 24 hours before
        the end of the period.
      </Text>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },

  heading: {
    fontSize: typeScale.callout,
    fontFamily: fonts.nunitoBold,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Features card
  featuresCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  featureRowDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: typeScale.footnote,
    lineHeight: 16,
  },

  // Packages
  packages: {
    gap: 10,
    marginBottom: 20,
  },
  packagesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  packageCard: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  packageCardHalf: {
    flex: 1,
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
    marginBottom: 6,
  },
  packagePrice: {
    fontSize: typeScale.title2,
    fontFamily: fonts.interBold,
  },
  packagePeriod: {
    fontSize: typeScale.footnote,
    marginTop: 2,
  },
  savings: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interSemiBold,
    marginTop: 4,
  },
  lifetimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lifetimeLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  lifetimeLogoImg: {
    width: 48,
    height: 48,
  },
  lifetimeInfo: {
    flex: 1,
  },
  lifetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lifetimeSub: {
    fontSize: typeScale.footnote,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  badgeText: {
    fontSize: typeScale.micro,
    fontFamily: fonts.interBold,
    letterSpacing: 0.5,
  },
  selectedDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // CTA
  purchaseButton: {
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  purchaseButtonText: {
    fontSize: typeScale.body2,
    fontFamily: fonts.interBold,
  },
  trialNote: {
    textAlign: 'center',
    fontSize: typeScale.subhead,
    marginBottom: 20,
  },

  // Footer
  restoreText: {
    textAlign: 'center',
    fontSize: typeScale.subhead,
    marginBottom: 12,
  },
  skipText: {
    textAlign: 'center',
    fontSize: typeScale.footnote,
    marginBottom: 20,
    textDecorationLine: 'underline',
  },
  error: {
    textAlign: 'center',
    fontSize: typeScale.body,
    marginBottom: 12,
  },
  terms: {
    fontSize: typeScale.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
});
