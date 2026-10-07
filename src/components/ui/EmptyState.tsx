'use client';

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No Open Cases Found in Archives',
  description = 'The desk is clean and the typewriter is quiet, detective. Time to open your first case file.',
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border-color rounded-lg paper-grain bg-surface/40 my-6">
      <div className="text-4xl mb-3">🕵️‍♂️</div>
      <h3 className="font-serif text-lg font-bold text-lamp-amber mb-2">{title}</h3>
      <p className="font-sans text-sm text-fog-grey max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          📁 {actionText}
        </Button>
      )}
    </div>
  );
}
