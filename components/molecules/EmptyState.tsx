import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, children }: EmptyStateProps) {
  const t = useAppTheme();

  return (
    <View style={styles.empty}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
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
    fontSize: typeScale.title2a,
    fontFamily: fonts.interBold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typeScale.body,
    textAlign: 'center',
  },
  icon: {
    marginBottom: 16,
  },
});
