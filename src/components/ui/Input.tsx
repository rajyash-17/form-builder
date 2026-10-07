'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-typewriter uppercase tracking-wider text-muted dark:text-fog-grey"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2.5 rounded text-sm font-sans transition-all duration-200',
              'bg-surface text-primary border border-border-color',
              'placeholder:text-fog-grey/60 placeholder:font-typewriter',
              'focus:border-lamp-amber focus:ring-1 focus:ring-lamp-amber focus:shadow-amber-glow',
              error && 'border-string-red focus:border-string-red focus:ring-string-red',
              className
            )
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-typewriter text-string-red tracking-wide flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
