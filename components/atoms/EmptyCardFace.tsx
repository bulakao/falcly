import { StyleSheet, Pressable, Text } from 'react-native';
import { useAppTheme } from '@/theme';

interface EmptyCardFaceProps {
  onPress: () => void;
}

export function EmptyCardFace({ onPress }: EmptyCardFaceProps) {
  const t = useAppTheme();

  return (
    <Pressable
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
      onPress={onPress}
    >
      <Text style={[styles.plus, { color: t.textMuted }]}>+</Text>
      <Text style={[styles.label, { color: t.textMuted }]}>Add a card</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 85.6 / 53.98,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plus: {
    fontSize: 36,
    fontWeight: '300',
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
