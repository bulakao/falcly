import { FormFieldGroup } from './FormFieldGroup';

interface PercentInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function PercentInput({ label, value, onChangeText, placeholder = '0', compact }: PercentInputProps) {
  return (
    <FormFieldGroup
      label={label}
      value={value}
      onChangeText={(text) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        onChangeText(cleaned);
      }}
      placeholder={placeholder}
      keyboardType="decimal-pad"
      selectTextOnFocus
      compact={compact}
    />
  );
}
