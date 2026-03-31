import { useState } from 'react';
import { StyleSheet, Pressable, Modal } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAppTheme } from '@/theme';

export default function StatusTooltip() {
  const [visible, setVisible] = useState(false);
  const t = useAppTheme();

  const tiers = [
    { status: 'SAFE', icon: '✓', color: t.safe, description: 'Swiping now is unlikely to cause payment stress this cycle.' },
    { status: 'CAUTION', icon: '⚠', color: t.caution, description: 'Your statement is closing soon or utilization is getting high.' },
    { status: 'RISKY', icon: '✕', color: t.risky, description: 'Swiping now could make it hard to pay your bill on time.' },
  ];

  return (
    <>
      <Pressable
        style={styles.infoButton}
        onPress={() => setVisible(true)}
        hitSlop={8}
      >
        <Text style={[styles.infoIcon, { color: t.textMuted }]}>ⓘ</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={[styles.overlay, { backgroundColor: t.overlay }]} onPress={() => setVisible(false)}>
          <View style={[styles.tooltip, { borderColor: t.border }]}>
            <Text style={styles.tooltipTitle}>How status works</Text>
            {tiers.map((tier) => (
              <View key={tier.status} style={styles.tierRow}>
                <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                  <Text style={[styles.tierBadgeText, { color: t.textInverse }]}>{tier.icon} {tier.status}</Text>
                </View>
                <Text style={[styles.tierDescription, { color: t.textSecondary }]}>{tier.description}</Text>
              </View>
            ))}
            <Pressable style={styles.dismissButton} onPress={() => setVisible(false)}>
              <Text style={[styles.dismissText, { color: t.safe }]}>Got it</Text>
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
    padding: 32,
  },
  tooltip: {
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  tierRow: {
    marginBottom: 12,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tierDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
