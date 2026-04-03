import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/theme';

interface UtilizationBarProps {
  balance: number;
  limit: number;
  color: string;
}

export function UtilizationBar({ balance, limit, color }: UtilizationBarProps) {
  const t = useAppTheme();
  const utilization = Math.min(balance / limit, 1);

  return (
    <View style={[styles.track, { backgroundColor: t.border }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: `${Math.max(utilization * 100, 2)}%` as `${number}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
