'use client';

import React from 'react';

export function Spinner({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div className={`inline-block animate-spin text-lamp-amber ${className}`} role="status">
      🔍
      <span className="sr-only">Scanning clues...</span>
    </div>
  );
}
