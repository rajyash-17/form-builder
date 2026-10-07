'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Stamp } from '@/components/ui/Stamp';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Detected System Anomaly / Error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-ink-black text-aged-paper flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#b3261e_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-desk-dark/90 border border-string-red/40 rounded-lg p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <Stamp variant="red" text="TAMPERED EVIDENCE" size="lg" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-string-red mb-3">
          Critical Anomaly Detected
        </h1>

        <p className="font-sans text-aged-paper/80 mb-6 text-sm leading-relaxed">
          The evidence record was interrupted or corrupted during processing. Bureau investigators have logged the breach.
        </p>

        <div className="flex justify-center gap-4">
          <Button variant="primary" size="md" onClick={() => reset()}>
            Re-examine Evidence
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" size="md">
              Return to Case Docket
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
