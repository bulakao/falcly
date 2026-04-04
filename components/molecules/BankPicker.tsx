import { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  View,
  Text,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { PH_BANKS } from '@/constants/banks';

interface BankPickerProps {
  value: string;
  onSelect: (bank: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function BankPicker({ value, onSelect, placeholder = 'Select your bank', style }: BankPickerProps) {
  const t = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const filtered = PH_BANKS.filter((bank) =>
    bank.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(bank: string) {
    if (bank === 'Other') {
      setShowCustomInput(true);
      return;
    }
    onSelect(bank);
    close();
  }

  function handleCustomSubmit() {
    const trimmed = customName.trim();
    if (trimmed) {
      onSelect(trimmed);
      close();
    }
  }

  function close() {
    setVisible(false);
    setSearch('');
    setCustomName('');
    setShowCustomInput(false);
  }

  return (
    <>
      <Pressable
        style={[
          styles.field,
          {
            backgroundColor: t.inputBg,
            borderColor: t.inputBorder,
          },
          style,
        ]}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={value || placeholder}
        accessibilityHint="Opens bank selection list"
      >
        <Text
          style={[
            styles.fieldText,
            { color: value ? t.inputText : t.placeholder },
          ]}
        >
          {value || placeholder}
        </Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent accessibilityViewIsModal>
        <View style={[styles.overlay]}>
          <View style={[styles.sheet, { backgroundColor: t.background }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: t.textPrimary }]}>Select Bank</Text>
              <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel bank selection">
                <Text style={[styles.cancel, { color: t.primary }]}>Cancel</Text>
              </Pressable>
            </View>

            {showCustomInput ? (
              <View style={styles.customSection}>
                <Text style={[styles.customLabel, { color: t.textSecondary }]}>
                  Enter bank or card name
                </Text>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: t.inputBg,
                      borderColor: t.inputBorder,
                      color: t.inputText,
                    },
                  ]}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="e.g. HSBC, Citi Rewards"
                  placeholderTextColor={t.placeholder}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCustomSubmit}
                  accessibilityLabel="Enter bank or card name"
                />
                <Pressable
                  style={[styles.customButton, { backgroundColor: t.primary }]}
                  onPress={handleCustomSubmit}
                  accessibilityRole="button"
                  accessibilityLabel="Use this name"
                >
                  <Text style={[styles.customButtonText, { color: t.textInverse }]}>
                    Use This Name
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: t.inputBg,
                      borderColor: t.inputBorder,
                      color: t.inputText,
                    },
                  ]}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search banks..."
                  placeholderTextColor={t.placeholder}
                  autoFocus
                  accessibilityLabel="Search banks by name"
                />
                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      style={[
                        styles.row,
                        { borderBottomColor: t.border },
                        item === value && { backgroundColor: t.safeBg },
                      ]}
                      onPress={() => handleSelect(item)}
                      accessibilityRole="button"
                      accessibilityLabel={item === 'Other' ? 'Other — type custom name' : item}
                      accessibilityState={{ selected: item === value }}
                    >
                      <Text
                        style={[
                          styles.rowText,
                          { color: t.textPrimary },
                          item === 'Other' && { color: t.primary, fontFamily: fonts.interSemiBold },
                        ]}
                      >
                        {item === 'Other' ? 'Other (type custom name)' : item}
                      </Text>
                    </Pressable>
                  )}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderRadius: 8,
    borderWidth: 2,
    padding: 14,
    justifyContent: 'center',
  },
  fieldText: {
    fontSize: 20,
    fontFamily: fonts.interBold,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.interBold,
  },
  cancel: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
  searchInput: {
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: fonts.interRegular,
    marginBottom: 8,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    fontSize: 16,
    fontFamily: fonts.interRegular,
  },
  customSection: {
    padding: 16,
  },
  customLabel: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    marginBottom: 8,
  },
  customButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  customButtonText: {
    fontSize: 16,
    fontFamily: fonts.interSemiBold,
  },
});
