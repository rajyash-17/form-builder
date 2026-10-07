'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tabTitle?: string;
  children: React.ReactNode;
}

export function Card({ tabTitle, className, children, ...props }: CardProps) {
  return (
    <div className="relative group transition-all duration-300">
      {/* Manila Folder Top Tab */}
      {tabTitle && (
        <div className="inline-block px-4 py-1 bg-paper-dark dark:bg-[#22222c] text-ink-black dark:text-aged-paper font-typewriter text-xs uppercase tracking-widest rounded-t border-t border-x border-border-color shadow-sm -mb-px relative z-10">
          📁 {tabTitle}
        </div>
      )}

      {/* Main Manila Paper Folder Body */}
      <div
        className={twMerge(
          clsx(
            'relative rounded-b rounded-tr p-6 paper-grain border border-border-color shadow-paper-shadow transition-all duration-200',
            'bg-aged-paper text-ink-black dark:bg-[#181820] dark:text-aged-paper',
            'hover:border-lamp-amber/60 hover:shadow-amber-glow',
            className
          )
        )}
        {...props}
      >
        {/* Decorative Paper Staple Graphic on Top Corner */}
        <div className="absolute top-2 right-4 w-6 h-1 bg-gray-400/40 rounded-full dark:bg-gray-600/40 pointer-events-none" />

        {children}
      </div>
    </div>
  );
}
