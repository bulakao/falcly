import { StyleSheet, Text, type TextProps } from 'react-native';
import { useAppTheme } from '@/theme';

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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  caption: {
    fontSize: 12,
  },
});
