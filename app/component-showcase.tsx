import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Appearance,
  useColorScheme,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAppTheme, palette } from '@/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useAppTheme();
  return (
    <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.sectionTitle, { color: t.accent }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function ComponentShowcase() {
  const t = useAppTheme();
  const scheme = useColorScheme();
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
        <Text style={[styles.typeHeading, { color: t.textPrimary }]}>Heading — Bold 24</Text>
        <Text style={[styles.typeSubheading, { color: t.textPrimary }]}>Subheading — Semibold 18</Text>
        <Text style={[styles.typeBody, { color: t.textPrimary }]}>
          Body text — Regular 15. Is it safe to swipe right now? Only math can decide.
        </Text>
        <Text style={[styles.typeCaption, { color: t.textSecondary }]}>Caption — Regular 12. Updated 3 hours ago</Text>
        <Text style={[styles.typeLabel, { color: t.accent }]}>Accent Label — Bold 13</Text>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <Pressable style={[styles.btnPrimary, { backgroundColor: t.primary }]}>
          <Text style={[styles.btnPrimaryText, { color: t.primaryText }]}>Primary Action</Text>
        </Pressable>

        <Pressable style={[styles.btnSecondary, { borderColor: t.primary }]}>
          <Text style={[styles.btnSecondaryText, { color: t.primary }]}>Secondary Action</Text>
        </Pressable>

        <Pressable style={[styles.btnDestructive, { backgroundColor: t.risky }]}>
          <Text style={[styles.btnDestructiveText, { color: t.textInverse }]}>Delete Card</Text>
        </Pressable>

        <Pressable style={styles.btnGhost}>
          <Text style={[styles.btnGhostText, { color: t.primary }]}>Ghost / Link</Text>
        </Pressable>

        <Pressable style={[styles.btnPrimary, { backgroundColor: t.primaryMuted, opacity: 0.6 }]} disabled>
          <Text style={[styles.btnPrimaryText, { color: t.textMuted }]}>Disabled</Text>
        </Pressable>
      </Section>

      {/* Status Badges */}
      <Section title="Status Badges">
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: t.safe }]}>
            <Text style={[styles.badgeText, { color: t.textInverse }]}>✓ SAFE</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: t.caution }]}>
            <Text style={[styles.badgeText, { color: t.primaryText }]}>⚠ CAUTION</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: t.risky }]}>
            <Text style={[styles.badgeText, { color: t.textInverse }]}>✕ RISKY</Text>
          </View>
        </View>
        <View style={[styles.badgeRow, { marginTop: 12 }]}>
          <View style={[styles.badge, { backgroundColor: t.accent }]}>
            <Text style={[styles.badgeText, { color: t.primaryText }]}>PRO</Text>
          </View>
          <View style={[styles.badgeOutline, { borderColor: t.borderStrong }]}>
            <Text style={[styles.badgeOutlineText, { color: t.borderStrong }]}>FREE TRIAL</Text>
          </View>
          <View style={[styles.badgeOutline, { borderColor: t.textMuted }]}>
            <Text style={[styles.staleBadgeText, { color: t.textMuted }]}>STALE</Text>
          </View>
        </View>
      </Section>

      {/* Cards */}
      <Section title="Card Components">
        <View style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
          <View style={[styles.cardHeader, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.cardTitle, { color: t.textPrimary }]}>BPI Visa Gold</Text>
            <View style={[styles.badge, { backgroundColor: t.safe }]}>
              <Text style={[styles.badgeText, { color: t.textInverse }]}>✓ SAFE</Text>
            </View>
          </View>
          <Text style={[styles.cardBody, { color: t.textSecondary }]}>₱12,450 / ₱80,000 limit</Text>
          <View style={[styles.cardFooter, { backgroundColor: 'transparent', borderTopColor: t.border }]}>
            <Text style={[styles.cardFooterText, { color: t.textSecondary }]}>Statement closes in 12 days</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: t.riskyBg, borderColor: t.risky, borderWidth: 1.5 }]}>
          <View style={[styles.cardHeader, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.cardTitle, { color: t.risky }]}>Metrobank Platinum</Text>
            <View style={[styles.badge, { backgroundColor: t.risky }]}>
              <Text style={[styles.badgeText, { color: t.textInverse }]}>✕ RISKY</Text>
            </View>
          </View>
          <Text style={[styles.cardBody, { color: t.textSecondary }]}>₱147,200 / ₱150,000 limit</Text>
          <View style={[styles.cardFooter, { backgroundColor: 'transparent', borderTopColor: t.riskyBorder }]}>
            <Text style={[styles.cardFooterText, { color: t.risky }]}>Due in 3 days — minimum ₱7,360</Text>
          </View>
        </View>
      </Section>

      {/* Form Inputs */}
      <Section title="Form Inputs">
        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Amount</Text>
        <TextInput
          style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.inputText }]}
          placeholder="e.g. 25,000"
          placeholderTextColor={t.placeholder}
          value={inputText}
          onChangeText={setInputText}
          keyboardType="numeric"
        />

        <Text style={[styles.fieldLabel, { color: t.textSecondary, marginTop: 16 }]}>Focused Input</Text>
        <TextInput
          style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.primary, borderWidth: 2, color: t.inputText }]}
          placeholder="Active state"
          placeholderTextColor={t.placeholder}
          value="₱40,000"
          editable={false}
        />

        <Text style={[styles.fieldLabel, { color: t.textSecondary, marginTop: 16 }]}>Error Input</Text>
        <TextInput
          style={[styles.input, { backgroundColor: t.riskyBg, borderColor: t.risky, borderWidth: 2, color: t.risky }]}
          value="abc"
          editable={false}
        />
        <Text style={[styles.errorText, { color: t.risky }]}>Enter a valid amount</Text>
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
        <Text style={[styles.progressLabel, { color: t.textSecondary }]}>Credit utilization — 15% (SAFE)</Text>
        <View style={[styles.progressTrack, { backgroundColor: t.primaryMuted }]}>
          <View style={[styles.progressFill, { width: '15%', backgroundColor: t.safe }]} />
        </View>

        <Text style={[styles.progressLabel, { color: t.textSecondary, marginTop: 16 }]}>Credit utilization — 65% (CAUTION)</Text>
        <View style={[styles.progressTrack, { backgroundColor: t.primaryMuted }]}>
          <View style={[styles.progressFill, { width: '65%', backgroundColor: t.caution }]} />
        </View>

        <Text style={[styles.progressLabel, { color: t.textSecondary, marginTop: 16 }]}>Credit utilization — 92% (RISKY)</Text>
        <View style={[styles.progressTrack, { backgroundColor: t.primaryMuted }]}>
          <View style={[styles.progressFill, { width: '92%', backgroundColor: t.risky }]} />
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
            <Text style={[styles.listTitle, { color: t.textPrimary }]}>Cash on Hand</Text>
            <Text style={[styles.listSubtitle, { color: t.textSecondary }]}>Updated 2h ago</Text>
          </View>
          <Text style={[styles.listValue, { color: t.accent }]}>₱25,000</Text>
        </Pressable>
        <Pressable style={[styles.listItem, { borderBottomColor: t.border }]}>
          <View style={styles.listItemContent}>
            <Text style={[styles.listTitle, { color: t.textPrimary }]}>Monthly Income</Text>
            <Text style={[styles.listSubtitle, { color: t.textSecondary }]}>Payday: 15th</Text>
          </View>
          <Text style={[styles.listValue, { color: t.textPrimary }]}>₱40,000</Text>
        </Pressable>
        <Pressable style={[styles.listItem, { borderBottomColor: 'transparent' }]}>
          <View style={styles.listItemContent}>
            <Text style={[styles.listTitle, { color: t.textPrimary }]}>Committed Expenses</Text>
            <Text style={[styles.listSubtitle, { color: t.textSecondary }]}>Rent, utils, etc.</Text>
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
  themeLabel: { fontSize: 16, fontWeight: '700' },
  themeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  themeButtonText: { fontSize: 13, fontWeight: '700' },

  section: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 },

  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: 'transparent' },
  swatchItem: { alignItems: 'center', width: 90, backgroundColor: 'transparent' },
  swatch: { width: 56, height: 56, borderRadius: 12, borderWidth: 1 },
  swatchLabel: { fontSize: 10, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  swatchHex: { fontSize: 9, marginTop: 2 },

  typeHeading: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  typeSubheading: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  typeBody: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  typeCaption: { fontSize: 12, marginBottom: 8 },
  typeLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  btnPrimary: { paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginBottom: 10 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700' },
  btnSecondary: { paddingVertical: 14, borderRadius: 999, alignItems: 'center', borderWidth: 2, marginBottom: 10 },
  btnSecondaryText: { fontSize: 15, fontWeight: '700' },
  btnDestructive: { paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginBottom: 10 },
  btnDestructiveText: { fontSize: 15, fontWeight: '700' },
  btnGhost: { paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  btnGhostText: { fontSize: 15, fontWeight: '600' },

  badgeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', backgroundColor: 'transparent' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeOutline: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1.5 },
  badgeOutlineText: { fontSize: 12, fontWeight: '700' },
  staleBadgeText: { fontSize: 12, fontWeight: '700' },

  card: { borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardBody: { fontSize: 14, paddingHorizontal: 16, paddingBottom: 12 },
  cardFooter: { borderTopWidth: 1, padding: 12, paddingHorizontal: 16 },
  cardFooterText: { fontSize: 12, fontWeight: '600' },

  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  errorText: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, backgroundColor: 'transparent' },
  toggleLabel: { fontSize: 15, fontWeight: '600' },

  alert: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 },
  alertText: { fontSize: 13, fontWeight: '600' },

  progressLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  divider: { height: 1, marginVertical: 12 },
  dividerThick: { height: 3, borderRadius: 2, marginVertical: 12 },
  dividerDashed: { height: 0, borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 12 },

  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, backgroundColor: 'transparent' },
  listItemContent: { backgroundColor: 'transparent', flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600' },
  listSubtitle: { fontSize: 12, marginTop: 2 },
  listValue: { fontSize: 18, fontWeight: '700' },
});
