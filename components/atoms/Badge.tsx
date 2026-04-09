import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme, type SemanticTokens } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';

type BadgeVariant = 'safe' | 'caution' | 'risky' | 'stale' | 'pro' | 'outline';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

function getVariantStyles(variant: BadgeVariant, t: SemanticTokens) {
  switch (variant) {
    case 'safe':
      return { bg: t.safe, text: t.textInverse, border: 'transparent', borderWidth: 0 };
    case 'caution':
      return { bg: t.caution, text: t.primaryText, border: 'transparent', borderWidth: 0 };
    case 'risky':
      return { bg: t.risky, text: t.textInverse, border: 'transparent', borderWidth: 0 };
    case 'stale':
      return { bg: t.textMuted, text: t.textInverse, border: 'transparent', borderWidth: 0 };
    case 'pro':
      return { bg: t.accent, text: t.primaryText, border: 'transparent', borderWidth: 0 };
    case 'outline':
      return { bg: 'transparent', text: t.borderStrong, border: t.borderStrong, borderWidth: 1.5 };
  }
}

export function Badge({ label, variant }: BadgeProps) {
  const t = useAppTheme();
  const v = getVariantStyles(variant, t);

  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.borderWidth }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  text: {
    fontSize: typeScale.footnote,
    fontFamily: fonts.interBold,
  },
});
