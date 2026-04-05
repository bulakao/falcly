import { useState, useMemo } from 'react';
import {
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Share,
  View as RNView,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Button } from '@/components/atoms';
import { SurfaceCard, PercentInput, MoneyInput, parseMoney } from '@/components/molecules';
import type { PayoffStrategy } from '@/store/userStore';
import { scheduleAllReminders } from '@/utils/notifications';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/utils/currency';
import {
  SettingsAccountSection,
  SettingsOverlaySection,
  SettingsDataSection,
  SettingsDangerSection,
} from '@/components/settings';

export default function SettingsScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const analyticsOptOut = useUserStore((s) => s.analyticsOptOut);
  const setAnalyticsOptOutStore = useUserStore((s) => s.setAnalyticsOptOut);
  const themePreference = useUserStore((s) => s.themePreference);
  const setThemePreference = useUserStore((s) => s.setThemePreference);
  const notifyStatementReminder = useUserStore((s) => s.notifyStatementReminder);
  const _setNotifyStatementReminder = useUserStore((s) => s.setNotifyStatementReminder);
  const notifyDueReminder = useUserStore((s) => s.notifyDueReminder);
  const _setNotifyDueReminder = useUserStore((s) => s.setNotifyDueReminder);
  const notifyHighUtilization = useUserStore((s) => s.notifyHighUtilization);
  const _setNotifyHighUtilization = useUserStore((s) => s.setNotifyHighUtilization);

  function rescheduleAfterToggle(statementVal: boolean, dueVal: boolean) {
    const cards = useCardStore.getState().cards;
    scheduleAllReminders(cards, {
      notifyStatementReminder: statementVal,
      notifyDueReminder: dueVal,
    }).catch(() => {});
  }

  function setNotifyStatementReminder(v: boolean) {
    _setNotifyStatementReminder(v);
    rescheduleAfterToggle(v, notifyDueReminder);
  }
  function setNotifyDueReminder(v: boolean) {
    _setNotifyDueReminder(v);
    rescheduleAfterToggle(notifyStatementReminder, v);
  }
  function setNotifyHighUtilization(v: boolean) {
    _setNotifyHighUtilization(v);
  }

  const defaultInterestRate = useUserStore((s) => s.defaultInterestRate);
  const setDefaultInterestRate = useUserStore((s) => s.setDefaultInterestRate);
  const defaultMinPaymentPct = useUserStore((s) => s.defaultMinPaymentPct);
  const setDefaultMinPaymentPct = useUserStore((s) => s.setDefaultMinPaymentPct);
  const defaultMinPaymentFloor = useUserStore((s) => s.defaultMinPaymentFloor);
  const setDefaultMinPaymentFloor = useUserStore((s) => s.setDefaultMinPaymentFloor);

  const payoffStrategy = useUserStore((s) => s.payoffStrategy);
  const setPayoffStrategy = useUserStore((s) => s.setPayoffStrategy);
  const fixedPayoffAmount = useUserStore((s) => s.fixedPayoffAmount);
  const setFixedPayoffAmount = useUserStore((s) => s.setFixedPayoffAmount);
  const globalCurrency = useUserStore((s) => s.globalCurrency);
  const setGlobalCurrency = useUserStore((s) => s.setGlobalCurrency);

  const [interestRateText, setInterestRateText] = useState(() => (defaultInterestRate * 100).toFixed(1));
  const [minPaymentPctText, setMinPaymentPctText] = useState(() => (defaultMinPaymentPct * 100).toFixed(1));
  const [minPaymentFloorText, setMinPaymentFloorText] = useState(() => defaultMinPaymentFloor.toString());
  const [fixedPayoffText, setFixedPayoffText] = useState(() => fixedPayoffAmount?.toString() ?? '');
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);

  const cards = useCardStore((s) => s.cards);

  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return SUPPORTED_CURRENCIES;
    const q = currencySearch.trim().toLowerCase();
    return SUPPORTED_CURRENCIES.filter(
      (code) => code.toLowerCase().includes(q) || getCurrencySymbol(code).toLowerCase().includes(q),
    );
  }, [currencySearch]);


  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 56 }]}>

      <SettingsAccountSection />

      {/* ── Appearance ── */}
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Appearance</Text>
      <SurfaceCard>
        <RNView style={styles.themeRow}>
          {(['system', 'light', 'dark'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setThemePreference(option)}
              accessibilityRole="button"
              accessibilityLabel={`${option.charAt(0).toUpperCase() + option.slice(1)} theme`}
              accessibilityState={{ selected: themePreference === option }}
              style={[
                styles.themeOption,
                { borderColor: themePreference === option ? t.primary : t.border, backgroundColor: themePreference === option ? t.accentBg : 'transparent' },
              ]}
            >
              <FontAwesome
                name={option === 'system' ? 'adjust' : option === 'light' ? 'sun-o' : 'moon-o'}
                size={16}
                color={themePreference === option ? t.primary : t.textMuted}
              />
              <Text style={[styles.themeOptionText, { color: themePreference === option ? t.primary : t.textPrimary }]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </Pressable>
          ))}
        </RNView>
      </SurfaceCard>

      {/* ── Currency ── */}
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Currency</Text>
      <SurfaceCard>
        <Pressable
          style={styles.defaultRow}
          onPress={() => setCurrencyModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Currency: ${globalCurrency}`}
        >
          <RNView>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Display Currency</Text>
            <Text style={[styles.itemHint, { color: t.textMuted }]}>Used for all amounts unless a card overrides it</Text>
          </RNView>
          <Text style={[styles.defaultValue, { color: t.primary }]}>
            {globalCurrency} — {getCurrencySymbol(globalCurrency)}
          </Text>
        </Pressable>
      </SurfaceCard>

      {/* ── Notifications ── */}
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Notifications</Text>
      <SurfaceCard>
        <RNView style={styles.valueRow}>
          <RNView style={{ flex: 1 }}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Statement reminder</Text>
            <Text style={[styles.itemHint, { color: t.textMuted }]}>3 days before statement closes</Text>
          </RNView>
          <Switch value={notifyStatementReminder} onValueChange={setNotifyStatementReminder} />
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <RNView style={styles.valueRow}>
          <RNView style={{ flex: 1 }}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Due date reminder</Text>
            <Text style={[styles.itemHint, { color: t.textMuted }]}>3 days before payment is due</Text>
          </RNView>
          <Switch value={notifyDueReminder} onValueChange={setNotifyDueReminder} />
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <RNView style={styles.valueRow}>
          <RNView style={{ flex: 1 }}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>High utilization alert</Text>
            <Text style={[styles.itemHint, { color: t.textMuted }]}>When any card exceeds 80% usage</Text>
          </RNView>
          <Switch value={notifyHighUtilization} onValueChange={setNotifyHighUtilization} />
        </RNView>
      </SurfaceCard>

      <SettingsOverlaySection />

      {/* ── Education ── */}
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Education</Text>
      <SurfaceCard>
        <Pressable
          style={styles.valueRow}
          onPress={() => router.push('/statement-advisor' as never)}
          accessibilityRole="button"
          accessibilityLabel="Statement Advisor"
        >
          <RNView style={{ flex: 1 }}>
            <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Statement Advisor</Text>
            <Text style={[styles.itemHint, { color: t.textMuted }]}>Optimize your card spread and timing</Text>
          </RNView>
          <FontAwesome name="chevron-right" size={12} color={t.textMuted} />
        </Pressable>
      </SurfaceCard>

      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Analytics</Text>
      <SurfaceCard>
        <Text style={[styles.itemHint, { color: t.textMuted }]}>
          Helps us understand how Falcly is used so we can make it better
        </Text>
        <RNView style={[styles.divider, { backgroundColor: t.border }]} />
        <RNView style={styles.valueRow}>
          <RNView style={{ flex: 1 }}>
            <Text style={[styles.itemLabel, { color: t.textSecondary }]}>Usage data</Text>
            <Text style={[styles.itemHint, { color: t.textMuted }]}>
              {analyticsOptOut ? 'Opted out — no usage data is collected' : 'Opted in — anonymous usage data is shared'}
            </Text>
          </RNView>
          <Switch
            value={!analyticsOptOut}
            onValueChange={(v) => setAnalyticsOptOutStore(!v)}
          />
        </RNView>
      </SurfaceCard>

      {/* ── Card Defaults ── */}
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Card Defaults</Text>
      <SurfaceCard>
        <Text style={[styles.itemHint, { color: t.textMuted, marginBottom: 12 }]}>
          Applied to all cards unless customized individually.
        </Text>

        <PercentInput
          compact
          label="Interest rate %"
          value={interestRateText}
          onChangeText={(text) => {
            setInterestRateText(text);
            const v = parseFloat(text);
            if (!isNaN(v)) setDefaultInterestRate(v / 100);
          }}
        />

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <PercentInput
          compact
          label="Min. payment %"
          value={minPaymentPctText}
          onChangeText={(text) => {
            setMinPaymentPctText(text);
            const v = parseFloat(text);
            if (!isNaN(v)) setDefaultMinPaymentPct(v / 100);
          }}
        />

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <MoneyInput
          compact
          label="Min. payment floor"
          value={minPaymentFloorText}
          onChangeText={(text) => {
            setMinPaymentFloorText(text);
            const v = parseFloat(text.replace(/,/g, ''));
            if (!isNaN(v)) setDefaultMinPaymentFloor(v);
          }}
        />
      </SurfaceCard>

      {/* ── Payoff Strategy ── */}
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Payoff Strategy</Text>
      <SurfaceCard>
        <Text style={[styles.itemHint, { color: t.textMuted, marginBottom: 12 }]}>
          How you plan to pay your credit card bills each month.
        </Text>
        <RNView style={styles.strategyGrid}>
          {([
            { key: 'full' as PayoffStrategy, label: 'Full Balance', desc: 'Pay everything' },
            { key: 'minimum' as PayoffStrategy, label: 'Minimum Only', desc: 'Pay the minimum only' },
            { key: 'fixed' as PayoffStrategy, label: 'Fixed Amount', desc: 'Pay a set amount each month' },
            { key: 'aggressive' as PayoffStrategy, label: 'Aggressive', desc: 'Pay as much as possible after expenses' },
          ]).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setPayoffStrategy(option.key)}
              accessibilityRole="button"
              accessibilityLabel={`${option.label}: ${option.desc}`}
              accessibilityState={{ selected: payoffStrategy === option.key }}
              style={[
                styles.strategyChip,
                {
                  borderColor: payoffStrategy === option.key ? t.primary : t.border,
                  backgroundColor: payoffStrategy === option.key ? t.accentBg : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.strategyChipLabel,
                  { color: payoffStrategy === option.key ? t.primary : t.textPrimary },
                ]}
              >
                {option.label}
              </Text>
              <Text style={[styles.strategyChipDesc, { color: t.textMuted }]}>
                {option.desc}
              </Text>
            </Pressable>
          ))}
        </RNView>
        {payoffStrategy === 'fixed' && (
          <>
            <RNView style={[styles.divider, { backgroundColor: t.border }]} />
            <MoneyInput
              compact
              label="Fixed monthly payment"
              value={fixedPayoffText}
              onChangeText={(text) => {
                setFixedPayoffText(text);
                const v = parseMoney(text);
                if (!isNaN(v) && v > 0) setFixedPayoffAmount(v);
              }}
            />
          </>
        )}
      </SurfaceCard>

      {/* ── About ── */}
      <Text style={[styles.groupLabel, { color: t.textSecondary }]}>About</Text>
      <SurfaceCard>
        <RNView style={styles.defaultRow}>
          <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Version</Text>
          <Text style={[styles.defaultValue, { color: t.textMuted }]}>1.0.0</Text>
        </RNView>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <Pressable style={styles.defaultRow} accessibilityRole="button" accessibilityLabel="Terms of Service">
          <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Terms of Service</Text>
          <FontAwesome name="chevron-right" size={12} color={t.textMuted} />
        </Pressable>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <Pressable style={styles.defaultRow} accessibilityRole="button" accessibilityLabel="Privacy Policy">
          <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Privacy Policy</Text>
          <FontAwesome name="chevron-right" size={12} color={t.textMuted} />
        </Pressable>

        <RNView style={[styles.divider, { backgroundColor: t.border }]} />

        <Pressable style={styles.defaultRow} accessibilityRole="button" accessibilityLabel="Send Feedback">
          <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Send Feedback</Text>
          <FontAwesome name="chevron-right" size={12} color={t.textMuted} />
        </Pressable>
      </SurfaceCard>

      <SettingsDataSection />

      {/* ── Dev / Showcase ── */}
      {__DEV__ && (
        <>
          <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Developer</Text>
          <SurfaceCard>
            <Button
              label="Share Store State"
              variant="secondary"
              onPress={() => {
                const state = {
                  profile: { cashOnHand, monthlyIncome, payday, committedExpenses },
                  cards: cards.map((c) => ({
                    id: c.id,
                    bankName: c.bankName,
                    creditLimit: c.creditLimit,
                    outstandingBalance: c.outstandingBalance,
                    statementDay: c.statementDay,
                    dueDayOffset: c.dueDayOffset,
                    minPaymentPct: c.minPaymentPct,
                    minPaymentFloor: c.minPaymentFloor,
                    isActive: c.isActive,
                    pendingTransactions: c.pendingTransactions,
                    installmentsMonthlyAmount: c.installmentsMonthlyAmount,
                    subscriptionsThisCycle: c.subscriptionsThisCycle,
                  })),
                };
                Share.share({ message: JSON.stringify(state, null, 2) });
              }}
            />
            <RNView style={{ height: 8 }} />
            <Button
              label="Open Showcase"
              onPress={() => router.push('/component-showcase')}
              variant="secondary"
            />
          </SurfaceCard>
        </>
      )}

      <SettingsDangerSection />
      {/* Currency picker modal */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
        accessibilityViewIsModal
      >
        <RNView style={[styles.modalContainer, { backgroundColor: t.background, paddingTop: insets.top }]}>
          <RNView style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Select Currency</Text>
            <Pressable onPress={() => setCurrencyModalVisible(false)} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={[styles.modalClose, { color: t.primary }]}>Done</Text>
            </Pressable>
          </RNView>
          <TextInput
            style={[styles.searchInput, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.inputBg }]}
            placeholder="Search currency..."
            placeholderTextColor={t.textMuted}
            value={currencySearch}
            onChangeText={setCurrencySearch}
            autoCorrect={false}
          />
          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item}
            renderItem={({ item: code }) => (
              <Pressable
                style={[styles.currencyRow, code === globalCurrency && { backgroundColor: t.accentBg }]}
                onPress={() => {
                  setGlobalCurrency(code);
                  setCurrencyModalVisible(false);
                  setCurrencySearch('');
                }}
                accessibilityRole="button"
                accessibilityLabel={`${getCurrencySymbol(code)} ${code}`}
                accessibilityState={{ selected: code === globalCurrency }}
              >
                <Text style={[styles.currencySymbol, { color: t.textPrimary }]}>{getCurrencySymbol(code)}</Text>
                <Text style={[styles.currencyCode, { color: code === globalCurrency ? t.primary : t.textPrimary }]}>{code}</Text>
                {code === globalCurrency && <Text style={{ color: t.primary }}>✓</Text>}
              </Pressable>
            )}
          />
        </RNView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
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
  defaultValue: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
  },
  strategyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  strategyChip: {
    flexBasis: '46%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  strategyChipLabel: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    marginBottom: 2,
  },
  strategyChipDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.interBold,
  },
  modalClose: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
  searchInput: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.interRegular,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: fonts.interBold,
    width: 40,
  },
  currencyCode: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    flex: 1,
  },
});
