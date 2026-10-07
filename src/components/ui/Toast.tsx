'use client';

import React from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const typeStyles = {
    success: 'border-emerald-600 text-emerald-400 bg-emerald-950/80',
    error: 'border-string-red text-red-300 bg-red-950/80',
    info: 'border-lamp-amber text-amber-200 bg-amber-950/80',
  };

  const icons = {
    success: '📜',
    error: '🚨',
    info: '🔍',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded border font-typewriter text-xs shadow-2xl backdrop-blur ${typeStyles[type]}`}
    >
      <span className="text-base">{icons[type]}</span>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-70 text-sm font-bold"
          aria-label="Dismiss toast"
        >
          ✕
        </button>
      )}
    </div>
  );
}
