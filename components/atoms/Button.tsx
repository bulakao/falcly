import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme, type SemanticTokens } from '@/theme';
import { fonts } from '@/theme/fonts';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'destructive-outline' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
}

function getVariantStyles(variant: ButtonVariant, t: SemanticTokens, disabled: boolean) {
  const base = {
    bg: t.primary,
    text: t.primaryText,
    border: 'transparent',
    borderWidth: 0,
  };

  switch (variant) {
    case 'primary':
      return disabled
        ? { ...base, bg: t.primaryMuted, text: t.textMuted }
        : base;
    case 'secondary':
      return { bg: 'transparent', text: t.primary, border: t.primary, borderWidth: 2 };
    case 'destructive':
      return { bg: t.risky, text: t.textInverse, border: 'transparent', borderWidth: 0 };
    case 'destructive-outline':
      return { bg: 'transparent', text: t.risky, border: t.risky, borderWidth: 2 };
    case 'ghost':
      return { bg: 'transparent', text: t.primary, border: 'transparent', borderWidth: 0 };
  }
}

export function Button({ label, onPress, variant = 'primary', disabled = false, fullWidth = true }: ButtonProps) {
  const t = useAppTheme();
  const v = getVariantStyles(variant, t, disabled);

  return (
    <Pressable
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.borderWidth,
          opacity: disabled ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.interBold,
  },
});
