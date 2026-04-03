import { useState, useCallback } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

interface FormInputProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  error?: boolean;
  focused?: boolean;
  compact?: boolean;
}

export function FormInput({ error = false, focused: focusedProp = false, compact = false, placeholder, onFocus, onBlur, ...props }: FormInputProps) {
  const t = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const active = focusedProp || isFocused;

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  return (
    <TextInput
      style={[
        styles.input,
        compact && styles.inputCompact,
        {
          backgroundColor: error ? t.riskyBg : t.inputBg,
          borderColor: error ? t.risky : active ? t.primary : t.inputBorder,
          borderWidth: 2,
          color: error ? t.risky : t.inputText,
        },
      ]}
      placeholder={isFocused ? undefined : placeholder}
      placeholderTextColor={t.placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
  inputCompact: {
    padding: 8,
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    minWidth: 64,
    textAlign: 'right',
  },
});
