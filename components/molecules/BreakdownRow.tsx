import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme';

interface BreakdownRowProps {
  label: string;
  value: string;
  bold?: boolean;
  labelColor?: string;
  valueColor?: string;
  valueMuted?: boolean;
  strikethrough?: boolean;
}

export function BreakdownRow({
  label,
  value,
  bold = false,
  labelColor,
  valueColor,
  valueMuted = false,
  strikethrough = false,
}: BreakdownRowProps) {
  const t = useAppTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.label,
          { color: labelColor ?? t.textSecondary },
          bold && styles.bold,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          { color: valueColor ?? (valueMuted ? t.textMuted : t.inputText) },
          bold && styles.bold,
          bold && styles.boldValue,
          strikethrough && { textDecorationLine: 'line-through', color: t.border },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function BreakdownDivider() {
  const t = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: t.border }]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
  boldValue: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});
