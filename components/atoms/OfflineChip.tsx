import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';

export function OfflineChip() {
  const { isOffline } = useNetworkStatus();
  const t = useAppTheme();

  if (!isOffline) return null;

  return (
    <View style={[styles.chip, { backgroundColor: t.textMuted }]}>
      <Text style={[styles.text, { color: t.textInverse }]}>Offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interSemiBold,
  },
});
