import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { PurchasesPackage } from 'react-native-purchases';
import { trackProPurchaseCompleted } from '@/utils/analytics';

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
      Alert.alert('Success!', 'Welcome to Falcly Pro!', [
        { text: 'OK', onPress: () => router.back() },
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
      Alert.alert('No Purchases', 'No previous purchases found.');
    }
  }

  if (isLoading && !offerings) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  const packages = offerings?.availablePackages ?? [];

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: t.textPrimary }]}>Upgrade to Pro</Text>
      <Text style={[styles.subtitle, { color: t.textSecondary }]}>
        Unlock all features and take control of your credit cards
      </Text>

      <View style={styles.features}>
        {['Unlimited cards', 'Payoff planner', 'Control card overlays', 'Priority support'].map(
          (label) => (
            <Text key={label} style={[styles.feature, { color: t.textPrimary }]}>
              {'\u2713'} {label}
            </Text>
          ),
        )}
      </View>

      <View style={styles.packages}>
        {packages.map((pkg) => {
          const isSelected = selectedPackage?.identifier === pkg.identifier;
          const product = pkg.product;

          return (
            <TouchableOpacity
              key={pkg.identifier}
              style={[
                styles.packageCard,
                { borderColor: isSelected ? t.primary : t.border },
                isSelected && { backgroundColor: t.primary + '10' },
              ]}
              onPress={() => setSelectedPackage(pkg)}
            >
              <Text style={[styles.packageTitle, { color: t.textPrimary }]}>
                {pkg.packageType === 'MONTHLY' && 'Monthly'}
                {pkg.packageType === 'ANNUAL' && 'Yearly'}
                {pkg.packageType === 'LIFETIME' && 'Lifetime'}
              </Text>
              <Text style={[styles.packagePrice, { color: t.primary }]}>
                {product.priceString}
                {pkg.packageType !== 'LIFETIME' && (
                  <Text style={styles.packagePeriod}>
                    /{pkg.packageType === 'MONTHLY' ? 'mo' : 'yr'}
                  </Text>
                )}
              </Text>
              {pkg.packageType === 'ANNUAL' && (
                <Text style={[styles.savings, { color: t.safe }]}>Save 20%</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          { backgroundColor: selectedPackage ? t.primary : t.border },
        ]}
        onPress={handlePurchase}
        disabled={!selectedPackage || isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.purchaseButtonText}>
            {selectedPackage ? 'Subscribe Now' : 'Select a Plan'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
        <Text style={[styles.restoreText, { color: t.textSecondary }]}>Restore Purchases</Text>
      </TouchableOpacity>

      {error && <Text style={[styles.error, { color: t.risky }]}>{error}</Text>}

      <Text style={[styles.terms, { color: t.textSecondary }]}>
        Payment will be charged to your Google Play account. Subscription automatically renews
        unless cancelled at least 24 hours before the end of the current period.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.nunitoBold,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  features: {
    marginBottom: 24,
  },
  feature: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
    marginVertical: 4,
  },
  packages: {
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  packageTitle: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
  packagePrice: {
    fontSize: 24,
    fontFamily: fonts.interBold,
    marginTop: 4,
  },
  packagePeriod: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  savings: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    marginTop: 4,
  },
  purchaseButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.interSemiBold,
  },
  restoreText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  terms: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
