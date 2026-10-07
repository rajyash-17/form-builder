'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type CaseStatusType = 'draft' | 'published' | 'closed';

export interface BadgeProps {
  status: CaseStatusType;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const statusConfig = {
    draft: {
      label: 'Open case',
      styles: 'bg-lamp-amber/20 text-lamp-amber border-lamp-amber/50',
      icon: '📁',
    },
    published: {
      label: 'Active',
      styles: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50',
      icon: '🔍',
    },
    closed: {
      label: 'Cold case',
      styles: 'bg-fog-grey/20 text-fog-grey border-fog-grey/50',
      icon: '❄️',
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-typewriter tracking-wide border',
          config.styles,
          className
        )
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
