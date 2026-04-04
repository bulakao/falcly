import { Modal, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import { Button } from '@/components/atoms';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { Card } from '@/types/card';

interface MergePromptProps {
  localCount: number;
  cloudCards: Card[];
  onKeepLocal: () => void;
  onRestoreCloud: () => void;
  onMerge: () => void;
}

export function MergePrompt({ localCount, cloudCards, onKeepLocal, onRestoreCloud, onMerge }: MergePromptProps) {
  const t = useAppTheme();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {}}
      accessibilityViewIsModal
    >
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.card, { backgroundColor: t.surface }]}>
          <Text style={[styles.title, { color: t.textPrimary }]}>
            You have data in two places
          </Text>
          <Text style={[styles.body, { color: t.textSecondary }]}>
            This device has {localCount} {localCount === 1 ? 'card' : 'cards'}. Your account has {cloudCards.length} {cloudCards.length === 1 ? 'card' : 'cards'}.
          </Text>
          <View style={styles.buttons}>
            <Button label="Keep local" onPress={onKeepLocal} variant="secondary" />
            <Button label="Restore from cloud" onPress={onRestoreCloud} variant="secondary" />
            <Button label="Merge both" onPress={onMerge} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.interBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    gap: 10,
  },
});
