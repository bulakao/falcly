import { StyleSheet, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/theme';

interface ChipOption {
  label: string;
  value: number;
}

interface ChipSelectorProps {
  options: ChipOption[];
  selectedValue: number;
  onSelect: (value: number) => void;
}

export function ChipSelector({ options, selectedValue, onSelect }: ChipSelectorProps) {
  const t = useAppTheme();

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = selectedValue === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.chip,
              { borderColor: t.inputBorder, backgroundColor: t.inputBg },
              active && { backgroundColor: t.primary, borderColor: t.primary },
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[
                styles.chipText,
                { color: t.inputText },
                active && { color: t.textInverse },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 24,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
