'use client';

import React from 'react';
import { Clue } from '@/lib/schemas';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

export interface ClueRendererProps {
  clue: Clue;
  value?: unknown;
  onChange?: (val: unknown) => void;
  disabled?: boolean;
}

export function ClueRenderer({ clue, value, onChange, disabled = false }: ClueRendererProps) {
  const { id, type, label, helpText, required, placeholder, options = [], validation } = clue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (onChange) onChange(e.target.value);
  };

  return (
    <div className="w-full space-y-2 text-left">
      {/* Label and Required Star */}
      {type !== 'statement' && (
        <div>
          <label className="block font-serif text-sm font-bold text-ink-black dark:text-aged-paper">
            {label}
            {required && <span className="text-string-red ml-1 font-sans">*</span>}
          </label>
          {helpText && (
            <p className="font-typewriter text-xs text-muted dark:text-fog-grey mt-0.5">
              {helpText}
            </p>
          )}
        </div>
      )}

      {/* Field Input Variant Rendering */}
      {(() => {
        switch (type) {
          case 'pageBreak':
            return (
              <div className="py-3 my-2 border-y border-dashed border-lamp-amber/60 flex items-center justify-between text-lamp-amber font-typewriter text-xs bg-lamp-amber/5 px-4 rounded select-none">
                <span className="flex items-center gap-2 font-bold">
                  <span>📄 PAGE BREAK</span>
                  <span className="text-fog-grey font-normal">({label || 'New Interrogation Page'})</span>
                </span>
                <span className="text-[10px] text-fog-grey uppercase tracking-widest">Page Division</span>
              </div>
            );

          case 'statement':
            return (
              <div className="p-4 rounded border border-border-color bg-surface/50 paper-grain">
                <h4 className="font-serif text-base font-bold text-lamp-amber">{label}</h4>
                {helpText && <p className="font-sans text-xs text-fog-grey mt-1">{helpText}</p>}
              </div>
            );

          case 'shortText':
            return (
              <Input
                placeholder={placeholder || 'Enter short answer...'}
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );

          case 'longText':
            return (
              <Textarea
                placeholder={placeholder || 'Enter detailed statement...'}
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
                rows={3}
              />
            );

          case 'email':
            return (
              <Input
                type="email"
                placeholder={placeholder || 'witness@agency.com'}
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );

          case 'number':
            return (
              <Input
                type="number"
                placeholder={placeholder || '0'}
                min={validation?.min}
                max={validation?.max}
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );

          case 'phone':
            return (
              <Input
                type="tel"
                placeholder={placeholder || '+1 (555) 000-0000'}
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );

          case 'url':
            return (
              <Input
                type="url"
                placeholder={placeholder || 'https://...'}
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );

          case 'date':
            return (
              <Input
                type="date"
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );

          case 'time':
            return (
              <Input
                type="time"
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );

          case 'dropdown':
            return (
              <Select
                options={[
                  { value: '', label: '-- Select Option --' },
                  ...options.map((opt) => ({ value: opt, label: opt })),
                ]}
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );

          case 'multipleChoice':
            return (
              <div className="space-y-2 pt-1">
                {options.map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 font-sans text-xs text-primary cursor-pointer select-none">
                    <input
                      type="radio"
                      name={`radio-${id}`}
                      value={opt}
                      checked={value === opt}
                      onChange={() => onChange && onChange(opt)}
                      disabled={disabled}
                      className="accent-lamp-amber text-lamp-amber"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            );

          case 'checkboxes': {
            const selectedArr = Array.isArray(value) ? (value as string[]) : [];
            const handleCheckboxToggle = (opt: string) => {
              if (!onChange) return;
              if (selectedArr.includes(opt)) {
                onChange(selectedArr.filter((item) => item !== opt));
              } else {
                onChange([...selectedArr, opt]);
              }
            };
            return (
              <div className="space-y-2 pt-1">
                {options.map((opt, idx) => (
                  <label key={idx} className="flex items-center gap-2 font-sans text-xs text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      value={opt}
                      checked={selectedArr.includes(opt)}
                      onChange={() => handleCheckboxToggle(opt)}
                      disabled={disabled}
                      className="accent-lamp-amber text-lamp-amber rounded"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            );
          }

          case 'rating': {
            const maxRating = Math.min(Math.max(validation?.max || 5, 3), 10);
            const currentRating = Number(value) || 0;
            return (
              <div className="flex items-center gap-1.5 pt-1">
                {Array.from({ length: maxRating }).map((_, i) => {
                  const starVal = i + 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange && onChange(starVal)}
                      className={`text-xl transition-transform ${
                        starVal <= currentRating ? 'text-lamp-amber scale-110' : 'text-fog-grey/40 hover:text-lamp-amber/60'
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            );
          }

          case 'linearScale': {
            const minVal = validation?.min ?? 1;
            const maxVal = validation?.max ?? 5;
            const scaleCount = Math.max(maxVal - minVal + 1, 2);
            return (
              <div className="flex items-center justify-between gap-2 pt-2 bg-surface/40 p-3 rounded border border-border-color">
                <span className="font-typewriter text-[11px] text-fog-grey">{minVal}</span>
                <div className="flex items-center gap-4">
                  {Array.from({ length: scaleCount }).map((_, i) => {
                    const num = minVal + i;
                    return (
                      <label key={num} className="flex flex-col items-center gap-1 cursor-pointer text-xs font-typewriter">
                        <input
                          type="radio"
                          name={`scale-${id}`}
                          value={num}
                          checked={Number(value) === num}
                          onChange={() => onChange && onChange(num)}
                          disabled={disabled}
                          className="accent-lamp-amber"
                        />
                        <span>{num}</span>
                      </label>
                    );
                  })}
                </div>
                <span className="font-typewriter text-[11px] text-fog-grey">{maxVal}</span>
              </div>
            );
          }

          case 'yesNo':
            return (
              <div className="flex items-center gap-3 pt-1">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange && onChange(opt)}
                    className={`px-4 py-1.5 rounded font-typewriter text-xs transition-colors border ${
                      value === opt
                        ? 'bg-lamp-amber text-ink-black border-lamp-amber font-bold shadow-amber-glow'
                        : 'bg-surface text-primary border-border-color hover:border-lamp-amber'
                    }`}
                  >
                    {opt === 'Yes' ? '👍 Yes' : '👎 No'}
                  </button>
                ))}
              </div>
            );

          case 'fileUpload':
            return (
              <div className="p-4 border-2 border-dashed border-border-color rounded text-center bg-surface/30">
                <div className="text-2xl mb-1">📎</div>
                <p className="font-typewriter text-xs text-primary mb-1">
                  Drag and drop witness evidence file or click to browse
                </p>
                <p className="font-sans text-[10px] text-fog-grey">
                  Max file size: {validation?.max || 10} MB
                </p>
                <input type="file" disabled={disabled} className="mt-2 text-xs font-typewriter text-fog-grey" />
              </div>
            );

          default:
            return (
              <Input
                placeholder="Enter response..."
                value={(value as string) || ''}
                onChange={handleChange}
                disabled={disabled}
              />
            );
        }
      })()}
    </div>
  );
}
