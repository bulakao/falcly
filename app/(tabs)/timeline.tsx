import { StyleSheet, ScrollView } from 'react-native';

import { Text, View } from '@/components/Themed';
import { GanttTimeline } from '@/components/GanttTimeline';
import { useCardStore } from '@/store/cardStore';

export default function TimelineScreen() {
  const cards = useCardStore((s) => s.cards);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No cards yet</Text>
          <Text style={styles.emptySubtitle}>
            Add a credit card to see your billing cycle timelines.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.heading}>Billing Cycles</Text>
          <Text style={styles.subheading}>
            Sorted by urgency — closest statement close first
          </Text>
          <GanttTimeline cards={cards} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
