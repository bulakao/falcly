import { FormFieldGroup } from './FormFieldGroup';

interface PercentInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function PercentInput({ label, value, onChangeText, placeholder = '0' }: PercentInputProps) {
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
    />
  );
}
