import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Themed';
import { useAppTheme } from '@/theme';

interface StatusTooltipProps {
  children?: React.ReactNode;
}

export default function StatusTooltip({ children }: StatusTooltipProps) {
  const t = useAppTheme();

  return (
    <Pressable
      style={!children ? { marginLeft: 6, justifyContent: 'center' } : undefined}
      onPress={() => router.push('/status-guide' as never)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Learn about card status"
      accessibilityHint="Opens the status guide"
    >
      {children ?? <Text style={{ fontSize: 18, color: t.textSecondary }}>ⓘ</Text>}
    </Pressable>
  );
}
