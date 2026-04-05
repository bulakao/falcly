import { StyleSheet, View, Text } from 'react-native';
import { FormInput, Label } from '@/components/atoms';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { TextInputProps } from 'react-native';

interface FormFieldGroupProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  error?: boolean;
  focused?: boolean;
  compact?: boolean;
  hint?: string;
}

export function FormFieldGroup({ label, error, focused, compact, hint, ...inputProps }: FormFieldGroupProps) {
  const t = useAppTheme();

  if (compact) {
    return (
      <View style={styles.compactGroup}>
        <Label>{label}</Label>
        <FormInput error={error} focused={focused} compact {...inputProps} />
      </View>
    );
  }

  return (
    <View style={styles.fieldGroup}>
      <Label>{label}</Label>
      <FormInput error={error} focused={focused} {...inputProps} />
      {hint !== undefined && (
        <Text style={[styles.hint, { color: hint ? (error ? t.risky : t.textMuted) : 'transparent' }]}>
          {hint || ' '}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginTop: 16,
  },
  compactGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.interRegular,
  },
});
