import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/theme';

function Bone({ width, height = 12, rounded = false }: { width: number | string; height?: number; rounded?: boolean }) {
  const t = useAppTheme();
  return (
    <View
      style={[
        styles.bone,
        {
          width: width as number,
          height,
          borderRadius: rounded ? height / 2 : 4,
          backgroundColor: t.border,
        },
      ]}
    />
  );
}

function SkeletonRow({ labelWidth = 120, valueWidth = 60 }: { labelWidth?: number; valueWidth?: number }) {
  return (
    <View style={styles.row}>
      <Bone width={labelWidth} />
      <Bone width={valueWidth} />
    </View>
  );
}

export function ImpactSkeleton() {
  const t = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Action buttons skeleton */}
      <View style={styles.actionRow}>
        <Bone width={72} height={28} rounded />
        <Bone width={100} height={28} rounded />
        <Bone width={56} height={28} rounded />
      </View>

      {/* Timeline skeleton */}
      <View style={[styles.timelineBlock, { backgroundColor: t.surface }]}>
        <Bone width={140} height={10} />
        <View style={styles.timelineBar}>
          <Bone width="100%" height={8} rounded />
        </View>
        <View style={styles.timelineLabelRow}>
          <Bone width={40} height={10} />
          <Bone width={40} height={10} />
          <Bone width={40} height={10} />
        </View>
      </View>

      {/* Input skeleton */}
      <Bone width={160} height={12} />
      <View style={[styles.inputBlock, { borderColor: t.border, backgroundColor: t.inputBg }]}>
        <Bone width={30} height={20} />
      </View>

      {/* Chip skeleton */}
      <View style={styles.chipRow}>
        <Bone width={70} height={36} rounded />
        <Bone width={70} height={36} rounded />
        <Bone width={70} height={36} rounded />
        <Bone width={70} height={36} rounded />
      </View>

      {/* Breakdown skeleton */}
      <View style={[styles.breakdown, { borderColor: t.border }]}>
        <Bone width={120} height={14} />
        <View style={styles.breakdownRows}>
          <SkeletonRow labelWidth={140} valueWidth={70} />
          <SkeletonRow labelWidth={110} valueWidth={50} />
          <View style={[styles.divider, { backgroundColor: t.border }]} />
          <SkeletonRow labelWidth={170} valueWidth={80} />
          <SkeletonRow labelWidth={100} valueWidth={60} />
          <View style={[styles.divider, { backgroundColor: t.border }]} />
          <SkeletonRow labelWidth={120} valueWidth={70} />
          <SkeletonRow labelWidth={130} valueWidth={60} />
          <SkeletonRow labelWidth={160} valueWidth={70} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    opacity: 0.35,
  },
  bone: {
    opacity: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timelineBlock: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timelineBar: {
    marginTop: 12,
    marginBottom: 8,
  },
  timelineLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputBlock: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 24,
  },
  breakdown: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  breakdownRows: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});
