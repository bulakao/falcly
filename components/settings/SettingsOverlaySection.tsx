import { StyleSheet, Pressable, Alert, Switch, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useOverlayStore } from '@/store/overlayStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Button } from '@/components/atoms';
import { SurfaceCard } from '@/components/molecules';

export function SettingsOverlaySection() {
  const t = useAppTheme();
  const router = useRouter();
  const overlayPrefs = useOverlayStore((s) => s.overlayPrefs);
  const setOverlayPrefs = useOverlayStore((s) => s.setOverlayPrefs);
  const resetDismissed = useOverlayStore((s) => s.resetDismissed);
  const proUser = useSubscriptionStore((s) => s.isPro)();

  return (
    <>
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Card Tips & Alerts</Text>
      <SurfaceCard>
        <RNView style={styles.valueRow}>
          <RNView style={{ flex: 1 }}>
            <RNView style={styles.lockRow}>
              <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Show card overlays</Text>
              {!proUser && <FontAwesome name="lock" size={12} color={t.textMuted} />}
            </RNView>
            <Text style={[styles.itemHint, { color: t.textMuted }]}>
              {proUser ? 'Master switch for all overlay types' : 'Upgrade to Pro to control overlays'}
            </Text>
          </RNView>
          <Switch
            value={overlayPrefs.enabled}
            onValueChange={(v) => { if (proUser) setOverlayPrefs({ enabled: v }); }}
            disabled={!proUser}
          />
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <RNView style={styles.valueRow}>
          <RNView style={styles.lockRow}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Alerts</Text>
            {!proUser && <FontAwesome name="lock" size={12} color={t.textMuted} />}
          </RNView>
          <Switch value={overlayPrefs.alerts} onValueChange={(v) => { if (proUser) setOverlayPrefs({ alerts: v }); }} disabled={!proUser} />
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <RNView style={styles.valueRow}>
          <RNView style={styles.lockRow}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Statement tips</Text>
            {!proUser && <FontAwesome name="lock" size={12} color={t.textMuted} />}
          </RNView>
          <Switch value={overlayPrefs.statements} onValueChange={(v) => { if (proUser) setOverlayPrefs({ statements: v }); }} disabled={!proUser} />
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <RNView style={styles.valueRow}>
          <RNView style={styles.lockRow}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Educational tips</Text>
            {!proUser && <FontAwesome name="lock" size={12} color={t.textMuted} />}
          </RNView>
          <Switch value={overlayPrefs.tips} onValueChange={(v) => { if (proUser) setOverlayPrefs({ tips: v }); }} disabled={!proUser} />
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <RNView style={styles.valueRow}>
          <RNView style={styles.lockRow}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Promotions</Text>
            {!proUser && <FontAwesome name="lock" size={12} color={t.textMuted} />}
          </RNView>
          <Switch value={overlayPrefs.promos} onValueChange={(v) => { if (proUser) setOverlayPrefs({ promos: v }); }} disabled={!proUser} />
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <RNView style={styles.valueRow}>
          <RNView style={styles.lockRow}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Partner offers</Text>
            {!proUser && <FontAwesome name="lock" size={12} color={t.textMuted} />}
          </RNView>
          <Switch value={overlayPrefs.affiliates} onValueChange={(v) => { if (proUser) setOverlayPrefs({ affiliates: v }); }} disabled={!proUser} />
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        {/* Frequency picker */}
        <Pressable
          style={styles.defaultRow}
          onPress={() => {
            if (!proUser) { router.push('/paywall-manual' as any); return; }
            const options = [
              { label: 'Daily', value: 1 },
              { label: 'Every 3 days', value: 3 },
              { label: 'Weekly', value: 7 },
              { label: 'Monthly', value: 30 },
            ];
            const current = overlayPrefs.frequencyDays;
            const idx = options.findIndex((o) => o.value === current);
            const next = options[(idx + 1) % options.length];
            setOverlayPrefs({ frequencyDays: next.value });
          }}
          accessibilityRole="button"
          accessibilityLabel={`Tip frequency: ${overlayPrefs.frequencyDays === 1 ? 'Daily' : overlayPrefs.frequencyDays === 3 ? 'Every 3 days' : overlayPrefs.frequencyDays === 7 ? 'Weekly' : 'Monthly'}`}
        >
          <RNView style={styles.lockRow}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Tip frequency</Text>
            {!proUser && <FontAwesome name="lock" size={12} color={t.textMuted} />}
          </RNView>
          <Text style={[styles.defaultValue, { color: proUser ? t.primary : t.textMuted }]}>
            {overlayPrefs.frequencyDays === 1 ? 'Daily' : overlayPrefs.frequencyDays === 3 ? 'Every 3 days' : overlayPrefs.frequencyDays === 7 ? 'Weekly' : 'Monthly'}
          </Text>
        </Pressable>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        {/* Reset dismissed */}
        <Button
          label={proUser ? 'Reset dismissed tips' : 'Unlock 🔒'}
          variant="secondary"
          onPress={() => {
            if (!proUser) {
              router.push('/paywall-manual' as any);
              return;
            }
            resetDismissed();
            Alert.alert('Tips Reset', 'All dismissed tips have been restored.');
          }}
        />
      </SurfaceCard>
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    marginBottom: 8,
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  itemLabel: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  itemHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  defaultValue: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
  },
});
