import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShieldCheck, CalendarDays, CreditCard } from 'lucide-react-native';

import { Text } from '@/components/Themed';
import { Button } from '@/components/atoms';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import {
  trackOnboardingWelcomeViewed,
  trackOnboardingGetStartedTapped,
} from '@/utils/analytics';

const falclyLogo = require('@/assets/images/icon.png');

const BENEFITS = [
  { Icon: ShieldCheck, label: 'Know if it\'s safe to swipe each card' },
  { Icon: CalendarDays, label: 'Which cycle each purchase lands on' },
  { Icon: CreditCard, label: 'Exactly what to pay and when' },
];

export default function WelcomeScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    trackOnboardingWelcomeViewed();
  }, []);

  function handleGetStarted() {
    trackOnboardingGetStartedTapped();
    router.push('/onboarding');
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: t.background,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Image source={falclyLogo} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={[styles.headline, { color: t.textPrimary }]}>
          Know before{'\n'}you swipe.
        </Text>

        <Text style={[styles.subheadline, { color: t.textSecondary }]}>
          Falcly tells you if it's safe to use your credit card — before you swipe.
        </Text>
      </View>

      <View style={[styles.benefits, { backgroundColor: t.surface }]}>
        {BENEFITS.map((b, i) => (
          <View
            key={b.label}
            style={[
              styles.benefitRow,
              i < BENEFITS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
            ]}
          >
            <b.Icon size={22} color={t.primary} strokeWidth={2} />
            <Text style={[styles.benefitLabel, { color: t.textPrimary }]}>
              {b.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.cta}>
        <Button label="Get Started" onPress={handleGetStarted} />
        <Text style={[styles.footnote, { color: t.textMuted }]}>
          No sign-up required
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    gap: 4,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 96,
    height: 96,
  },
  headline: {
    fontSize: 34,
    fontFamily: fonts.nunitoBold,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 16,
    fontFamily: fonts.interRegular,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  benefits: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  benefitLabel: {
    fontSize: 15,
    fontFamily: fonts.interMedium,
    flex: 1,
  },
  cta: {
    gap: 12,
    alignItems: 'center',
  },
  footnote: {
    fontSize: 13,
    fontFamily: fonts.interRegular,
  },
});
