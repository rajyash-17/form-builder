'use client';

import React, { useEffect } from 'react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded border border-border-color bg-aged-paper text-ink-black dark:bg-desk-dark dark:text-aged-paper paper-grain p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4">
          <h3 className="font-serif text-xl font-bold tracking-tight text-lamp-amber">
            📋 {title}
          </h3>
          <button
            onClick={onClose}
            className="text-fog-grey hover:text-lamp-amber text-lg font-bold p-1 rounded transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close File
          </Button>
        </div>
      </div>
    </div>
  );
}
