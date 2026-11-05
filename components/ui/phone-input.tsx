'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const COUNTRY_PHONE_CODES: { dialCode: string; code: string; name: string }[] = [
  { dialCode: '+380', code: 'UA', name: 'Ukraine' },
  { dialCode: '+1', code: 'US', name: 'United States' },
  { dialCode: '+44', code: 'GB', name: 'United Kingdom' },
  { dialCode: '+48', code: 'PL', name: 'Poland' },
  { dialCode: '+49', code: 'DE', name: 'Germany' },
  { dialCode: '+33', code: 'FR', name: 'France' },
  { dialCode: '+39', code: 'IT', name: 'Italy' },
  { dialCode: '+34', code: 'ES', name: 'Spain' },
  { dialCode: '+7', code: 'RU', name: 'Russia' },
  { dialCode: '+31', code: 'NL', name: 'Netherlands' },
  { dialCode: '+32', code: 'BE', name: 'Belgium' },
  { dialCode: '+41', code: 'CH', name: 'Switzerland' },
  { dialCode: '+43', code: 'AT', name: 'Austria' },
  { dialCode: '+45', code: 'DK', name: 'Denmark' },
  { dialCode: '+46', code: 'SE', name: 'Sweden' },
  { dialCode: '+47', code: 'NO', name: 'Norway' },
  { dialCode: '+358', code: 'FI', name: 'Finland' },
  { dialCode: '+353', code: 'IE', name: 'Ireland' },
  { dialCode: '+351', code: 'PT', name: 'Portugal' },
  { dialCode: '+30', code: 'GR', name: 'Greece' },
  { dialCode: '+372', code: 'EE', name: 'Estonia' },
  { dialCode: '+371', code: 'LV', name: 'Latvia' },
  { dialCode: '+370', code: 'LT', name: 'Lithuania' },
  { dialCode: '+373', code: 'MD', name: 'Moldova' },
  { dialCode: '+40', code: 'RO', name: 'Romania' },
  { dialCode: '+36', code: 'HU', name: 'Hungary' },
  { dialCode: '+420', code: 'CZ', name: 'Czech Republic' },
  { dialCode: '+421', code: 'SK', name: 'Slovakia' },
  { dialCode: '+90', code: 'TR', name: 'Turkey' },
  { dialCode: '+91', code: 'IN', name: 'India' },
  { dialCode: '+61', code: 'AU', name: 'Australia' },
  { dialCode: '+55', code: 'BR', name: 'Brazil' },
  { dialCode: '+52', code: 'MX', name: 'Mexico' },
  { dialCode: '+971', code: 'AE', name: 'UAE' },
  { dialCode: '+972', code: 'IL', name: 'Israel' },
  { dialCode: '+86', code: 'CN', name: 'China' },
  { dialCode: '+81', code: 'JP', name: 'Japan' },
];

// Sort by dialCode length descending so we match +380 before +38
const SORTED_COUNTRIES = [...COUNTRY_PHONE_CODES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

function parsePhoneValue(value: string | null | undefined): {
  dialCode: string;
  localNumber: string;
} {
  if (!value || typeof value !== 'string') {
    return { dialCode: '+380', localNumber: '' };
  }
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly.length) {
    return { dialCode: '+380', localNumber: '' };
  }
  const withPlus = `+${digitsOnly}`;
  for (const country of SORTED_COUNTRIES) {
    if (withPlus === country.dialCode || withPlus.startsWith(country.dialCode)) {
      const local = withPlus.slice(country.dialCode.length).replace(/\D/g, '');
      return { dialCode: country.dialCode, localNumber: local };
    }
  }
  return { dialCode: '+380', localNumber: digitsOnly };
}

function formatFullPhone(dialCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '');
  if (!digits) return '';
  return `${dialCode}${digits}`;
}

export interface PhoneInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value?: string | null;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, disabled, className, ...inputProps }, ref) => {
    const parsed = React.useMemo(() => parsePhoneValue(value), [value]);
    const [dialCode, setDialCode] = React.useState(parsed.dialCode);
    const [localNumber, setLocalNumber] = React.useState(parsed.localNumber);

    React.useEffect(() => {
      const next = parsePhoneValue(value);
      setDialCode(next.dialCode);
      setLocalNumber(next.localNumber);
    }, [value]);

    const notifyChange = React.useCallback(
      (code: string, local: string) => {
        const full = formatFullPhone(code, local);
        onChange?.(full);
      },
      [onChange],
    );

    const handleCountryChange = React.useCallback(
      (code: string) => {
        const country = COUNTRY_PHONE_CODES.find((c) => c.dialCode === code);
        if (!country) return;
        setDialCode(country.dialCode);
        notifyChange(country.dialCode, localNumber);
      },
      [localNumber, notifyChange],
    );

    const handleLocalChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value.replace(/\D/g, '');
        setLocalNumber(v);
        const country = COUNTRY_PHONE_CODES.find((c) => c.dialCode === dialCode);
        notifyChange(country?.dialCode ?? dialCode, v);
      },
      [dialCode, notifyChange],
    );

    return (
      <div className={cn('flex gap-2', className)}>
        <Select
          value={dialCode}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px] shrink-0">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_PHONE_CODES.map((c) => (
              <SelectItem key={c.code} value={c.dialCode}>
                {c.dialCode} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="661234567"
          value={localNumber}
          onChange={handleLocalChange}
          disabled={disabled}
          className="min-w-0 flex-1"
          {...inputProps}
        />
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
