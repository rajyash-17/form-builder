'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Stamp } from '@/components/ui/Stamp';

export interface DetectiveVerdictCardProps {
  caseId: string;
}

export function DetectiveVerdictCard({ caseId }: DetectiveVerdictCardProps) {
  const [verdictData, setVerdictData] = useState<{
    verdict: string;
    bulletPoints: string[];
    sampleSize: number;
    disclaimer?: string;
  } | null>(null);

  const summarizeMutation = trpc.ai.summarizeResponses.useMutation({
    onSuccess: (data) => {
      setVerdictData(data);
    },
    onError: (err) => {
      alert(err.message || 'Failed to generate AI verdict summary.');
    },
  });

  const handleGenerateVerdict = () => {
    summarizeMutation.mutate({ caseId });
  };

  return (
    <Card tabTitle="DETECTIVE'S VERDICT • AI TESTIMONY SUMMARY">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-color pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-lamp-amber flex items-center gap-2">
              <span>🕵️‍♂️ Detective's Verdict</span>
              {verdictData && (
                <Stamp text={`SAMPLE: ${verdictData.sampleSize} DEPOSITIONS`} variant="amber" rotation="left" size="sm" />
              )}
            </h3>
            <p className="font-typewriter text-xs text-fog-grey mt-0.5">
              Automated executive synthesis of witness deposition testimonies.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateVerdict}
            disabled={summarizeMutation.isPending}
          >
            {summarizeMutation.isPending ? 'Analyzing Depositions...' : verdictData ? '🔄 Refresh Verdict' : '⚡ Generate Verdict'}
          </Button>
        </div>

        {summarizeMutation.isPending && (
          <div className="flex items-center gap-3 py-6 justify-center font-typewriter text-xs text-lamp-amber animate-pulse">
            <Spinner className="w-6 h-6" />
            <span>Analyzing sworn witness statements & extracting key testimony patterns...</span>
          </div>
        )}

        {verdictData && !summarizeMutation.isPending && (
          <div className="space-y-4">
            {/* Executive Verdict Box */}
            <div className="p-4 rounded border border-lamp-amber/40 bg-lamp-amber/5 font-serif text-sm text-aged-paper leading-relaxed">
              "{verdictData.verdict}"
            </div>

            {/* Bullet Observations */}
            <div className="space-y-2">
              <label className="block font-typewriter text-xs uppercase tracking-wider text-fog-grey">
                Key Testimony Observations
              </label>
              <div className="space-y-2">
                {verdictData.bulletPoints.map((bp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded border border-border-color/70 bg-desk-dark/60 font-typewriter text-xs text-primary leading-relaxed flex items-start gap-2"
                  >
                    <span className="text-lamp-amber font-bold">▪</span>
                    <span>{bp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Provider Data Privacy Disclosure Warning */}
            <div className="p-3 rounded border border-border-color/80 bg-surface/60 font-typewriter text-[11px] text-fog-grey space-y-1">
              <p className="font-bold text-amber-500 flex items-center gap-1">
                <span>⚠️ AI Data Privacy Disclosure</span>
              </p>
              <p className="leading-relaxed">
                {verdictData.disclaimer ||
                  'A capped sample of text testimony statements is processed by Anthropic AI provider services to generate insights. No physical evidence file attachments are accessed or uploaded.'}
              </p>
            </div>
          </div>
        )}

        {!verdictData && !summarizeMutation.isPending && (
          <p className="font-typewriter text-xs text-fog-grey italic py-2">
            Click "Generate Verdict" above to synthesize witness deposition themes into executive detective notes.
          </p>
        )}
      </div>
    </Card>
  );
}
