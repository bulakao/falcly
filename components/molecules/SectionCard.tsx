import { StyleSheet, View, type ViewProps } from 'react-native';
import { useAppTheme } from '@/theme';

interface SectionCardProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  accentBorder?: string;
  accentBg?: string;
}

export function SectionCard({ children, accentBorder, accentBg, ...props }: SectionCardProps) {
  const t = useAppTheme();

  return (
    <View
      style={[
        styles.section,
        {
          borderColor: accentBorder ?? t.border,
          backgroundColor: accentBg ?? t.surfaceElevated,
        },
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
});
