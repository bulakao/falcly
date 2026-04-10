import { StyleSheet, Pressable, View as RNView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from '@/components/Themed';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import type { CardOverlayItem } from '@/types/overlay';

const TYPE_ICONS: Record<string, string> = {
  alert: '\u26a0\ufe0f',
  advisory: '\u2139\ufe0f',
  tip: '\ud83d\udca1',
  statement: '\ud83d\udcc4',
  wiki: '\ud83d\udcd6',
  promo: '\ud83c\udf89',
  affiliate: '\ud83c\udff7\ufe0f',
};

const TYPE_TINTS: Record<string, { bg: string; border: string }> = {
  alert: { bg: 'rgba(220, 38, 38, 0.06)', border: 'rgba(220, 38, 38, 0.15)' },
  advisory: { bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.15)' },
  tip: { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)' },
  statement: { bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)' },
  wiki: { bg: 'rgba(99, 102, 241, 0.06)', border: 'rgba(99, 102, 241, 0.15)' },
  promo: { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)' },
  affiliate: { bg: 'rgba(107, 114, 128, 0.06)', border: 'rgba(107, 114, 128, 0.15)' },
};

interface CardOverlayProps {
  item: CardOverlayItem;
  onDismiss: () => void;
  onAction?: () => void;
}

export function CardOverlay({ item, onDismiss, onAction }: CardOverlayProps) {
  const t = useAppTheme();
  const tint = TYPE_TINTS[item.type] ?? TYPE_TINTS.tip;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.container,
        { backgroundColor: tint.bg, borderColor: tint.border },
      ]}
    >
      {/* Header row */}
      <RNView style={styles.header}>
        <RNView style={styles.titleRow}>
          <Text style={styles.icon}>{TYPE_ICONS[item.type] ?? '\ud83d\udca1'}</Text>
          <Text style={[styles.title, { color: t.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
        </RNView>
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Dismiss overlay"
        >
          <Text style={[styles.dismiss, { color: t.textMuted }]}>{'\u2715'}</Text>
        </Pressable>
      </RNView>

      {/* Body */}
      <Text style={[styles.body, { color: t.textSecondary }]} numberOfLines={3}>
        {item.body}
      </Text>

      {/* CTA */}
      {item.cta && (
        <RNView style={styles.ctaRow}>
          <Pressable
            onPress={onAction ?? onDismiss}
            accessibilityRole="button"
            accessibilityLabel={item.cta}
          >
            <Text style={[styles.cta, { color: t.primary }]}>{item.cta}</Text>
          </Pressable>
        </RNView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  icon: {
    fontSize: typeScale.headline,
  },
  title: {
    fontSize: typeScale.body,
    fontFamily: fonts.interBold,
    flex: 1,
  },
  dismiss: {
    fontSize: typeScale.headline,
    paddingLeft: 8,
  },
  body: {
    fontSize: typeScale.body,
    lineHeight: 19,
    fontFamily: fonts.interRegular,
  },
  ctaRow: {
    alignItems: 'flex-end',
  },
  cta: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
});
