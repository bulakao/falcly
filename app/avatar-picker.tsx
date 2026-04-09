import { StyleSheet, Pressable, ScrollView, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { useUserStore } from '@/store/userStore';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: ['😎', '🤓', '😊', '🥳', '😏', '🤔', '😴', '🥹', '😤', '🫡', '🤗', '😈'],
  },
  {
    label: 'Animals',
    emojis: ['🐶', '🐱', '🐻', '🐼', '🦊', '🐯', '🦁', '🐸', '🐧', '🦉', '🦄', '🐙'],
  },
  {
    label: 'Food & Drink',
    emojis: ['☕', '🍕', '🍔', '🍣', '🧋', '🍩', '🌮', '🍜', '🍦', '🥑', '🍷', '🍺'],
  },
  {
    label: 'Sports & Hobbies',
    emojis: ['⚽', '🏀', '🎮', '🎸', '🎨', '📚', '🏋️', '🧘', '🚴', '🎯', '♟️', '🎲'],
  },
  {
    label: 'Nature',
    emojis: ['🌸', '🌻', '🍀', '🌈', '⭐', '🌙', '🔥', '🌊', '❄️', '🌴', '🍂', '🌵'],
  },
  {
    label: 'Objects',
    emojis: ['💻', '📱', '🎧', '📷', '🎬', '✈️', '🚀', '👑', '💎', '🧳', '🎩', '🕶️'],
  },
];

export default function AvatarPickerScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const avatarEmoji = useUserStore((s) => s.avatarEmoji);
  const setAvatarEmoji = useUserStore((s) => s.setAvatarEmoji);

  function select(emoji: string) {
    setAvatarEmoji(emoji);
    router.back();
  }

  function clear() {
    setAvatarEmoji(null);
    router.back();
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
    >
      {avatarEmoji && (
        <Pressable onPress={clear} style={[styles.removeButton, { borderColor: t.border }]}>
          <Text style={[styles.removeText, { color: t.risky }]}>Remove Avatar</Text>
        </Pressable>
      )}

      {EMOJI_CATEGORIES.map((category) => (
        <RNView key={category.label} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>{category.label}</Text>
          <RNView style={styles.grid}>
            {category.emojis.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => select(emoji)}
                style={[
                  styles.emojiCell,
                  {
                    backgroundColor: avatarEmoji === emoji ? t.accentBg : t.surface,
                    borderColor: avatarEmoji === emoji ? t.primary : t.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${emoji} as avatar`}
                accessibilityState={{ selected: avatarEmoji === emoji }}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </RNView>
        </RNView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  removeButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  removeText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interSemiBold,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: typeScale.title1,
  },
});
