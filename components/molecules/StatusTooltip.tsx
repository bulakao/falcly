import { useState } from 'react';
import { StyleSheet, Pressable, Modal, View as RNView } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

interface StatusTooltipProps {
  children?: React.ReactNode;
}

export default function StatusTooltip({ children }: StatusTooltipProps) {
  const [visible, setVisible] = useState(false);
  const t = useAppTheme();

  const tiers = [
    { status: 'SAFE', color: t.safe, bg: t.safeBg, description: 'Good to swipe — unlikely to cause payment stress this cycle.' },
    { status: 'CAUTION', color: t.caution, bg: t.cautionBg, description: 'Be careful — statement closing soon or utilization getting high.' },
    { status: 'RISKY', color: t.risky, bg: t.riskyBg, description: 'Hold off — swiping could make it hard to pay on time.' },
  ];

  return (
    <>
      <Pressable
        style={!children ? styles.infoButton : undefined}
        onPress={() => setVisible(true)}
        hitSlop={8}
      >
        {children ?? <Text style={[styles.infoIcon, { color: t.textMuted }]}>ⓘ</Text>}
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={[styles.overlay, { backgroundColor: t.overlay }]} onPress={() => setVisible(false)}>
          <View style={[styles.tooltip, { borderColor: t.border }]}>
            <Text style={[styles.tooltipTitle, { color: t.textPrimary }]}>How status works</Text>
            <Text style={[styles.tooltipSubtitle, { color: t.textMuted }]}>
              Falcly checks your balance, credit limit, and billing cycle to determine if it&apos;s safe to swipe.
            </Text>

            {tiers.map((tier) => (
              <View key={tier.status} style={[styles.tierCard, { backgroundColor: tier.bg }]}>
                <View style={styles.tierHeader}>
                  <RNView style={[styles.tierDot, { backgroundColor: tier.color, shadowColor: tier.color }]} />
                  <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.status}</Text>
                </View>
                <Text style={[styles.tierDescription, { color: t.textSecondary }]}>{tier.description}</Text>
              </View>
            ))}

            <Pressable
              style={[styles.dismissButton, { borderColor: t.primary }]}
              onPress={() => setVisible(false)}
            >
              <Text style={[styles.dismissText, { color: t.primary }]}>Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoButton: {
    marginLeft: 6,
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltip: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  tooltipTitle: {
    fontSize: 20,
    fontFamily: fonts.interBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  tooltipSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
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
  dismissButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 15,
    fontFamily: fonts.interBold,
  },
});
