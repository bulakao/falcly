import { useState } from 'react';
import { StyleSheet, Pressable, Alert, Switch, Platform, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { Text } from '@/components/Themed';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useOverlayStore } from '@/store/overlayStore';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { Button } from '@/components/atoms';
import { BottomSheet, SurfaceCard } from '@/components/molecules';

export function SettingsOverlaySection() {
  const t = useAppTheme();
  const router = useRouter();
  const overlayPrefs = useOverlayStore((s) => s.overlayPrefs);
  const setOverlayPrefs = useOverlayStore((s) => s.setOverlayPrefs);
  const resetDismissed = useOverlayStore((s) => s.resetDismissed);
  const proUser = useSubscriptionStore((s) => s.isPro)();
  const [frequencyPickerVisible, setFrequencyPickerVisible] = useState(false);

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
        <RNView style={styles.valueRow}>
          <RNView style={styles.lockRow}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Tip frequency</Text>
            {!proUser && <FontAwesome name="lock" size={12} color={t.textMuted} />}
          </RNView>
          {Platform.OS === 'android' ? (
            <RNView style={[styles.frequencyPicker, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
              <Picker
                selectedValue={overlayPrefs.frequencyDays}
                onValueChange={(v) => { if (proUser) setOverlayPrefs({ frequencyDays: v }); }}
                enabled={proUser}
                style={{ color: t.inputText }}
                dropdownIconColor={t.textMuted}
              >
                <Picker.Item label="Daily" value={1} />
                <Picker.Item label="Every 3 days" value={3} />
                <Picker.Item label="Weekly" value={7} />
                <Picker.Item label="Monthly" value={30} />
              </Picker>
            </RNView>
          ) : (
            <Pressable
              onPress={() => { if (!proUser) { router.push('/paywall-manual' as any); return; } setFrequencyPickerVisible(true); }}
              accessibilityRole="button"
              accessibilityLabel={`Tip frequency: ${overlayPrefs.frequencyDays === 1 ? 'Daily' : overlayPrefs.frequencyDays === 3 ? 'Every 3 days' : overlayPrefs.frequencyDays === 7 ? 'Weekly' : 'Monthly'}`}
              style={[styles.frequencyDropdown, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}
            >
              <Text style={[styles.frequencyValue, { color: proUser ? t.inputText : t.textMuted }]}>
                {overlayPrefs.frequencyDays === 1 ? 'Daily' : overlayPrefs.frequencyDays === 3 ? 'Every 3 days' : overlayPrefs.frequencyDays === 7 ? 'Weekly' : 'Monthly'}
              </Text>
              <FontAwesome name="chevron-down" size={12} color={t.textMuted} />
            </Pressable>
          )}
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        {/* Reset dismissed */}
        <Button
          label={proUser ? 'Reset dismissed tips' : 'Unlock 🔒'}
          variant="primary"
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
      {Platform.OS === 'ios' && (
        <BottomSheet
          visible={frequencyPickerVisible}
          onClose={() => setFrequencyPickerVisible(false)}
          title="Tip Frequency"
        >
          <Picker
            selectedValue={overlayPrefs.frequencyDays}
            onValueChange={(v) => setOverlayPrefs({ frequencyDays: v })}
            accessibilityLabel="Tip frequency"
            itemStyle={{ color: t.textPrimary }}
          >
            <Picker.Item label="Daily" value={1} />
            <Picker.Item label="Every 3 days" value={3} />
            <Picker.Item label="Weekly" value={7} />
            <Picker.Item label="Monthly" value={30} />
          </Picker>
        </BottomSheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interRegular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  itemLabel: {
    fontSize: typeScale.body,
    fontFamily: fonts.interRegular,
    marginBottom: 4,
  },
  itemHint: {
    fontSize: typeScale.caption,
    lineHeight: 17,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  defaultValue: {
    fontSize: typeScale.body,
    fontFamily: fonts.interRegular,
  },
  frequencyPicker: {
    width: '40%',
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  frequencyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '40%',
    gap: 6,
  },
  frequencyValue: {
    fontSize: typeScale.body,
    fontFamily: fonts.interRegular,
  },
});
