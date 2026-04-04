import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Text, View } from '@/components/Themed';
import { ENTITLEMENT_ID } from '@/utils/revenuecat';
import { useAppTheme } from '@/theme';

export default function ProPaywallScreen() {
  const router = useRouter();
  const t = useAppTheme();
  const [isPresenting, setIsPresenting] = useState(false);

  useEffect(() => {
    presentPaywall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function presentPaywall() {
    if (isPresenting) return;
    setIsPresenting(true);

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.CANCELLED:
          router.back();
          break;
        case PAYWALL_RESULT.ERROR:
          Alert.alert('Error', 'Something went wrong. Please try again.');
          router.back();
          break;
      }
    } catch (error) {
      console.error('Paywall error:', error);
      router.back();
    } finally {
      setIsPresenting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <ActivityIndicator size="large" color={t.primary} />
      <Text style={[styles.text, { color: t.textPrimary }]}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});
