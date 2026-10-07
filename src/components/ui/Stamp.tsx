'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface StampProps {
  text: string;
  variant?: 'red' | 'amber' | 'grey' | 'green';
  rotation?: 'left' | 'right' | 'none';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Stamp({
  text,
  variant = 'red',
  rotation = 'left',
  size = 'md',
  className,
}: StampProps) {
  const colorStyles = {
    red: 'border-string-red text-string-red bg-string-red/10',
    amber: 'border-lamp-amber text-lamp-amber bg-lamp-amber/10',
    grey: 'border-fog-grey text-fog-grey bg-fog-grey/10',
    green: 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-600/10',
  };

  const rotationStyles = {
    left: '-rotate-6',
    right: 'rotate-6',
    none: 'rotate-0',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 border-2',
    md: 'text-xs px-3 py-1 border-2 tracking-widest',
    lg: 'text-sm px-4 py-1.5 border-4 tracking-widest',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'inline-block font-typewriter font-bold uppercase rounded-sm opacity-90 select-none shadow-sm',
          colorStyles[variant],
          rotationStyles[rotation],
          sizeStyles[size],
          className
        )
      )}
    >
      {text}
    </div>
  );
}
