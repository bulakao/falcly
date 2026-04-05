import { FormFieldGroup } from './FormFieldGroup';

import { Platform } from 'react-native';

interface MoneyInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  compact?: boolean;
  allowNegative?: boolean;
}

export function formatMoney(raw: string): string {
  const isNegative = raw.startsWith('-');
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return (isNegative ? '-' : '') + parts[0] + '.' + parts.slice(1).join('');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const result = parts.length === 2 ? formatted + '.' + parts[1] : formatted;
  return isNegative ? '-' + result : result;
}

export function parseMoney(formatted: string): number {
  const val = parseFloat(formatted.replace(/,/g, ''));
  return isNaN(val) ? 0 : val;
}

export function MoneyInput({ label, value, onChangeText, placeholder = '0', compact, allowNegative }: MoneyInputProps) {
  return (
    <FormFieldGroup
      label={label}
      value={value}
      onChangeText={(text) => onChangeText(allowNegative ? formatMoney(text) : formatMoney(text.replace(/-/g, '')))}
      placeholder={placeholder}
      keyboardType={allowNegative && Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'decimal-pad'}
      compact={compact}
    />
  );
}
