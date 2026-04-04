import { StyleSheet, Pressable, Text } from 'react-native';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

interface EmptyCardFaceProps {
  onPress: () => void;
}

export function EmptyCardFace({ onPress }: EmptyCardFaceProps) {
  const t = useAppTheme();

  return (
    <Pressable
      style={[styles.card, { borderColor: t.border, backgroundColor: t.surface }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a card"
      accessibilityHint="Opens form to add a new credit card"
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
    fontFamily: fonts.interRegular,
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
  },
});
