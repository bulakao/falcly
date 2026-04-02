import { StyleSheet, Text, type TextProps } from 'react-native';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

interface TypographyProps extends Omit<TextProps, 'style'> {
  children: React.ReactNode;
  color?: string;
}

export function Heading({ children, color, ...props }: TypographyProps) {
  const t = useAppTheme();
  return (
    <Text style={[styles.heading, { color: color ?? t.textPrimary }]} {...props}>
      {children}
    </Text>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = useAppTheme();
  return (
    <>
      <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.sectionSubtitle, { color: t.textMuted }]}>{subtitle}</Text>
      )}
    </>
  );
}

export function Label({ children, color, ...props }: TypographyProps) {
  const t = useAppTheme();
  return (
    <Text style={[styles.label, { color: color ?? t.textSecondary }]} {...props}>
      {children}
    </Text>
  );
}

export function Caption({ children, color, ...props }: TypographyProps) {
  const t = useAppTheme();
  return (
    <Text style={[styles.caption, { color: color ?? t.textMuted }]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.nunitoBold,
    fontSize: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fonts.nunitoBold,
    fontSize: 16,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    marginBottom: 6,
  },
  caption: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
  },
});
