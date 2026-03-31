import { StyleSheet, View } from 'react-native';
import { FormInput, Label } from '@/components/atoms';
import type { TextInputProps } from 'react-native';

interface FormFieldGroupProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label: string;
  error?: boolean;
  focused?: boolean;
}

export function FormFieldGroup({ label, error, focused, ...inputProps }: FormFieldGroupProps) {
  return (
    <View style={styles.fieldGroup}>
      <Label>{label}</Label>
      <FormInput error={error} focused={focused} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginTop: 16,
  },
});
