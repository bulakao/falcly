import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/theme';

interface PageDotsProps {
  count: number;
  activeIndex: number;
}

export function PageDots({ count, activeIndex }: PageDotsProps) {
  const t = useAppTheme();

  if (count <= 1) return null;

  return (
    <View style={styles.row} accessible accessibilityLabel={`Page ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i === activeIndex ? t.primary : t.border },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
