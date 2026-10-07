'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { ThemeToggle } from './ui/ThemeToggle';
import { Button } from './ui/Button';

export function Navbar() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: userData } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      // Clear user data in tRPC cache immediately
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      router.push('/login');
      router.refresh();
    },
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-color bg-desk-dark/95 backdrop-blur paper-grain text-aged-paper shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">🔍</span>
          <span className="font-serif text-xl font-bold tracking-tight text-aged-paper group-hover:text-lamp-amber transition-colors">
            Form<span className="text-lamp-amber">Flow</span>
          </span>
          <span className="font-typewriter text-[10px] text-fog-grey uppercase tracking-widest px-1.5 py-0.5 border border-fog-grey/30 rounded ml-1 hidden sm:inline-block">
            HQ ARCHIVES
          </span>
        </Link>

        {/* Navigation & User Menu */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {userData ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="font-typewriter text-xs text-aged-paper hover:text-lamp-amber transition-colors hidden sm:inline-block"
              >
                📁 Desk Archives
              </Link>
              <div className="flex items-center gap-2 bg-surface px-3 py-1 rounded border border-border-color text-xs font-typewriter text-lamp-amber">
                <span>🎖️ {userData.name}</span>
                <span className="text-fog-grey">({userData.badgeNumber})</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? 'Clocking Out...' : 'Clock Out'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Agent Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Enlist Agent
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
