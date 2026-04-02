import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/theme';
import type { ViewStyle } from 'react-native';

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  const t = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: t.surface }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
});
