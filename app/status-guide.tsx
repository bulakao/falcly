import { StyleSheet, ScrollView, Pressable, View as RNView } from 'react-native';
import { Text } from '@/components/Themed';
import { X } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

export default function StatusGuideScreen() {
  const t = useAppTheme();

  const rules = [
    { status: 'RISKY', icon: '✕', rule: "Not enough funds available to cover the minimum payment" },
    { status: 'RISKY', icon: '✕', rule: 'Statement closes within 2 days' },
    { status: 'RISKY', icon: '✕', rule: 'Credit utilization is above 80%' },
    { status: 'CAUTION', icon: '⚠', rule: 'Statement closes within 7 days' },
    { status: 'CAUTION', icon: '⚠', rule: 'Credit utilization is above 50%' },
    { status: 'SAFE', icon: '✓', rule: "None of the above — you're good to go" },
  ];

  const tiers = [
    { status: 'SAFE', color: t.safe, bg: t.safeBg, description: 'Good to swipe — unlikely to cause payment stress this cycle.' },
    { status: 'CAUTION', color: t.caution, bg: t.cautionBg, description: 'Be careful — statement closing soon or utilization getting high.' },
    { status: 'RISKY', color: t.risky, bg: t.riskyBg, description: 'Hold off — swiping could make it hard to pay on time.' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.background }]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ justifyContent: 'center', alignItems: 'center', width: 32, height: 32, paddingLeft: 4 }}>
              <X size={20} color={t.textMuted} />
            </Pressable>
          ),
        }}
      />
      <Text style={[styles.subtitle, { color: t.textMuted }]}>
        Falcly checks your balance, credit limit, and billing cycle to determine if it&apos;s safe to swipe.
      </Text>

      {tiers.map((tier) => {
        const tierRules = rules.filter((r) => r.status === tier.status);
        return (
          <RNView key={tier.status} style={[styles.tierCard, { backgroundColor: tier.bg }]}>
            <RNView style={styles.tierHeader}>
              <RNView style={[styles.tierDot, { backgroundColor: tier.color, shadowColor: tier.color }]} />
              <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.status}</Text>
            </RNView>
            <Text style={[styles.tierDescription, { color: t.textSecondary }]}>{tier.description}</Text>
            {tierRules.length > 0 && (
              <RNView style={styles.tierRules}>
                {tierRules.map((item, i) => (
                  <RNView key={i} style={styles.ruleRow}>
                    <Text style={[styles.ruleIcon, { color: tier.color }]}>{item.icon}</Text>
                    <Text style={[styles.ruleText, { color: t.textSecondary }]}>{item.rule}</Text>
                  </RNView>
                ))}
              </RNView>
            )}
          </RNView>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  tierRules: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  ruleIcon: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    width: 20,
    marginTop: 2,
  },
  ruleText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  tierCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  tierLabel: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    letterSpacing: 0.5,
  },
  tierDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
