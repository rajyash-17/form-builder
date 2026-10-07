'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Stamp } from '@/components/ui/Stamp';
import { Spinner } from '@/components/ui/Spinner';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      router.push(from);
      router.refresh();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Invalid badge email or secret passcode.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both your agent email badge and passcode.');
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Detective Badge Email"
        type="email"
        placeholder="detective@agency.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loginMutation.isPending}
      />

      <Input
        label="Secret Passcode"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loginMutation.isPending}
      />

      {errorMsg && (
        <div className="p-3 bg-string-red/10 border border-string-red/40 rounded text-string-red font-typewriter text-xs flex items-center gap-2">
          <span>🚨</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Verifying Badge...' : '🔓 Enter Headquarters'}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card tabTitle="AGENT CREDENTIALS VERIFICATION">
          <div className="text-center mb-6">
            <Stamp text="RESTRICTED ACCESS" variant="red" rotation="left" size="sm" className="mb-3" />
            <h2 className="font-serif text-2xl font-bold text-ink-black dark:text-aged-paper">
              Identify Yourself, Detective
            </h2>
            <p className="font-typewriter text-xs text-muted dark:text-fog-grey mt-1">
              Enter your badge email and secret passcode to access HQ Archives.
            </p>
          </div>

          <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-4 border-t border-border-color/50 text-center font-typewriter text-xs text-fog-grey">
            <span>Not enlisted in the agency yet? </span>
            <Link href="/signup" className="text-lamp-amber underline hover:text-amber-400">
              Issue Badge & Register
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
