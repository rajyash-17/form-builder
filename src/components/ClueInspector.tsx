'use client';

import React from 'react';
import { Clue } from '@/lib/schemas';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

export interface ClueInspectorProps {
  clue: Clue | null;
  allClues?: Clue[];
  onUpdateClue: (updated: Clue) => void;
  onClose?: () => void;
}

export function ClueInspector({ clue, allClues = [], onUpdateClue, onClose }: ClueInspectorProps) {
  if (!clue) {
    return (
      <div className="w-full bg-surface border border-border-color rounded p-6 text-center paper-grain h-full flex flex-col items-center justify-center">
        <div className="text-3xl mb-2">🔍</div>
        <h4 className="font-serif text-base font-bold text-lamp-amber">No Clue Selected</h4>
        <p className="font-typewriter text-xs text-fog-grey max-w-xs mt-1">
          Select any clue on the canvas to inspect and edit its properties.
        </p>
      </div>
    );
  }

  const handleFieldChange = (field: keyof Clue, val: unknown) => {
    onUpdateClue({
      ...clue,
      [field]: val,
    });
  };

  const handleValidationChange = (vField: string, val: unknown) => {
    onUpdateClue({
      ...clue,
      validation: {
        ...(clue.validation || {}),
        [vField]: val,
      },
    });
  };

  const handleOptionChange = (idx: number, newOptionVal: string) => {
    const currentOptions = [...(clue.options || [])];
    currentOptions[idx] = newOptionVal;
    handleFieldChange('options', currentOptions);
  };

  const handleAddOption = () => {
    const currentOptions = [...(clue.options || [])];
    currentOptions.push(`Option ${currentOptions.length + 1}`);
    handleFieldChange('options', currentOptions);
  };

  const handleRemoveOption = (idx: number) => {
    const currentOptions = [...(clue.options || [])];
    currentOptions.splice(idx, 1);
    handleFieldChange('options', currentOptions);
  };

  // Compute preceding clues to prevent circular & forward references
  const currentIdx = allClues.findIndex((c) => c.id === clue.id);
  const precedingClues = (currentIdx > 0 ? allClues.slice(0, currentIdx) : []).filter(
    (c) => c.type !== 'statement' && c.type !== 'pageBreak'
  );

  const isChoiceType = ['dropdown', 'multipleChoice', 'checkboxes'].includes(clue.type);
  const isScaleType = clue.type === 'linearScale';
  const isRatingType = clue.type === 'rating';
  const isFileType = clue.type === 'fileUpload';
  const isNumberOrText = ['shortText', 'longText', 'number'].includes(clue.type);
  const isPageBreak = clue.type === 'pageBreak';

  const selectedTargetClue = precedingClues.find((c) => c.id === clue.showIf?.fieldId);

  return (
    <div className="w-full bg-surface border border-border-color rounded p-4 space-y-4 paper-grain h-full overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border-color pb-2">
        <div>
          <h3 className="font-serif text-sm font-bold text-lamp-amber flex items-center gap-1.5">
            <span>⚙️ Clue Inspector</span>
          </h3>
          <p className="font-typewriter text-[11px] text-fog-grey">
            ID: <span className="text-primary font-mono">{clue.id}</span> ({clue.type})
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-fog-grey hover:text-lamp-amber font-bold text-xs p-1"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Label Editor */}
        <Input
          label={isPageBreak ? 'Page Break Title / Header' : 'Clue Title / Question'}
          value={clue.label}
          onChange={(e) => handleFieldChange('label', e.target.value)}
        />

        {/* Help Text / Subtitle */}
        {!isPageBreak && (
          <Textarea
            label="Help Text / Subtitle (Optional)"
            value={clue.helpText || ''}
            onChange={(e) => handleFieldChange('helpText', e.target.value)}
            rows={2}
            placeholder="Additional instructions for the witness..."
          />
        )}

        {/* Placeholder Editor */}
        {clue.type !== 'statement' &&
          !isPageBreak &&
          !isChoiceType &&
          !isScaleType &&
          !isRatingType &&
          !isFileType && (
            <Input
              label="Input Placeholder Text"
              value={clue.placeholder || ''}
              onChange={(e) => handleFieldChange('placeholder', e.target.value)}
              placeholder="e.g. Enter value..."
            />
          )}

        {/* Required Toggle */}
        {clue.type !== 'statement' && !isPageBreak && (
          <div className="flex items-center justify-between p-3 rounded border border-border-color/70 bg-desk-dark/40">
            <label htmlFor="requiredToggle" className="font-typewriter text-xs text-primary cursor-pointer select-none">
              Mandatory Witness Response
            </label>
            <input
              id="requiredToggle"
              type="checkbox"
              checked={clue.required || false}
              onChange={(e) => handleFieldChange('required', e.target.checked)}
              className="w-4 h-4 accent-lamp-amber cursor-pointer rounded"
            />
          </div>
        )}

        {/* Choice Options Editor */}
        {isChoiceType && (
          <div className="space-y-2 border-t border-border-color pt-3">
            <label className="block font-typewriter text-xs uppercase tracking-wider text-muted dark:text-fog-grey">
              Options List
            </label>
            <div className="space-y-2">
              {(clue.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-string-red hover:bg-string-red/20 rounded font-typewriter text-xs"
                    title="Remove Option"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleAddOption} className="w-full mt-2">
              ➕ Add Option
            </Button>
          </div>
        )}

        {/* Rating Star Count Editor */}
        {isRatingType && (
          <div className="space-y-2 border-t border-border-color pt-3">
            <Input
              label="Maximum Star Rating Count (3 - 10)"
              type="number"
              min={3}
              max={10}
              value={clue.validation?.max || 5}
              onChange={(e) => handleValidationChange('max', Number(e.target.value))}
            />
          </div>
        )}

        {/* Linear Scale Min/Max Editor */}
        {isScaleType && (
          <div className="space-y-3 border-t border-border-color pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Scale Minimum"
                type="number"
                value={clue.validation?.min ?? 1}
                onChange={(e) => handleValidationChange('min', Number(e.target.value))}
              />
              <Input
                label="Scale Maximum"
                type="number"
                value={clue.validation?.max ?? 5}
                onChange={(e) => handleValidationChange('max', Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* File Upload Limits Editor */}
        {isFileType && (
          <div className="space-y-3 border-t border-border-color pt-3">
            <Input
              label="Max File Size (MB)"
              type="number"
              value={clue.validation?.max || 10}
              onChange={(e) => handleValidationChange('max', Number(e.target.value))}
            />
          </div>
        )}

        {/* Number or Text Min/Max Editor */}
        {isNumberOrText && (
          <div className="grid grid-cols-2 gap-2 border-t border-border-color pt-3">
            <Input
              label="Min Limit / Length"
              type="number"
              value={clue.validation?.min ?? ''}
              onChange={(e) =>
                handleValidationChange('min', e.target.value ? Number(e.target.value) : undefined)
              }
            />
            <Input
              label="Max Limit / Length"
              type="number"
              value={clue.validation?.max ?? ''}
              onChange={(e) =>
                handleValidationChange('max', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
        )}

        {/* Conditional Logic Section: "Only ask if..." */}
        {!isPageBreak && (
          <div className="border-t border-border-color pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-serif text-xs font-bold text-lamp-amber flex items-center gap-1">
                <span>🔀 Display Rule: "Only ask if..."</span>
              </label>
              <input
                type="checkbox"
                checked={Boolean(clue.showIf)}
                onChange={(e) => {
                  if (e.target.checked) {
                    const defaultTarget = precedingClues[0]?.id || '';
                    handleFieldChange('showIf', {
                      fieldId: defaultTarget,
                      operator: 'equals',
                      value: '',
                    });
                  } else {
                    handleFieldChange('showIf', undefined);
                  }
                }}
                className="w-4 h-4 accent-lamp-amber cursor-pointer rounded"
              />
            </div>

            {clue.showIf && (
              <div className="p-3 rounded border border-border-color/80 bg-desk-dark/60 space-y-3">
                {precedingClues.length === 0 ? (
                  <p className="font-typewriter text-xs text-string-red italic">
                    ⚠️ Move or place this clue below another question on the canvas to set a display condition.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-typewriter text-fog-grey uppercase mb-1">
                        Preceding Target Clue
                      </label>
                      <select
                        value={clue.showIf.fieldId}
                        onChange={(e) =>
                          handleFieldChange('showIf', {
                            ...clue.showIf,
                            fieldId: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-2 rounded text-xs bg-surface text-primary border border-border-color focus:border-lamp-amber"
                      >
                        {precedingClues.map((pc) => (
                          <option key={pc.id} value={pc.id}>
                            {pc.label} ({pc.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-typewriter text-fog-grey uppercase mb-1">
                        Operator
                      </label>
                      <select
                        value={clue.showIf.operator}
                        onChange={(e) =>
                          handleFieldChange('showIf', {
                            ...clue.showIf,
                            operator: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-2 rounded text-xs bg-surface text-primary border border-border-color focus:border-lamp-amber"
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Does Not Equal</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater Than (&gt;)</option>
                        <option value="less_than">Less Than (&lt;)</option>
                        <option value="is_empty">Is Empty</option>
                        <option value="is_not_empty">Is Not Empty</option>
                      </select>
                    </div>

                    {clue.showIf.operator !== 'is_empty' && clue.showIf.operator !== 'is_not_empty' && (
                      <div>
                        <label className="block text-[11px] font-typewriter text-fog-grey uppercase mb-1">
                          Condition Target Value
                        </label>
                        {selectedTargetClue && selectedTargetClue.options && selectedTargetClue.options.length > 0 ? (
                          <select
                            value={clue.showIf.value || ''}
                            onChange={(e) =>
                              handleFieldChange('showIf', {
                                ...clue.showIf,
                                value: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-2 rounded text-xs bg-surface text-primary border border-border-color focus:border-lamp-amber"
                          >
                            <option value="">-- Select Target Option --</option>
                            {selectedTargetClue.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : selectedTargetClue && selectedTargetClue.type === 'yesNo' ? (
                          <select
                            value={clue.showIf.value || ''}
                            onChange={(e) =>
                              handleFieldChange('showIf', {
                                ...clue.showIf,
                                value: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-2 rounded text-xs bg-surface text-primary border border-border-color focus:border-lamp-amber"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : (
                          <Input
                            placeholder="Target value..."
                            value={clue.showIf.value || ''}
                            onChange={(e) =>
                              handleFieldChange('showIf', {
                                ...clue.showIf,
                                value: e.target.value,
                              })
                            }
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
