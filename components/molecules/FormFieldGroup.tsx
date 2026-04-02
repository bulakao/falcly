import { StyleSheet, View, Text } from 'react-native';
import { FormInput, Label } from '@/components/atoms';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { TextInputProps } from 'react-native';

interface FormFieldGroupProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  error?: boolean;
  focused?: boolean;
  hint?: string;
}

export function FormFieldGroup({ label, error, focused, hint, ...inputProps }: FormFieldGroupProps) {
  const t = useAppTheme();
  return (
    <View style={styles.fieldGroup}>
      <Label>{label}</Label>
      <FormInput error={error} focused={focused} {...inputProps} />
      {hint && <Text style={[styles.hint, { color: t.textMuted }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginTop: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.interRegular,
  },
});
