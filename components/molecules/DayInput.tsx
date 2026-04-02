import { FormFieldGroup } from './FormFieldGroup';

interface DayInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function DayInput({ label = 'Statement Day (1–31)', value, onChangeText, placeholder = '15' }: DayInputProps) {
  return (
    <FormFieldGroup
      label={label}
      value={value}
      onChangeText={(text) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned === '') { onChangeText(''); return; }
        const num = parseInt(cleaned, 10);
        if (num <= 31) onChangeText(String(num));
      }}
      placeholder={placeholder}
      keyboardType="number-pad"
      maxLength={2}
    />
  );
}
