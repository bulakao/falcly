import { useRef, useEffect, useCallback, type ReactNode } from 'react';
import { StyleSheet, Pressable, Modal, Animated, View as RNView, type DimensionValue } from 'react-native';
import { Text } from '@/components/Themed';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: DimensionValue;
}

export function BottomSheet({ visible, onClose, title, children, maxHeight }: BottomSheetProps) {
  const t = useAppTheme();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslate = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(sheetTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlayOpacity, sheetTranslate]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetTranslate, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose();
    });
  }, [overlayOpacity, sheetTranslate, onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { backgroundColor: t.surface, transform: [{ translateY: sheetTranslate }] }, maxHeight != null && { maxHeight }]}>
        <RNView style={styles.header}>
          {title ? <Text style={[styles.title, { color: t.textPrimary }]}>{title}</Text> : <RNView />}
          <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Done">
            <Text style={[styles.done, { color: t.primary }]}>Done</Text>
          </Pressable>
        </RNView>
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    paddingBottom: 34,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
  },
  done: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interSemiBold,
  },
});
