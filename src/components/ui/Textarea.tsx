'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-typewriter uppercase tracking-wider text-muted dark:text-fog-grey"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2.5 rounded text-sm font-sans transition-all duration-200 resize-y',
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

Textarea.displayName = 'Textarea';
