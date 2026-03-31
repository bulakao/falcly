import { StyleSheet, Pressable, Text, type PressableProps } from 'react-native';
import { useAppTheme } from '@/theme';

type AlertVariant = 'warning' | 'stale' | 'info' | 'accent';

interface AlertBannerProps extends Omit<PressableProps, 'style' | 'children'> {
  message: string;
  variant?: AlertVariant;
  centered?: boolean;
}

export function AlertBanner({ message, variant = 'warning', centered = false, ...props }: AlertBannerProps) {
  const t = useAppTheme();

  const variantStyles = {
    warning: { bg: t.cautionBg, text: t.cautionText, border: 'transparent', borderWidth: 0 },
    stale: { bg: t.surface, text: t.textMuted, border: t.border, borderWidth: 1 },
    info: { bg: t.riskyBg, text: t.risky, border: t.riskyBorder, borderWidth: 1 },
    accent: { bg: t.accentBg, text: t.accent, border: 'transparent', borderWidth: 0 },
  } as const;

  const v = variantStyles[variant];

  return (
    <Pressable
      style={[
        styles.banner,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.borderWidth,
        },
        centered && styles.centered,
      ]}
      {...props}
    >
      <Text style={[styles.text, { color: v.text }, centered && styles.centeredText]}>{message}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    alignItems: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
});
