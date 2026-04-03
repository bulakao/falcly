import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Appearance,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAppTheme, useEffectiveColorScheme, palette } from '@/theme';
import { Button, Badge, FormInput, Heading, SectionHeader, Label, Caption } from '@/components/atoms';
import { fonts } from '@/theme/fonts';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useAppTheme();
  return (
    <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.sectionTitle, { color: t.accent }]}>{title}</Text>
      {children}
    </View>
  );
}

const noop = () => {};

export default function ComponentShowcase() {
  const t = useAppTheme();
  const scheme = useEffectiveColorScheme();
  const dark = scheme === 'dark';

  const [switchVal, setSwitchVal] = useState(true);
  const [inputText, setInputText] = useState('');

  function toggleTheme() {
    Appearance.setColorScheme(dark ? 'light' : 'dark');
  }

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: t.background }]} contentContainerStyle={styles.container}>
      {/* Theme Toggle */}
      <View style={[styles.themeToggle, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.themeLabel, { color: t.textPrimary }]}>
          {dark ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </Text>
        <Pressable
          style={[styles.themeButton, { backgroundColor: t.primary }]}
          onPress={toggleTheme}
        >
          <Text style={[styles.themeButtonText, { color: t.primaryText }]}>
            Switch to {dark ? 'Light' : 'Dark'}
          </Text>
        </Pressable>
      </View>

      {/* Color Swatches */}
      <Section title="Color Palette">
        <View style={styles.swatchGrid}>
          {[
            { name: 'Slate Charcoal', color: palette.slateCharcoal },
            { name: 'Deep Navy', color: palette.deepNavy },
            { name: 'Amber Gold', color: palette.amberGold },
            { name: 'Warm Taupe', color: palette.warmTaupe },
            { name: 'Pale Silver', color: palette.paleSilver },
            { name: 'Muted', color: palette.muted },
            { name: 'Teal (SAFE)', color: palette.teal },
            { name: 'Caution', color: palette.amberGold },
            { name: 'Crimson (RISKY)', color: palette.crimson },
          ].map((s) => (
            <View key={s.name} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: s.color, borderColor: t.border }]} />
              <Text style={[styles.swatchLabel, { color: t.textSecondary }]}>{s.name}</Text>
              <Text style={[styles.swatchHex, { color: t.textSecondary }]}>{s.color}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <Heading>Heading — Bold 24</Heading>
        <SectionHeader title="Section Header" subtitle="With an optional subtitle below it" />
        <Label>Label — Semibold 13</Label>
        <Caption>Caption — Regular 12. Updated 3 hours ago</Caption>
        <Text style={[styles.typeBody, { color: t.textPrimary }]}>
          Body text — Regular 15. Is it safe to swipe right now? Only math can decide.
        </Text>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <View style={styles.buttonGap}>
          <Button label="Primary Action" onPress={noop} />
        </View>
        <View style={styles.buttonGap}>
          <Button label="Secondary Action" onPress={noop} variant="secondary" />
        </View>
        <View style={styles.buttonGap}>
          <Button label="Delete Card" onPress={noop} variant="destructive" />
        </View>
        <View style={styles.buttonGap}>
          <Button label="Ghost / Link" onPress={noop} variant="ghost" />
        </View>
        <View style={styles.buttonGap}>
          <Button label="Disabled" onPress={noop} disabled />
        </View>
      </Section>

      {/* Status Badges */}
      <Section title="Status Badges">
        <View style={styles.badgeRow}>
          <Badge label="✓ SAFE" variant="safe" />
          <Badge label="⚠ CAUTION" variant="caution" />
          <Badge label="✕ RISKY" variant="risky" />
        </View>
        <View style={[styles.badgeRow, { marginTop: 12 }]}>
          <Badge label="PRO" variant="pro" />
          <Badge label="FREE TRIAL" variant="outline" />
          <Badge label="⚠ STALE" variant="stale" />
        </View>
      </Section>

      {/* Cards */}
      <Section title="Card Components">
        <View style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
          <View style={[styles.cardHeader, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.cardTitle, { color: t.textPrimary }]}>BPI Visa Gold</Text>
            <Badge label="✓ SAFE" variant="safe" />
          </View>
          <Text style={[styles.cardBody, { color: t.textSecondary }]}>₱12,450 / ₱80,000 limit</Text>
          <View style={[styles.cardFooter, { backgroundColor: 'transparent', borderTopColor: t.border }]}>
            <Caption>Statement closes in 12 days</Caption>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: t.riskyBg, borderColor: t.risky, borderWidth: 1.5 }]}>
          <View style={[styles.cardHeader, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.cardTitle, { color: t.risky }]}>Metrobank Platinum</Text>
            <Badge label="✕ RISKY" variant="risky" />
          </View>
          <Text style={[styles.cardBody, { color: t.textSecondary }]}>₱147,200 / ₱150,000 limit</Text>
          <View style={[styles.cardFooter, { backgroundColor: 'transparent', borderTopColor: t.riskyBorder }]}>
            <Caption color={t.risky}>Due in 3 days — minimum ₱7,360</Caption>
          </View>
        </View>
      </Section>

      {/* Form Inputs */}
      <Section title="Form Inputs">
        <Label>Amount</Label>
        <FormInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="25,000"
          keyboardType="numeric"
        />

        <View style={{ marginTop: 16 }}>
          <Label>Focused Input</Label>
          <FormInput value="₱40,000" focused editable={false} />
        </View>

        <View style={{ marginTop: 16 }}>
          <Label>Error Input</Label>
          <FormInput value="abc" error editable={false} />
          <Caption color={t.risky}>Enter a valid amount</Caption>
        </View>
      </Section>

      {/* Toggle / Switch */}
      <Section title="Toggles & Switches">
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Analytics opt-out</Text>
          <Switch
            value={switchVal}
            onValueChange={setSwitchVal}
            trackColor={{ false: t.primaryMuted, true: t.primary }}
            thumbColor={switchVal ? t.primaryText : t.textInverse}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Cloud sync</Text>
          <Switch
            value={false}
            trackColor={{ false: t.primaryMuted, true: t.primary }}
            thumbColor={t.textInverse}
            disabled
          />
        </View>
      </Section>

      {/* Alerts / Notices */}
      <Section title="Alerts & Notices">
        <View style={[styles.alert, { backgroundColor: t.safeBg, borderColor: t.safe }]}>
          <Text style={[styles.alertText, { color: t.safe }]}>✓ Balance updated successfully</Text>
        </View>
        <View style={[styles.alert, { backgroundColor: t.cautionBg, borderColor: t.caution }]}>
          <Text style={[styles.alertText, { color: t.cautionText }]}>⚠ Cash amount may be outdated — tap to update</Text>
        </View>
        <View style={[styles.alert, { backgroundColor: t.riskyBg, borderColor: t.risky }]}>
          <Text style={[styles.alertText, { color: t.risky }]}>✕ Export failed — check storage permissions</Text>
        </View>
        <View style={[styles.alert, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.alertText, { color: t.textSecondary }]}>
            ℹ Income is factored into projections only when payday falls before your due date
          </Text>
        </View>
      </Section>

      {/* Progress / Timeline Bars */}
      <Section title="Progress Indicators">
        <Caption>Credit utilization — 15% (SAFE)</Caption>
        <View style={[styles.progressTrack, { backgroundColor: t.primaryMuted }]}>
          <View style={[styles.progressFill, { width: '15%', backgroundColor: t.safe }]} />
        </View>

        <View style={{ marginTop: 16 }}>
          <Caption>Credit utilization — 65% (CAUTION)</Caption>
          <View style={[styles.progressTrack, { backgroundColor: t.primaryMuted }]}>
            <View style={[styles.progressFill, { width: '65%', backgroundColor: t.caution }]} />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <Caption>Credit utilization — 92% (RISKY)</Caption>
          <View style={[styles.progressTrack, { backgroundColor: t.primaryMuted }]}>
            <View style={[styles.progressFill, { width: '92%', backgroundColor: t.risky }]} />
          </View>
        </View>
      </Section>

      {/* Divider Styles */}
      <Section title="Dividers & Separators">
        <View style={[styles.divider, { backgroundColor: t.border }]} />
        <View style={[styles.dividerThick, { backgroundColor: t.accent }]} />
        <View style={[styles.dividerDashed, { borderColor: t.border }]} />
      </Section>

      {/* List Items */}
      <Section title="List Items">
        <Pressable style={[styles.listItem, { borderBottomColor: t.border }]}>
          <View style={styles.listItemContent}>
            <Text style={[styles.listTitle, { color: t.textPrimary }]}>Funds Available</Text>
            <Caption>Updated 2h ago</Caption>
          </View>
          <Text style={[styles.listValue, { color: t.accent }]}>₱25,000</Text>
        </Pressable>
        <Pressable style={[styles.listItem, { borderBottomColor: t.border }]}>
          <View style={styles.listItemContent}>
            <Text style={[styles.listTitle, { color: t.textPrimary }]}>Monthly Income</Text>
            <Caption>Payday: 15th</Caption>
          </View>
          <Text style={[styles.listValue, { color: t.textPrimary }]}>₱40,000</Text>
        </Pressable>
        <Pressable style={[styles.listItem, { borderBottomColor: 'transparent' }]}>
          <View style={styles.listItemContent}>
            <Text style={[styles.listTitle, { color: t.textPrimary }]}>Committed Expenses</Text>
            <Caption>Rent, utils, etc.</Caption>
          </View>
          <Text style={[styles.listValue, { color: t.textPrimary }]}>₱15,000</Text>
        </Pressable>
      </Section>

      <View style={{ height: 48, backgroundColor: 'transparent' }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 48 },

  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  themeLabel: { fontSize: 16, fontFamily: fonts.interBold },
  themeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  themeButtonText: { fontSize: 13, fontFamily: fonts.interBold },

  section: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.nunitoBold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },

  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: 'transparent' },
  swatchItem: { alignItems: 'center', width: 90, backgroundColor: 'transparent' },
  swatch: { width: 56, height: 56, borderRadius: 12, borderWidth: 1 },
  swatchLabel: { fontSize: 10, fontFamily: fonts.interSemiBold, marginTop: 6, textAlign: 'center' },
  swatchHex: { fontSize: 9, marginTop: 2 },

  typeBody: { fontSize: 15, lineHeight: 22, marginBottom: 8 },

  buttonGap: { marginBottom: 10 },

  badgeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', backgroundColor: 'transparent' },

  card: { borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  cardTitle: { fontSize: 16, fontFamily: fonts.interBold },
  cardBody: { fontSize: 14, paddingHorizontal: 16, paddingBottom: 12 },
  cardFooter: { borderTopWidth: 1, padding: 12, paddingHorizontal: 16 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, backgroundColor: 'transparent' },
  toggleLabel: { fontSize: 15, fontFamily: fonts.interSemiBold },

  alert: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 },
  alertText: { fontSize: 13, fontFamily: fonts.interSemiBold },

  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  divider: { height: 1, marginVertical: 12 },
  dividerThick: { height: 3, borderRadius: 2, marginVertical: 12 },
  dividerDashed: { height: 0, borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 12 },

  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, backgroundColor: 'transparent' },
  listItemContent: { backgroundColor: 'transparent', flex: 1 },
  listTitle: { fontSize: 15, fontFamily: fonts.interSemiBold },
  listValue: { fontSize: 18, fontFamily: fonts.interBold },
});
