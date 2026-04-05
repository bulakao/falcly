import { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  View as RNView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CreditCard, Zap, LayoutDashboard, ShieldCheck, Infinity } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { PurchasesPackage } from 'react-native-purchases';
import { trackProPurchaseCompleted } from '@/utils/analytics';

// ─── Feature list ─────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: CreditCard, label: 'Unlimited cards', sub: 'Track as many cards as you need' },
  { icon: Zap,        label: 'Swipe impact analysis', sub: 'See the effect before you spend' },
  { icon: LayoutDashboard, label: 'Payoff planner', sub: 'Avalanche & snowball strategies' },
  { icon: ShieldCheck, label: 'Card overlays', sub: 'Smart alerts at a glance' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManualPaywallScreen() {
  const router = useRouter();
  const t = useAppTheme();

  const { offerings, isLoading, error, loadOfferings, purchase, restore, tier } =
    useSubscriptionStore();
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

  useEffect(() => {
    if (tier !== 'free') {
      router.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  async function handlePurchase() {
    if (!selectedPackage) return;
    setIsPurchasing(true);
    const success = await purchase(selectedPackage);
    setIsPurchasing(false);
    if (success) {
      trackProPurchaseCompleted(selectedPackage.packageType);
      Alert.alert('Welcome to Falcly Pro! 🎉', 'All features are now unlocked.', [
        { text: 'Let\'s go', onPress: () => router.back() },
      ]);
    }
  }

  async function handleRestore() {
    setIsPurchasing(true);
    const success = await restore();
    setIsPurchasing(false);
    if (success) {
      Alert.alert('Restored!', 'Your purchases have been restored.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
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

  const annualSavingsPct = (() => {
    const monthly = packages.find((p) => p.packageType === 'MONTHLY');
    const annual = packages.find((p) => p.packageType === 'ANNUAL');
    if (!monthly || !annual) return null;
    const pct = Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100);
    return pct > 0 ? pct : null;
  })();

  const ctaLabel = () => {
    if (!selectedPackage) return 'Select a Plan';
    if (selectedPackage.packageType === 'LIFETIME') return 'Get Lifetime Access';
    return 'Start Free Trial';
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <RNView style={[styles.iconWrap, { backgroundColor: t.accentBg }]}>
          <Text style={styles.iconEmoji}>🦅</Text>
        </RNView>
        <Text style={[styles.title, { color: t.textPrimary }]}>Upgrade to Pro</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          Know exactly when it's safe to swipe — on every card.
        </Text>
      </View>

      {/* ── Features ── */}
      <View style={[styles.featuresCard, { backgroundColor: t.surface }]}>
        {FEATURES.map(({ icon: Icon, label, sub }, i) => (
          <RNView
            key={label}
            style={[
              styles.featureRow,
              i < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.border },
            ]}
          >
            <RNView style={[styles.featureIcon, { backgroundColor: t.accentBg }]}>
              <Icon size={18} color={t.accent} strokeWidth={2} />
            </RNView>
            <RNView style={styles.featureText}>
              <Text style={[styles.featureLabel, { color: t.textPrimary }]}>{label}</Text>
              <Text style={[styles.featureSub, { color: t.textSecondary }]}>{sub}</Text>
            </RNView>
          </RNView>
        ))}
      </View>

      {/* ── Packages ── */}
      <View style={styles.packages}>
        {packages.map((pkg) => {
          const isSelected = selectedPackage?.identifier === pkg.identifier;
          const isAnnual = pkg.packageType === 'ANNUAL';
          const isLifetime = pkg.packageType === 'LIFETIME';

          return (
            <TouchableOpacity
              key={pkg.identifier}
              activeOpacity={0.8}
              style={[
                styles.packageCard,
                { borderColor: isSelected ? t.primary : t.border, backgroundColor: t.surface },
                isSelected && { borderColor: t.primary, backgroundColor: t.accentBg },
              ]}
              onPress={() => setSelectedPackage(pkg)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${pkg.packageType} plan, ${pkg.product.priceString}`}
            >
              {/* Recommended badge */}
              {isAnnual && (
                <RNView style={[styles.badge, { backgroundColor: t.primary }]}>
                  <Text style={[styles.badgeText, { color: t.primaryText }]}>BEST VALUE</Text>
                </RNView>
              )}

              <RNView style={styles.packageRow}>
                <RNView style={styles.packageLeft}>
                  <Text style={[styles.packageTitle, { color: t.textPrimary }]}>
                    {pkg.packageType === 'MONTHLY' && 'Monthly'}
                    {isAnnual && 'Yearly'}
                    {isLifetime && 'Lifetime'}
                  </Text>
                  {isLifetime && (
                    <RNView style={styles.lifetimeRow}>
                      <Infinity size={12} color={t.textSecondary} strokeWidth={2} />
                      <Text style={[styles.lifetimeSub, { color: t.textSecondary }]}>
                        {' '}One-time payment
                      </Text>
                    </RNView>
                  )}
                  {isAnnual && annualSavingsPct !== null && (
                    <Text style={[styles.savings, { color: t.safe }]}>
                      Save {annualSavingsPct}% vs monthly
                    </Text>
                  )}
                </RNView>

                <RNView style={styles.packageRight}>
                  <Text style={[styles.packagePrice, { color: isSelected ? t.primary : t.textPrimary }]}>
                    {pkg.product.priceString}
                  </Text>
                  {!isLifetime && (
                    <Text style={[styles.packagePeriod, { color: t.textSecondary }]}>
                      /{pkg.packageType === 'MONTHLY' ? 'mo' : 'yr'}
                    </Text>
                  )}
                </RNView>
              </RNView>

              {/* Selected indicator */}
              {isSelected && (
                <RNView style={[styles.selectedDot, { backgroundColor: t.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
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

      {selectedPackage?.packageType !== 'LIFETIME' && (
        <Text style={[styles.trialNote, { color: t.textSecondary }]}>
          30-day free trial · Cancel anytime
        </Text>
      )}

      {/* ── Restore ── */}
      <TouchableOpacity
        onPress={handleRestore}
        disabled={isPurchasing}
        accessibilityRole="button"
        accessibilityLabel="Restore purchases"
      >
        <Text style={[styles.restoreText, { color: t.textMuted }]}>Restore Purchases</Text>
      </TouchableOpacity>

      {error && <Text style={[styles.error, { color: t.risky }]}>{error}</Text>}

      <Text style={[styles.terms, { color: t.textMuted }]}>
        Payment charged to your Google Play account at confirmation. Subscription renews
        automatically unless cancelled at least 24 hours before the end of the period.
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
    padding: 20,
    paddingBottom: 48,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.nunitoBold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Packages
  packages: {
    gap: 10,
    marginBottom: 20,
  },
  packageCard: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageLeft: {
    flex: 1,
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  packageTitle: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    marginBottom: 2,
  },
  packagePrice: {
    fontSize: 22,
    fontFamily: fonts.interBold,
  },
  packagePeriod: {
    fontSize: 12,
    marginTop: 2,
  },
  savings: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    marginTop: 2,
  },
  lifetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lifetimeSub: {
    fontSize: 12,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  badgeText: {
    fontSize: 10,
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
    fontSize: 17,
    fontFamily: fonts.interBold,
  },
  trialNote: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 20,
  },

  // Footer
  restoreText: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 20,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  terms: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
