import { useId, useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { SUPPORTED_LOCALES } from '@shared/types';
import type { LocaleCode, LocalizedString } from '@shared/types';

const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  nl: 'Nederlands',
  es: 'Español',
  it: 'Italiano',
  ja: '日本語 (JP)',
  zh: '中文 (简体) (CN)',
};

export interface LocalizedTextEditorProps {
  layer: 'project' | 'global';
  value: LocalizedString | null | undefined;
  onChange: (value: LocalizedString | null | undefined) => void;
  label: string;
  helpText?: string;
  builtInPreview?: Partial<Record<LocaleCode, string>>;
  disabled?: boolean;
}

function isCustom(value: LocalizedString | null | undefined): boolean {
  return value !== undefined && value !== null;
}

export function LocalizedTextEditor({
  layer,
  value,
  onChange,
  label,
  helpText,
  builtInPreview,
  disabled = false,
}: LocalizedTextEditorProps) {
  const fieldId = useId();
  const switchId = useId();
  const customMode = isCustom(value);
  const [activeLocale, setActiveLocale] = useState<LocaleCode>('en');

  useEffect(() => {
    if (!customMode) setActiveLocale('en');
  }, [customMode]);

  const customValue: LocalizedString = value && typeof value === 'object' ? value : { en: '' };

  const handleToggleCustom = (next: boolean) => {
    if (next) {
      if (!value || typeof value !== 'object') onChange({ en: '' });
      return;
    }
    // Off: project layer inherits (undefined), global layer falls back to built-in (null).
    onChange(layer === 'project' ? undefined : null);
  };

  const handleLocaleChange = (locale: LocaleCode, next: string) => {
    const current: LocalizedString = value && typeof value === 'object' ? value : { en: '' };
    if (locale === 'en') {
      onChange({ ...current, en: next });
      return;
    }
    if (next === '') {
      const cloned: Record<string, string> = { ...current };
      delete cloned[locale];
      onChange(cloned as LocalizedString);
      return;
    }
    onChange({ ...current, [locale]: next } as LocalizedString);
  };

  const isEn = activeLocale === 'en';
  const inheritedForLocale = builtInPreview?.[activeLocale] ?? '';
  const noTextLabel = '(no text — icon only)';
  const enValue = customValue.en ?? '';

  const displayValue = customMode ? (customValue[activeLocale] ?? '') : inheritedForLocale;
  const placeholder = customMode
    ? isEn
      ? (builtInPreview?.en ?? '')
      : enValue || builtInPreview?.[activeLocale] || ''
    : inheritedForLocale
      ? ''
      : noTextLabel;

  const switchAriaLabel =
    layer === 'project' ? `Override ${label} at project level` : `Use custom ${label}`;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-normal">{label}</Label>
          {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
        </div>
        <Switch
          id={switchId}
          checked={customMode}
          onCheckedChange={handleToggleCustom}
          disabled={disabled}
          aria-label={switchAriaLabel}
          className="mt-1 flex-shrink-0"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={activeLocale}
          onValueChange={(v) => setActiveLocale(v as LocaleCode)}
          disabled={disabled}
        >
          <SelectTrigger className="w-44 flex-shrink-0" aria-label="Language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LOCALES.map((code) => {
              const hasValue = (customValue[code] ?? '').length > 0;
              return (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span>{LOCALE_LABELS[code]}</span>
                    {code === 'en' ? (
                      <span className="text-red-500" aria-label="required">
                        *
                      </span>
                    ) : null}
                    {customMode && hasValue && code !== 'en' ? (
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                        aria-label="has value"
                      />
                    ) : null}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Input
          id={`${fieldId}-${activeLocale}`}
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled || !customMode}
          onChange={(e) => handleLocaleChange(activeLocale, e.target.value)}
          aria-required={customMode && isEn ? true : undefined}
          className="flex-1"
        />
      </div>
    </div>
  );
}
