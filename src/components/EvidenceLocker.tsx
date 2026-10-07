'use client';

import React from 'react';
import { ClueType } from '@/lib/schemas';

export interface EvidenceLockerProps {
  onAddClue: (type: ClueType) => void;
}

interface PaletteItem {
  type: ClueType;
  label: string;
  icon: string;
}

const PALETTE_CATEGORIES: { name: string; items: PaletteItem[] }[] = [
  {
    name: 'TEXT & STATEMENTS',
    items: [
      { type: 'shortText', label: 'Short Answer', icon: '✏️' },
      { type: 'longText', label: 'Detailed Statement', icon: '📝' },
      { type: 'email', label: 'Badge Email', icon: '📧' },
      { type: 'phone', label: 'Phone Line', icon: '📞' },
      { type: 'url', label: 'Web Link', icon: '🔗' },
      { type: 'statement', label: 'Case Note / Statement', icon: '📜' },
      { type: 'pageBreak', label: 'Page Break', icon: '📄' },
    ],
  },
  {
    name: 'CHOICE CLUES',
    items: [
      { type: 'dropdown', label: 'Dropdown List', icon: '🔽' },
      { type: 'multipleChoice', label: 'Multiple Choice', icon: '🔘' },
      { type: 'checkboxes', label: 'Checkboxes', icon: '☑️' },
      { type: 'yesNo', label: 'Yes / No Toggle', icon: '⚖️' },
    ],
  },
  {
    name: 'MEASUREMENTS & DATES',
    items: [
      { type: 'number', label: 'Numeric Quantity', icon: '🔢' },
      { type: 'date', label: 'Incident Date', icon: '📅' },
      { type: 'time', label: 'Exact Time', icon: '⏰' },
      { type: 'rating', label: 'Star Rating', icon: '⭐' },
      { type: 'linearScale', label: 'Linear Scale', icon: '📊' },
    ],
  },
  {
    name: 'EVIDENCE FILES',
    items: [{ type: 'fileUpload', label: 'File Attachment', icon: '📎' }],
  },
];

export function EvidenceLocker({ onAddClue }: EvidenceLockerProps) {
  return (
    <div className="w-full bg-surface border border-border-color rounded p-4 space-y-4 paper-grain h-full overflow-y-auto">
      <div className="border-b border-border-color pb-2">
        <h3 className="font-serif text-sm font-bold text-lamp-amber flex items-center gap-1.5">
          <span>🗄️ Evidence Locker</span>
        </h3>
        <p className="font-typewriter text-[11px] text-fog-grey mt-0.5">
          Click or drag clue types onto the case file canvas.
        </p>
      </div>

      <div className="space-y-4">
        {PALETTE_CATEGORIES.map((cat) => (
          <div key={cat.name} className="space-y-1.5">
            <h4 className="font-typewriter text-[10px] text-fog-grey uppercase tracking-widest px-1">
              {cat.name}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1.5">
              {cat.items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => onAddClue(item.type)}
                  className="flex items-center gap-2 px-3 py-2 rounded border border-border-color/80 bg-desk-dark/60 hover:bg-desk-dark hover:border-lamp-amber text-aged-paper font-typewriter text-xs transition-all duration-150 active:scale-[0.98] text-left group"
                >
                  <span className="text-sm group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="group-hover:text-lamp-amber transition-colors">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
