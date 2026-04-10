import { useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text } from '@/components/Themed';
import { FormFieldGroup } from './FormFieldGroup';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { DEFAULT_DUE_DAY_OFFSET } from '@/types/card';

type Mode = 'offset' | 'dueDay';

interface DueDateInputProps {
  value: string;
  onChangeText: (text: string) => void;
  statementDay: string;
}

function offsetToDueDay(offset: string, statementDay: string): string {
  const o = parseInt(offset, 10);
  const s = parseInt(statementDay, 10);
  if (isNaN(o) || isNaN(s)) return '';
  return String(((s + o - 1) % 31) + 1);
}

function dueDayToOffset(dueDay: string, statementDay: string): string {
  const d = parseInt(dueDay, 10);
  const s = parseInt(statementDay, 10);
  if (isNaN(d) || isNaN(s)) return '';
  const offset = ((d - s + 31) % 31) || 31;
  return String(offset);
}

export function DueDateInput({ value, onChangeText, statementDay }: DueDateInputProps) {
  const t = useAppTheme();
  const [mode, setMode] = useState<Mode>('offset');

  function handleToggle(newMode: Mode) {
    if (newMode === mode) return;
    if (newMode === 'dueDay') {
      setMode('dueDay');
    } else {
      setMode('offset');
    }
  }

  if (mode === 'offset') {
    return (
      <View>
        <View style={styles.toggleRow}>
          <Toggle mode={mode} onToggle={handleToggle} />
        </View>
        <FormFieldGroup
          label="Due Day Offset"
          value={value}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, '');
            onChangeText(cleaned);
          }}
          placeholder={String(DEFAULT_DUE_DAY_OFFSET)}
          keyboardType="number-pad"
          maxLength={2}
          hint="Days after statement closes. Most banks: 21–25."
        />
      </View>
    );
  }

  const displayDueDay = offsetToDueDay(value, statementDay);

  return (
    <View>
      <View style={styles.toggleRow}>
        <Toggle mode={mode} onToggle={handleToggle} />
      </View>
      <FormFieldGroup
        label="Due Day (1–31)"
        value={displayDueDay}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, '');
          if (cleaned === '') { onChangeText(''); return; }
          const num = parseInt(cleaned, 10);
          if (num <= 31) {
            const offset = dueDayToOffset(cleaned, statementDay);
            onChangeText(offset);
          }
        }}
        placeholder="6"
        keyboardType="number-pad"
        maxLength={2}
        hint={value ? `${value} days after statement` : undefined}
      />
    </View>
  );
}

function Toggle({ mode, onToggle }: { mode: Mode; onToggle: (m: Mode) => void }) {
  const t = useAppTheme();
  return (
    <View style={[styles.toggle, { backgroundColor: t.inputBg, borderColor: t.border }]}>
      <Pressable
        onPress={() => onToggle('offset')}
        style={[styles.toggleOption, mode === 'offset' && { backgroundColor: t.accentBg }]}
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'offset' }}
      >
        <Text style={[styles.toggleText, { color: mode === 'offset' ? t.primary : t.textMuted }]}>Offset</Text>
      </Pressable>
      <Pressable
        onPress={() => onToggle('dueDay')}
        style={[styles.toggleOption, mode === 'dueDay' && { backgroundColor: t.accentBg }]}
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'dueDay' }}
      >
        <Text style={[styles.toggleText, { color: mode === 'dueDay' ? t.primary : t.textMuted }]}>Due Day</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interSemiBold,
  },
});
