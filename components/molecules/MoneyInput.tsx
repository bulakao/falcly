import { FormFieldGroup } from './FormFieldGroup';

interface MoneyInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

function formatMoney(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length === 2 ? formatted + '.' + parts[1] : formatted;
}

export function parseMoney(formatted: string): number {
  return parseFloat(formatted.replace(/,/g, '')) || 0;
}

export function MoneyInput({ label, value, onChangeText, placeholder = '0' }: MoneyInputProps) {
  return (
    <FormFieldGroup
      label={label}
      value={value}
      onChangeText={(text) => onChangeText(formatMoney(text))}
      placeholder={placeholder}
      keyboardType="decimal-pad"
    />
  );
}
