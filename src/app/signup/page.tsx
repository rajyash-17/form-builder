'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Stamp } from '@/components/ui/Stamp';

export default function SignupPage() {
  const router = useRouter();

  const [agentName, setAgentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
      router.refresh();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to enlist agent in agency archives.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agentName || !email || !password) {
      setErrorMsg('All credential fields are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Passcode must be at least 8 characters long.');
      return;
    }

    signupMutation.mutate({ agentName, email, password });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card tabTitle="NEW AGENT REGISTRATION FORM">
          <div className="text-center mb-6">
            <Stamp text="OFFICIAL ENLISTMENT" variant="amber" rotation="right" size="sm" className="mb-3" />
            <h2 className="font-serif text-2xl font-bold text-ink-black dark:text-aged-paper">
              Enlist New Detective Badge
            </h2>
            <p className="font-typewriter text-xs text-muted dark:text-fog-grey mt-1">
              Join FormFlow Detective Bureau and start opening case files.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Detective Name / Badge Alias"
              type="text"
              placeholder="e.g. Detective Sam Spade"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              required
              disabled={signupMutation.isPending}
            />

            <Input
              label="Detective Badge Email"
              type="email"
              placeholder="spade@detective-agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={signupMutation.isPending}
            />

            <Input
              label="Secret Passcode (Min 8 Characters)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={signupMutation.isPending}
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
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? 'Enlisting Agent...' : '🎖️ Issue Badge & Enlist'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border-color/50 text-center font-typewriter text-xs text-fog-grey">
            <span>Already hold a detective badge? </span>
            <Link href="/login" className="text-lamp-amber underline hover:text-amber-400">
              Agent Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
