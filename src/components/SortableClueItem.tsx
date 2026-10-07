'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clue } from '@/lib/schemas';
import { ClueRenderer } from './ClueRenderer';

export interface SortableClueItemProps {
  clue: Clue;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function SortableClueItem({
  clue,
  index,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: SortableClueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clue.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative rounded border p-4 transition-all duration-200 paper-grain cursor-pointer ${
        isSelected
          ? 'bg-surface border-lamp-amber shadow-amber-glow ring-1 ring-lamp-amber'
          : 'bg-surface/80 border-border-color hover:border-lamp-amber/60'
      }`}
    >
      {/* Top Header Row with Drag Handle & Index Badge */}
      <div className="flex items-center justify-between border-b border-border-color/60 pb-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle Grip */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-fog-grey hover:text-lamp-amber font-mono text-sm tracking-tighter"
            title="Drag to reorder clue"
            onClick={(e) => e.stopPropagation()}
          >
            ⋮⋮
          </button>
          <span className="font-typewriter text-[10px] text-lamp-amber uppercase tracking-widest px-2 py-0.5 rounded border border-lamp-amber/30 bg-lamp-amber/10">
            CLUE #{index + 1} ({clue.type})
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 px-2 rounded font-typewriter text-xs text-fog-grey hover:text-lamp-amber hover:bg-desk-dark transition-colors"
            title="Duplicate Clue"
          >
            📋 Clone
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 px-2 rounded font-typewriter text-xs text-string-red hover:bg-string-red/20 transition-colors"
            title="Delete Clue"
          >
            🗑️ Remove
          </button>
        </div>
      </div>

      {/* Shared Clue Component Preview */}
      <div className="pointer-events-none select-none">
        <ClueRenderer clue={clue} disabled />
      </div>
    </div>
  );
}
