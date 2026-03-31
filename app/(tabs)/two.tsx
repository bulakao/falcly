import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import { useUserStore } from '@/store/userStore';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';

export default function SettingsScreen() {
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const cashUpdatedAt = useUserStore((s) => s.cashUpdatedAt);
  const setCashOnHand = useUserStore((s) => s.setCashOnHand);

  const [editing, setEditing] = useState(false);
  const [cashText, setCashText] = useState('');

  const cashStaleness = cashUpdatedAt ? getStalenessLevel(cashUpdatedAt) : null;

  function handleEditCash() {
    setCashText(cashOnHand !== null ? String(cashOnHand) : '');
    setEditing(true);
  }

  function handleSaveCash() {
    const amount = parseFloat(cashText);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }
    setCashOnHand(amount);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Settings</Text>

        {/* Cash on Hand */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash on Hand</Text>
          <Text style={styles.sectionSubtitle}>
            Your liquid cash available to pay credit card bills.
          </Text>

          {editing ? (
            <View>
              <TextInput
                style={styles.input}
                value={cashText}
                onChangeText={setCashText}
                placeholder="e.g. 25000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.buttonRow}>
                <Pressable style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSaveCash}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>
                  {cashOnHand !== null
                    ? `₱${cashOnHand.toLocaleString()}`
                    : 'Not set'}
                </Text>
                <Pressable style={styles.editButton} onPress={handleEditCash}>
                  <Text style={styles.editButtonText}>
                    {cashOnHand !== null ? 'Update' : 'Set Cash'}
                  </Text>
                </Pressable>
              </View>

              {/* Timestamp */}
              {cashUpdatedAt !== null && (
                <Text
                  style={[
                    styles.timestamp,
                    cashStaleness === 'warning' && { color: '#f59e0b' },
                    cashStaleness === 'stale' && { color: '#6b7280', fontWeight: '600' },
                  ]}
                >
                  Cash updated {formatUpdatedAgo(cashUpdatedAt)}
                </Text>
              )}

              {/* Staleness nudge at 5+ days */}
              {cashStaleness === 'warning' && (
                <Pressable style={styles.stalenessWarning} onPress={handleEditCash}>
                  <Text style={styles.stalenessWarningText}>
                    ⚠️ Cash amount may be outdated · Tap to update
                  </Text>
                </Pressable>
              )}
              {cashStaleness === 'stale' && (
                <Pressable style={styles.stalenessStale} onPress={handleEditCash}>
                  <Text style={styles.stalenessStaleText}>
                    ⚠ Cash data is stale — update for accurate projections
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: '#fafafa',
    color: '#000',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stalenessWarning: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  stalenessWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  stalenessStale: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  stalenessStaleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});
