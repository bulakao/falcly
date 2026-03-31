import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, subtitle, children }: EmptyStateProps) {
  const t = useAppTheme();

  return (
    <View style={styles.empty}>
      <Text style={[styles.title, { color: t.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: t.textMuted }]}>{subtitle}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
