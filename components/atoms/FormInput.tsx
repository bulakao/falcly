import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

interface FormInputProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  error?: boolean;
  focused?: boolean;
}

export function FormInput({ error = false, focused = false, ...props }: FormInputProps) {
  const t = useAppTheme();

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: error ? t.riskyBg : t.inputBg,
          borderColor: error ? t.risky : focused ? t.primary : t.inputBorder,
          borderWidth: error || focused ? 2 : 1,
          color: error ? t.risky : t.inputText,
        },
      ]}
      placeholderTextColor={t.placeholder}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    padding: 14,
    fontSize: 20,
    fontFamily: fonts.interBold,
    textAlign: 'center',
  },
});
